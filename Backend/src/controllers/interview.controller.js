const pdfParse = require("pdf-parse")
const { 
    generateInterviewReport, 
    generateResumeHtml, 
    generatePdfFromHtml, 
    generateResumePdf 
} = require("../services/ai.service")
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
 * Helper to wrap inner resume HTML with complete standalone document styling
 */
function wrapResumeHtmlWithTheme(innerHtml, template = "modern") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Resume</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #1e293b;
      line-height: 1.35;
      font-size: 9pt;
      width: 100%;
    }

    /* Modern Template */
    .template-modern {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .template-modern .candidate-name {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 2px 0;
      letter-spacing: -0.3px;
    }
    .template-modern .candidate-target-title {
      font-size: 10.5pt;
      font-weight: 700;
      color: #ff2d78;
      margin-bottom: 3px;
    }
    .template-modern .candidate-contact {
      font-size: 8.5pt;
      color: #64748b;
      margin-bottom: 8px;
    }
    .template-modern .section-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1.5px solid #ff2d78;
      padding-bottom: 2px;
      margin-top: 8px;
      margin-bottom: 4px;
    }
    .template-modern .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin: 3px 0 5px 0;
    }
    .template-modern .skill-tag {
      background: #f1f5f9;
      color: #1e293b;
      font-size: 8pt;
      font-weight: 600;
      padding: 2px 5px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
      display: inline-block;
    }

    /* Classic ATS Template */
    .template-classic {
      font-family: "Times New Roman", Times, Georgia, serif;
      color: #000000;
      line-height: 1.3;
    }
    .template-classic .resume-header {
      text-align: center;
      border-bottom: 1.5px solid #000;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .template-classic .candidate-name {
      font-size: 18pt;
      font-weight: bold;
      margin: 0 0 2px 0;
      text-transform: uppercase;
    }
    .template-classic .candidate-target-title {
      font-size: 10.5pt;
      font-style: italic;
      margin-bottom: 2px;
    }
    .template-classic .candidate-contact {
      font-size: 8.5pt;
    }
    .template-classic .section-title {
      font-size: 9.5pt;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 2px;
      margin-top: 8px;
      margin-bottom: 4px;
      letter-spacing: 0.8px;
    }
    .template-classic .skill-tag {
      display: inline-block;
      margin-right: 6px;
      font-size: 8.8pt;
    }
    .template-classic .skill-tag:not(:last-child)::after {
      content: " •";
    }

    /* Executive Template */
    .template-executive {
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: #1a202c;
      line-height: 1.35;
    }
    .template-executive .candidate-name {
      font-size: 18pt;
      font-weight: 700;
      color: #1a365d;
      margin: 0;
    }
    .template-executive .candidate-target-title {
      font-size: 10.5pt;
      font-weight: 600;
      color: #2b6cb0;
      margin-bottom: 3px;
    }
    .template-executive .candidate-contact {
      font-size: 8.5pt;
      color: #718096;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .template-executive .section-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: #2b6cb0;
      border-left: 3px solid #2b6cb0;
      padding-left: 6px;
      margin-top: 8px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .template-executive .skill-tag {
      display: inline-block;
      background: #edf2f7;
      color: #2b6cb0;
      padding: 1.5px 5px;
      border-radius: 3px;
      font-size: 8pt;
      margin-right: 4px;
      margin-bottom: 3px;
    }

    /* Common Styles across all templates */
    .resume-container {
      width: 100%;
    }
    .resume-section {
      margin-bottom: 7px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .summary-text {
      margin: 0 0 3px 0;
      font-size: 8.8pt;
      color: #334155;
      line-height: 1.32;
    }
    .job-entry, .project-entry {
      margin-bottom: 5px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .job-header, .project-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 9.2pt;
    }
    .job-role, .project-name {
      font-weight: 700;
      color: #0f172a;
    }
    .job-dates, .project-tech {
      font-size: 8.2pt;
      color: #64748b;
      font-weight: 600;
    }
    .job-company {
      font-size: 8.2pt;
      font-style: italic;
      color: #475569;
      margin-bottom: 2px;
    }
    .job-bullets {
      margin: 2px 0 3px 0;
      padding-left: 14px;
    }
    .job-bullets li {
      margin-bottom: 2px;
      font-size: 8.6pt;
      line-height: 1.3;
      color: #334155;
    }
    .edu-entry {
      font-size: 8.6pt;
      margin-bottom: 2px;
      color: #334155;
    }
  </style>
</head>
<body>
  <div class="resume-wrapper template-${template}">
    ${innerHtml}
  </div>
</body>
</html>`
}

/**
 * @name getResumeHtmlController
 * @description Retrieves cached resume HTML or generates initial HTML for live preview.
 * @route GET /api/interview/resume/html/:interviewReportId
 * @access Private
 */
async function getResumeHtmlController(req, res) {
    try {
        const { interviewReportId } = req.params
        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." })
        }

        // Return cached HTML if already generated
        if (interviewReport.resumeHtml && interviewReport.resumeHtml.length > 50) {
            return res.status(200).json({
                success: true,
                resumeHtml: interviewReport.resumeHtml,
                selectedTemplate: interviewReport.selectedTemplate || "modern"
            })
        }

        // Generate tailored HTML via Gemini
        const { resume, jobDescription, selfDescription } = interviewReport
        const html = await generateResumeHtml({ resume, jobDescription, selfDescription })

        // Save to report document
        interviewReport.resumeHtml = html
        await interviewReport.save()

        return res.status(200).json({
            success: true,
            resumeHtml: html,
            selectedTemplate: interviewReport.selectedTemplate || "modern"
        })
    } catch (error) {
        console.error("Error in getResumeHtmlController:", error)
        return res.status(500).json({ message: "Failed to generate resume preview." })
    }
}

/**
 * @name regenerateResumeHtmlController
 * @description Regenerates fresh tailored resume HTML using Gemini AI.
 * @route POST /api/interview/resume/regenerate/:interviewReportId
 * @access Private
 */
async function regenerateResumeHtmlController(req, res) {
    try {
        const { interviewReportId } = req.params
        const { instructions } = req.body

        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." })
        }

        const { resume, jobDescription, selfDescription } = interviewReport
        const newHtml = await generateResumeHtml({ 
            resume, 
            jobDescription, 
            selfDescription, 
            instructions 
        })

        interviewReport.resumeHtml = newHtml
        await interviewReport.save()

        return res.status(200).json({
            success: true,
            resumeHtml: newHtml,
            message: "Resume regenerated successfully!"
        })
    } catch (error) {
        console.error("Error in regenerateResumeHtmlController:", error)
        return res.status(500).json({ message: "Failed to regenerate resume." })
    }
}

/**
 * @name exportCustomResumePdfController
 * @description Exports the candidate's current edited HTML and chosen template into an A4 PDF via Puppeteer.
 * @route POST /api/interview/resume/export-pdf
 * @access Private
 */
async function exportCustomResumePdfController(req, res) {
    try {
        const { htmlContent, template = "modern", fileName = "Resume" } = req.body

        if (!htmlContent) {
            return res.status(400).json({ message: "HTML content is required for PDF export." })
        }

        const fullHtml = wrapResumeHtmlWithTheme(htmlContent, template)
        const pdfBuffer = await generatePdfFromHtml(fullHtml)

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${fileName.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf"`,
            "Content-Length": pdfBuffer.length
        })

        return res.send(pdfBuffer)
    } catch (error) {
        console.error("Error in exportCustomResumePdfController:", error)
        return res.status(500).json({ message: "Failed to export PDF." })
    }
}

/**
 * @name generateResumePdfController
 * @description Legacy direct download endpoint.
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
    getResumeHtmlController,
    regenerateResumeHtmlController,
    exportCustomResumePdfController,
    generateResumePdfController 
}