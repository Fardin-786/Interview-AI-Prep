const { Worker } = require('bullmq')
const { sendVerificationOtpEmail, sendPasswordResetOtpEmail } = require('../services/mail.service')
const { isRedisConnected } = require('../config/redis')

const redisOptions = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    maxRetriesPerRequest: null,
    enableOfflineQueue: false
}

let emailWorker = null

function initEmailWorker() {
    try {
        emailWorker = new Worker('emailQueue', async (job) => {
            console.log(`👷 BullMQ Background Worker processing job: [${job.name}] (ID: ${job.id}) for: ${job.data.email}`)

            if (job.name === 'send-verification-otp') {
                await sendVerificationOtpEmail(job.data)
            } else if (job.name === 'send-reset-otp') {
                await sendPasswordResetOtpEmail(job.data)
            }
        }, {
            connection: redisOptions,
            limiter: {
                max: 5,        // Max 5 emails
                duration: 1000 // per 1000ms (respects Gmail SMTP limits)
            }
        })

        emailWorker.on('completed', (job) => {
            console.log(`✅ BullMQ Job [${job.name}] (ID: ${job.id}) completed successfully for ${job.data.email}`)
        })

        emailWorker.on('failed', (job, err) => {
            console.error(`❌ BullMQ Job [${job?.name}] (ID: ${job?.id}) failed:`, err.message)
        })

        emailWorker.on('error', () => {
            // Suppress log flooding if redis daemon is offline
        })

        console.log("⚡ BullMQ Background Worker initialized successfully!")
    } catch (err) {
        console.warn("⚠️ Could not initialize BullMQ worker. Operating in direct email mode.")
    }
}

module.exports = { initEmailWorker }
