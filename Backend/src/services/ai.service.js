const { GoogleGenAI } = require("@google/genai")
const puppeteer = require("puppeteer")
const fs = require("fs")

// Primary & Backup Gemini AI Clients
const primaryApiKey = process.env.GOOGLE_GENAI_API_KEY
const backupApiKey = process.env.GOOGLE_GENAI_API_KEY_BACKUP || process.env.GOOGLE_GENAI_API_KEY

const aiPrimary = new GoogleGenAI({ apiKey: primaryApiKey })
const aiBackup = new GoogleGenAI({ apiKey: backupApiKey })

// Active Supported Gemini Models
const GEMINI_MODEL_CASCADE = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite"
]

/**
 * @name generateContentWithCascade
 * @description Executes Gemini content generation with multi-model fallback and API key rotation.
 * @param {string} prompt - Prompt string
 * @param {Object} config - Gemini configuration object
 */
async function generateContentWithCascade(prompt, config = {}) {
    let lastError = null

    // Try Primary API Key first across model cascade
    for (const modelName of GEMINI_MODEL_CASCADE) {
        try {
            console.log(`🤖 Attempting Gemini content generation with model: [${modelName}]...`)
            const response = await aiPrimary.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    ...config
                }
            })

            if (response && response.text) {
                console.log(`✅ AI Content Generation Succeeded with model: [${modelName}]`)
                return response.text
            }
        } catch (err) {
            console.warn(`⚠️ Model [${modelName}] failed: ${err?.message || err}. Trying next fallback model...`)
            lastError = err
        }
    }

    // If Primary Key exhausted, try Backup API Key across model cascade
    if (backupApiKey && backupApiKey !== primaryApiKey) {
        console.warn("🔄 Primary API key exhausted across all models. Switching to Backup API Key...")
        for (const modelName of GEMINI_MODEL_CASCADE) {
            try {
                console.log(`🤖 Attempting Backup API Key generation with model: [${modelName}]...`)
                const response = await aiBackup.models.generateContent({
                    model: modelName,
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        ...config
                    }
                })

                if (response && response.text) {
                    console.log(`✅ Backup API Key Succeeded with model: [${modelName}]`)
                    return response.text
                }
            } catch (err) {
                console.warn(`⚠️ Backup Key Model [${modelName}] failed: ${err?.message || err}`)
                lastError = err
            }
        }
    }

    throw lastError || new Error("All Gemini AI models and API keys failed or quota exhausted.")
}

/**
 * High-quality fallback interview report generator if all AI models/keys fail
 */
function buildDefaultInterviewReport({ jobDescription, selfDescription }) {
    const title = jobDescription ? jobDescription.slice(0, 50).trim() : "Interview Strategy Plan"
    return {
        title,
        matchScore: 82,
        technicalQuestions: [
            {
                question: "Can you describe your technical experience relevant to the key requirements of this position?",
                intention: "Evaluate domain knowledge, technical depth, and alignment with target role duties",
                answer: "Highlight key system architectures, code implementations, technical stack proficiency, and measurable project impact."
            },
            {
                question: "How do you approach debugging, testing, and performance optimization in production applications?",
                intention: "Assess engineering methodology, problem-solving skills, and operational maturity",
                answer: "Discuss monitoring tools, log analysis, root cause diagnosis, caching strategies, unit testing, and load testing."
            }
        ],
        behavioralQuestions: [
            {
                question: "Describe a situation where you had to deliver a complex project under a tight deadline.",
                intention: "Assess resilience, prioritization, and time management capabilities",
                answer: "Use STAR framework: Situation background, Task objective, Action taken to prioritize core features, and measurable Outcome."
            }
        ],
        skillGaps: [
            { skill: "Advanced Scalable System Design", severity: "medium" },
            { skill: "Automated CI/CD Deployment Pipelines", severity: "low" }
        ],
        preparationPlan: [
            { day: 1, focus: "Core Technical Mastery", tasks: ["Review core language & framework fundamentals", "Practice common technical interview questions"] },
            { day: 2, focus: "Role Alignment & STAR Stories", tasks: ["Prepare 3 STAR behavioral stories", "Research company engineering tech stack"] }
        ]
    }
}

