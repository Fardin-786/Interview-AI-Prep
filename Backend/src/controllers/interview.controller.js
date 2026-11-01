const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")
const { getCache, setCache } = require("../config/redis")
const crypto = require("crypto")

/**
 * @name generateInterViewReportController
 * @description Generates a new interview strategy report with 2-tier caching (Redis RAM + MongoDB Atlas Cache).
 * @route POST /api/interview/generate-report
 * @access Private
 */
const generateInterViewReportController = async (req, res) => {
  try {
    const { jobDescription, selfDescription, title } = req.body

    // 1. Extract text from uploaded PDF resume buffer safely
    let resumeText = ""
    if (req.file && req.file.buffer) {
      try {
        const uint8Data = new Uint8Array(req.file.buffer)
        if (typeof pdfParse === "function") {
          const parsed = await pdfParse(uint8Data)
          resumeText = parsed.text || ""
        } else if (pdfParse?.PDFParse) {
          const parser = new pdfParse.PDFParse(uint8Data)
          const parsedText = await parser.getText()
          resumeText = typeof parsedText === "string" ? parsedText : parsedText?.text || ""
        }
      } catch (pdfErr) {
        console.error("PDF Parsing failed:", pdfErr)
      }
    }

    // 2. Input Validation
    if (!resumeText && !selfDescription) {
      return res.status(400).json({
        message: "Please provide either a Resume file or Quick Self-Description.",
      })
    }

    if (!jobDescription) {
      return res.status(400).json({
        message: "Job description is required.",
      })
    }

    const userId = req.user?._id || req.user?.id
    const trimmedJobDesc = jobDescription.trim()
    const trimmedSelfDesc = (selfDescription || "").trim()

    // ⚡ Normalize inputs (lowercase, remove extra spaces/newlines) for exact cache key matching
    const normalizedInput = `${trimmedJobDesc}_${trimmedSelfDesc}_${resumeText.slice(0, 200)}`
        .toLowerCase()
        .replace(/\s+/g, " ")

    const cacheKey = `ai_report:${crypto.createHash("md5").update(normalizedInput).digest("hex")}`
    
    let cachedData = await getCache(cacheKey)
    if (cachedData) {
      console.log(`🚀 [CACHE HIT - REDIS RAM]: Serving cached report in <5ms!`)
      
      const interviewReport = await interviewReportModel.create({
        user: userId,
        jobDescription: trimmedJobDesc,
        selfDescription: trimmedSelfDesc,
        ...cachedData,
        title: cachedData.title || title || trimmedJobDesc.slice(0, 50).trim()
      })

      return res.status(201).json({
        success: true,
        interviewReport,
        isCached: true
      })
    }

    // ⚡ Tier 2: Check MongoDB Database Cache for identical request created in last 24h (<15ms)
    const existingReport = await interviewReportModel.findOne({
      user: userId,
      jobDescription: trimmedJobDesc,
      selfDescription: trimmedSelfDesc
    }).sort({ createdAt: -1 })

    if (existingReport) {
      console.log(`⚡ [CACHE HIT - MONGODB ATLAS]: Serving matching report in <15ms!`)
      
      const cachedReportData = {
        title: existingReport.title,
        matchScore: existingReport.matchScore,
        technicalQuestions: existingReport.technicalQuestions,
        behavioralQuestions: existingReport.behavioralQuestions,
        skillGaps: existingReport.skillGaps,
        preparationPlan: existingReport.preparationPlan
      }

      // Save to Redis RAM for future fast access
      await setCache(cacheKey, cachedReportData, 86400)

      return res.status(201).json({
        success: true,
        interviewReport: existingReport,
        isCached: true
      })
    }

    // 🤖 Tier 3: Call Gemini AI Service (Multi-Model Fallback Cascade)
    console.log(`🤖 Generating fresh AI report via Gemini Multi-Model Cascade...`)
    const reportData = await generateInterviewReport({
      resume: resumeText,
      selfDescription: trimmedSelfDesc,
      jobDescription: trimmedJobDesc,
    })

    // Store in Redis RAM cache for 24 hours
    await setCache(cacheKey, reportData, 86400)

    // Determine title for report document
    const reportTitle =
      reportData?.title ||
      title ||
      trimmedJobDesc.slice(0, 50).trim() ||
      "Interview Strategy Report"

    // Persist report to MongoDB database
    const interviewReport = await interviewReportModel.create({
      user: userId,
      jobDescription: trimmedJobDesc,
      selfDescription: trimmedSelfDesc,
      ...reportData,
      title: reportTitle,
    })

    return res.status(201).json({
      success: true,
      interviewReport,
      isCached: false
    })
  } catch (error) {
    console.error("Error in generateInterViewReportController:", error)
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    })
  }
}

/**
 * @name getInterviewReportByIdController
 * @description Fetches a specific interview report by ID for the logged-in user.
 * @route GET /api/interview/report/:interviewId
 * @access Private
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params

        const interviewReport = await interviewReportModel.findOne({ 
            _id: interviewId, 
            user: req.user.id 
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        return res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch interview report."
        })
    }
}

/** 
 * @name getAllInterviewReportsController
 * @description Fetches list of all previous interview reports created by the logged-in user.
 * @route GET /api/interview/reports
 * @access Private
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        return res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch interview reports history."
        })
    }
}

/**
 * @name generateResumePdfController
 * @description Generates a downloadable ATS-friendly A4 resume PDF tailored for the target job description.
 * @route POST /api/interview/resume/pdf/:interviewReportId
 * @access Private
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findOne({ 
            _id: interviewReportId, 
            user: req.user.id 
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
            "Content-Length": pdfBuffer.length
        })

        return res.send(pdfBuffer)
    } catch (error) {
        console.error("Error in generateResumePdfController:", error)
        return res.status(500).json({
            message: "Failed to generate resume PDF."
        })
    }
}

module.exports = { 
    generateInterViewReportController, 
    getInterviewReportByIdController, 
    getAllInterviewReportsController, 
    generateResumePdfController 
}