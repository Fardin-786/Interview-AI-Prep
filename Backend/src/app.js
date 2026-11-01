const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

// Import API routes
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

const app = express()

// Trust reverse proxies (Render, Railway, AWS, Cloudflare) for secure cookies
app.set("trust proxy", 1)

// Middleware for parsing JSON payloads and cookies
app.use(express.json({ limit: "10mb" }))
app.use(cookieParser())

// Origins allowed by default
const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://interview-ai-prep-nu.vercel.app"
]

const configuredOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map(url => url.trim().replace(/\/$/, ""))
    : []

const allowedOrigins = [...new Set([...defaultOrigins, ...configuredOrigins])]

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
        if (!origin) {
            return callback(null, true);
        }

        // Allow localhost and local loopback on any port
        const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

        // Allow all Vercel deployment URLs (production, preview branches, PR deploys)
        const isVercel = /^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(origin);

        // Allow explicitly configured origins
        const isAllowedOrigin = allowedOrigins.includes(origin);

        if (isLocalhost || isVercel || isAllowedOrigin) {
            return callback(null, true);
        }

        // Return false gracefully without throwing an unhandled server error
        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With", "Accept", "Origin"]
}

app.use(cors(corsOptions))

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