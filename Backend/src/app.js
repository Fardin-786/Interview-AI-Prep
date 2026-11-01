const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

// Import API routes
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

const app = express()

// Middleware for parsing JSON payloads and cookies
app.use(express.json())
app.use(cookieParser())

// Dynamic CORS configuration allowing localhost ports and environment origins
const allowedOrigins = process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"]
    : ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl) or matching allowed origins
        if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}))

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() })
})

// Register API route handlers
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Express Global Error:", err)
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "An unexpected server error occurred."
    })
})

module.exports = app