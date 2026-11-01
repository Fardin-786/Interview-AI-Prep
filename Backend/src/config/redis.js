const Redis = require("ioredis")

let redis = null
let isRedisConnected = false

// In-Memory RAM Cache Map fallback for local development when Redis daemon is offline
const inMemoryCacheMap = new Map()

try {
    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379"
    redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy(times) {
            if (times > 3) {
                console.warn("⚠️ Redis server unreachable. Falling back to In-Memory RAM + MongoDB cache.")
                return null
            }
            return Math.min(times * 200, 1000)
        }
    })

    redis.on("connect", () => {
        isRedisConnected = true
        console.log("⚡ Connected to Redis RAM Store successfully!")
    })

    redis.on("error", () => {
        isRedisConnected = false
    })
} catch (err) {
    isRedisConnected = false
    console.warn("⚠️ Failed to initialize Redis client. Falling back to In-Memory RAM + MongoDB cache.")
}

/**
 * Helper methods with graceful fallback to In-Memory RAM
 */

async function setOtp(key, otp, ttlSeconds = 900) {
    if (isRedisConnected && redis) {
        try {
            await redis.setex(`otp:${key}`, ttlSeconds, otp)
            return true
        } catch (err) {}
    }
    inMemoryCacheMap.set(`otp:${key}`, { data: otp, expiresAt: Date.now() + ttlSeconds * 1000 })
    return true
}

async function getOtp(key) {
    if (isRedisConnected && redis) {
        try {
            return await redis.get(`otp:${key}`)
        } catch (err) {}
    }
    const cached = inMemoryCacheMap.get(`otp:${key}`)
    if (cached && cached.expiresAt > Date.now()) {
        return cached.data
    }
    inMemoryCacheMap.delete(`otp:${key}`)
    return null
}

async function delOtp(key) {
    if (isRedisConnected && redis) {
        try {
            await redis.del(`otp:${key}`)
        } catch (err) {}
    }
    inMemoryCacheMap.delete(`otp:${key}`)
    return true
}

async function blacklistToken(token, ttlSeconds = 86400) {
    if (isRedisConnected && redis) {
        try {
            await redis.setex(`blacklist:${token}`, ttlSeconds, "true")
            return true
        } catch (err) {}
    }
    inMemoryCacheMap.set(`blacklist:${token}`, { data: "true", expiresAt: Date.now() + ttlSeconds * 1000 })
    return true
}

async function isTokenBlacklisted(token) {
    if (isRedisConnected && redis) {
        try {
            const exists = await redis.exists(`blacklist:${token}`)
            if (exists === 1) return true
        } catch (err) {}
    }
    const cached = inMemoryCacheMap.get(`blacklist:${token}`)
    if (cached && cached.expiresAt > Date.now()) {
        return true
    }
    return false
}

async function setCache(key, data, ttlSeconds = 86400) {
    if (isRedisConnected && redis) {
        try {
            await redis.setex(`cache:${key}`, ttlSeconds, JSON.stringify(data))
            console.log(`💾 Saved key [${key}] to Redis RAM Cache.`)
            return true
        } catch (err) {}
    }
    inMemoryCacheMap.set(`cache:${key}`, { data, expiresAt: Date.now() + ttlSeconds * 1000 })
    console.log(`💾 Saved key [${key}] to In-Memory RAM Cache.`)
    return true
}

async function getCache(key) {
    if (isRedisConnected && redis) {
        try {
            const cached = await redis.get(`cache:${key}`)
            if (cached) return JSON.parse(cached)
        } catch (err) {}
    }
    const cached = inMemoryCacheMap.get(`cache:${key}`)
    if (cached && cached.expiresAt > Date.now()) {
        return cached.data
    }
    inMemoryCacheMap.delete(`cache:${key}`)
    return null
}

module.exports = {
    redis,
    isRedisConnected: () => isRedisConnected,
    setOtp,
    getOtp,
    delOtp,
    blacklistToken,
    isTokenBlacklisted,
    setCache,
    getCache
}
