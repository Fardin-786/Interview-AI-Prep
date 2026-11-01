import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
    withCredentials: true,
})

// Attach Bearer token from localStorage as fallback for cross-domain auth
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("selfDescription", selfDescription)
    if (resumeFile) {
        formData.append("resume", resumeFile)
    }

    const response = await api.post("/api/interview/", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })

    return response.data
}

/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)
    return response.data
}

/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")
    return response.data
}

/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    })

    return response.data
}

/**
 * @description Fetch cached or generate tailored resume HTML for live preview.
 */
export const getResumeHtml = async (interviewReportId) => {
    const response = await api.get(`/api/interview/resume/html/${interviewReportId}`)
    return response.data
}

/**
 * @description Regenerate resume HTML with Gemini AI.
 */
export const regenerateResumeHtml = async ({ interviewReportId, instructions }) => {
    const response = await api.post(`/api/interview/resume/regenerate/${interviewReportId}`, { instructions })
    return response.data
}

/**
 * @description Export custom edited HTML and chosen template into an A4 PDF via Puppeteer.
 */
export const exportCustomResumePdf = async ({ htmlContent, template, fileName }) => {
    const response = await api.post('/api/interview/resume/export-pdf', {
        htmlContent,
        template,
        fileName
    }, {
        responseType: "blob"
    })
    return response.data
}
