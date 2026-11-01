const { Queue } = require('bullmq')
const { sendVerificationOtpEmail, sendPasswordResetOtpEmail } = require('../services/mail.service')
const { isRedisConnected } = require('../config/redis')

const redisOptions = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    maxRetriesPerRequest: null,
    enableOfflineQueue: false
}

let emailQueue = null
try {
    emailQueue = new Queue('emailQueue', {
        connection: redisOptions
    })
    emailQueue.on('error', () => {
        // Suppress unhandled redis connection error logs
    })
} catch (err) {
    // Suppress warning
}

/**
 * @name addEmailJob
 * @description Helper function to add email sending job to BullMQ queue with instant non-blocking fallback.
 * @param {string} jobName - 'send-verification-otp' | 'send-reset-otp'
 * @param {Object} data - { email, username, otp }
 */
async function addEmailJob(jobName, data) {
    if (emailQueue && isRedisConnected()) {
        try {
            await emailQueue.add(jobName, data, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                },
                removeOnComplete: true,
                removeOnFail: 100
            })
            console.log(`📥 BullMQ Job '${jobName}' added to emailQueue for: ${data.email}`)
            return true
        } catch (err) {
            console.warn(`⚠️ BullMQ Queue offline. Executing non-blocking direct delivery for ${data.email}...`)
        }
    }

    // Non-blocking asynchronous fallback: runs in background so API responds instantly (<10ms)
    Promise.resolve().then(async () => {
        try {
            if (jobName === 'send-verification-otp') {
                await sendVerificationOtpEmail(data)
            } else if (jobName === 'send-reset-otp') {
                await sendPasswordResetOtpEmail(data)
            }
        } catch (err) {
            console.error(`Error in non-blocking email delivery for ${data.email}:`, err?.message || err)
        }
    })

    return true
}

module.exports = { emailQueue, addEmailJob }
