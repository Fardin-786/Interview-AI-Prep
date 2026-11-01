const mongoose = require("mongoose")

/**
 * @name connectToDB
 * @description Connects to MongoDB Atlas using the configured connection string.
 */
async function connectToDB() {
    const mongoUri = process.env.MONGO_URI

    if (!mongoUri) {
        throw new Error("MONGO_URI is not defined in environment variables.")
    }

    try {
        console.log("Connecting to MongoDB Atlas Database...")
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 8000,
            connectTimeoutMS: 10000
        })
        console.log("✅ Successfully connected to MongoDB Atlas Database!")
    } catch (err) {
        console.error("❌ Failed to connect to MongoDB Atlas:", err.message)
        throw err
    }
}

// Graceful cleanup on process termination
process.on("SIGINT", async () => {
    await mongoose.disconnect()
    process.exit(0)
})

module.exports = connectToDB
