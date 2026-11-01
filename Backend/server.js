// Load environment variables from .env file
require("dotenv").config()

const app = require("./src/app")
const connectToDB = require("./src/config/database")
const { initEmailWorker } = require("./src/workers/email.worker")

const PORT = process.env.PORT || 8000

async function startServer() {
    try {
        // Connect to MongoDB Atlas Database
        await connectToDB()

        // Initialize BullMQ Background Email Worker
        initEmailWorker()

        // Start Express HTTP Server only after DB is ready
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server is running on port ${PORT}`)
        })
    } catch (err) {
        console.error("Failed to start server:", err)
        process.exit(1)
    }
}

startServer()