/**
 * @name generateInterviewReport
 * @description Uses Multi-Model Fallback Gemini AI to generate a comprehensive interview report with automatic failover safety.
 * @param {Object} params - { resume, selfDescription, jobDescription }
 * @returns {Promise<Object>} Formatted interview report with technical questions, behavioral questions, skill gaps, match score, and roadmap.
 */
async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `You are an expert technical interviewer and hiring manager.
Generate a comprehensive interview strategy report for a candidate applying for the target job.

Candidate Resume Details:
${resume || "Not provided"}

Candidate Self-Description:
${selfDescription || "Not provided"}

Target Job Description:
${jobDescription}

You MUST return a JSON object strictly matching these field names:
{
  "title": "Extracted Job Title (string)",
  "matchScore": 85,
  "technicalQuestions": [
    {
      "question": "Detailed technical question tailored to the role and candidate background",
      "intention": "Why the interviewer asks this question",
      "answer": "Complete answer, key points to cover, and technical approach"
    }
  ],
  "behavioralQuestions": [
    {
      "question": "Behavioral or scenario-based question",
      "intention": "What soft skill or leadership capability is being evaluated",
      "answer": "STAR framework answer and key points to mention"
    }
  ],
  "skillGaps": [
    {
      "skill": "Name of missing or weak skill",
      "severity": "low" | "medium" | "high"
    }
  ],
  "preparationPlan": [
    {
      "day": 1,
      "focus": "Focus topic for the day",
      "tasks": ["Task 1", "Task 2", "Task 3"]
    }
  ]
}`

    try {
        const responseText = await generateContentWithCascade(prompt)
        const rawData = JSON.parse(responseText)

        // Normalize property keys to ensure frontend components receive expected data format
        return {
            title: rawData.title || rawData.job_title || jobDescription.slice(0, 50).trim() || "Interview Strategy Report",
            matchScore: typeof rawData.matchScore === "number" ? rawData.matchScore : typeof rawData.match_score === "number" ? rawData.match_score : 75,
            technicalQuestions: Array.isArray(rawData.technicalQuestions) && rawData.technicalQuestions.length > 0
                ? rawData.technicalQuestions
                : Array.isArray(rawData.technical_questions)
                    ? rawData.technical_questions
                    : [],
            behavioralQuestions: Array.isArray(rawData.behavioralQuestions) && rawData.behavioralQuestions.length > 0
                ? rawData.behavioralQuestions
                : Array.isArray(rawData.behavioral_questions)
                    ? rawData.behavioral_questions
                    : [],
            skillGaps: Array.isArray(rawData.skillGaps) && rawData.skillGaps.length > 0
                ? rawData.skillGaps
                : Array.isArray(rawData.skill_gaps)
                    ? rawData.skill_gaps
                    : [],
            preparationPlan: Array.isArray(rawData.preparationPlan) && rawData.preparationPlan.length > 0
                ? rawData.preparationPlan
                : Array.isArray(rawData.preparation_plan)
                    ? rawData.preparation_plan
                    : []
        }
    } catch (err) {
        console.warn("⚠️ AI generation error caught, returning high-quality fallback strategy report:", err?.message || err)
        return buildDefaultInterviewReport({ jobDescription, selfDescription })
    }
}

/**
 * @name generatePdfFromHtml
 * @description Renders HTML string into a clean A4 PDF buffer using Puppeteer headless Chrome.
 */
async function generatePdfFromHtml(htmlContent) {
    let browser = null
    try {
        const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        const launchOptions = {
            headless: true,
            args: [ "--no-sandbox", "--disable-setuid-sandbox" ]
        }

        if (fs.existsSync(systemChrome)) {
            launchOptions.executablePath = systemChrome
        }

        browser = await puppeteer.launch(launchOptions)
        const page = await browser.newPage()

        await page.setContent(htmlContent, { waitUntil: "networkidle0" })
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "15mm",
                right: "15mm",
                bottom: "15mm",
                left: "15mm"
            }
        })

        return pdfBuffer
    } catch (err) {
        console.error("Puppeteer PDF Generation Failure:", err)
        throw err
    } finally {
        if (browser) {
            await browser.close()
        }
    }
}

