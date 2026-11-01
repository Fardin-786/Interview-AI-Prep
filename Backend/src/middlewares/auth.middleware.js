const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")
const { isTokenBlacklisted } = require("../config/redis")

/**
 * @name authUser
 * @description Mandatory authentication middleware. Rejects requests if token is missing or blacklisted.
 */
async function authUser(req, res, next) {
    const authHeader = req.headers.authorization
    const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null
    const token = req.cookies.token || bearerToken

    if (!token) {
        return res.status(401).json({
            message: "Authentication token required."
        })
    }

    try {
        // ⚡ Check Redis RAM first (<1ms)
        const isBlacklistedInRedis = await isTokenBlacklisted(token)
        if (isBlacklistedInRedis) {
            return res.status(401).json({
                message: "Session expired or logged out."
            })
        }

        // Fallback: Check MongoDB blacklist collection
        const isBlacklistedInMongo = await tokenBlacklistModel.findOne({ token })
        if (isBlacklistedInMongo) {
            return res.status(401).json({
                message: "Session expired or logged out."
            })
        }

        // Verify token signature and payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        return next()
    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token."
        })
    }
}

/**
 * @name optionalAuthUser
 * @description Optional authentication middleware. Attaches user object if valid token exists.
 */
async function optionalAuthUser(req, res, next) {
    const authHeader = req.headers.authorization
    const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null
    const token = req.cookies.token || bearerToken

    if (!token) {
        req.user = null
        return next()
    }

    try {
        const isBlacklistedInRedis = await isTokenBlacklisted(token)
        if (isBlacklistedInRedis) {
            req.user = null
            return next()
        }

        const isBlacklistedInMongo = await tokenBlacklistModel.findOne({ token })
        if (isBlacklistedInMongo) {
            req.user = null
            return next()
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        return next()
    } catch (err) {
        req.user = null
        return next()
    }
}

module.exports = { authUser, optionalAuthUser }