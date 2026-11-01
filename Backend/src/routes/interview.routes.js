const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()



/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description,resume pdf and job description.
 * @access private
 */
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterViewReportController)

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId.
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)


/**
 * @route GET /api/interview/
 * @description get all interview reports of logged in user.
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)


/**
 * @route GET /api/interview/resume/html/:interviewReportId
 * @description Fetch cached or generate tailored resume HTML for live preview.
 * @access private
 */
interviewRouter.get("/resume/html/:interviewReportId", authMiddleware.authUser, interviewController.getResumeHtmlController)

/**
 * @route POST /api/interview/resume/regenerate/:interviewReportId
 * @description Regenerate fresh resume HTML with AI.
 * @access private
 */
interviewRouter.post("/resume/regenerate/:interviewReportId", authMiddleware.authUser, interviewController.regenerateResumeHtmlController)

/**
 * @route POST /api/interview/resume/export-pdf
 * @description Convert custom edited HTML & template into an A4 PDF.
 * @access private
 */
interviewRouter.post("/resume/export-pdf", authMiddleware.authUser, interviewController.exportCustomResumePdfController)

/**
 * @route POST /api/interview/resume/pdf/:interviewReportId
 * @description generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)



module.exports = interviewRouter