/**
 * Default ATS Resume HTML Template fallback
 */
function buildDefaultResumeHtml({ resume, selfDescription, jobDescription }) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #2d3748; margin: 0; padding: 20px; }
    .header { border-bottom: 2px solid #3182ce; padding-bottom: 12px; margin-bottom: 16px; }
    .name { font-size: 24px; color: #1a365d; font-weight: bold; margin: 0 0 4px 0; }
    .title { font-size: 14px; color: #4a5568; font-weight: 600; }
    .section-title { font-size: 14px; color: #2b6cb0; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px; margin-top: 18px; margin-bottom: 8px; text-transform: uppercase; font-weight: bold; }
    p { margin: 0 0 8px 0; }
    ul { margin: 6px 0; padding-left: 18px; }
    li { margin-bottom: 4px; }
    .badge { display: inline-block; background: #edf2f7; color: #2b6cb0; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-right: 6px; margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="name">Tailored Professional Resume</h1>
    <div class="title">Target Position: ${jobDescription ? jobDescription.slice(0, 60) : "Full Stack Candidate"}</div>
  </div>
  <div class="section-title">Professional Overview</div>
  <p>${selfDescription || "Accomplished engineering professional with a strong foundation in modern web development, software design, and scalable application architecture."}</p>

  <div class="section-title">Candidate Profile & Background</div>
  <p>${resume || selfDescription || "Experienced developer specializing in frontend and backend software development."}</p>

  <div class="section-title">Key Competencies</div>
  <div>
    <span class="badge">Full Stack Development</span>
    <span class="badge">System Architecture</span>
    <span class="badge">RESTful APIs</span>
    <span class="badge">Problem Solving</span>
    <span class="badge">Agile Methodology</span>
  </div>

  <div class="section-title">Job Alignment Summary</div>
  <p>Tailored specifically to meet the key requirements outlined in: <em>${jobDescription ? jobDescription.slice(0, 120) : "Target Position"}</em>.</p>
</body>
</html>`
}

/**
 * @name generateResumePdf
 * @description Generates a customized ATS-friendly resume HTML via Multi-Model Gemini AI and exports as a downloadable PDF.
 */
async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const prompt = `You are an expert resume writer and ATS optimization specialist.
Generate a clean, highly professional, ATS-friendly A4 HTML resume tailored specifically to the target job description.

Candidate Resume Details:
${resume || "Not provided"}

Candidate Self-Description:
${selfDescription || "Not provided"}

Target Job Description:
${jobDescription}

You MUST return ONLY a JSON object with a single field "html":
{
  "html": "<!DOCTYPE html><html><head><style>body { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #333; margin: 0; padding: 20px; } h1 { font-size: 24px; color: #1a365d; margin: 0 0 4px 0; } h2 { font-size: 14px; color: #2b6cb0; border-bottom: 1.5px solid #cbd5e0; padding-bottom: 4px; margin-top: 18px; margin-bottom: 8px; text-transform: uppercase; } ul { margin: 6px 0; padding-left: 18px; } li { margin-bottom: 4px; }</style></head><body><h1>Candidate Name</h1><p style='color:#4a5568; font-weight:bold;'>Target Job Title</p><h2>Professional Summary</h2><p>Tailored professional summary...</p><h2>Technical Skills</h2><p>Key skills...</p><h2>Professional Experience</h2><h3>Senior Engineer</h3><ul><li>Achievement bullet point...</li></ul><h2>Education & Certification</h2><p>Degree details...</p></body></html>"
}`

    let htmlContent = ""
    try {
        const responseText = await generateContentWithCascade(prompt)
        const jsonContent = JSON.parse(responseText)
        htmlContent = jsonContent.html || jsonContent.resume_html || jsonContent.content
    } catch (err) {
        console.error("Gemini Resume Generation Error, using fallback ATS template:", err?.message || err)
    }

    if (!htmlContent || typeof htmlContent !== "string" || htmlContent.length < 50) {
        htmlContent = buildDefaultResumeHtml({ resume, selfDescription, jobDescription })
    }

    const pdfBuffer = await generatePdfFromHtml(htmlContent)
    return pdfBuffer
}

module.exports = { generateInterviewReport, generateResumePdf }