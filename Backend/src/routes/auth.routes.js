const { Router } = require('express')
const rateLimit = require('express-rate-limit')
const authController = require("../controllers/auth.controller")
const authMiddleware = require("../middlewares/auth.middleware")

const authRouter = Router()

// Rate Limiter 1: Strict Login Rate Limiting (5 attempts per 15 minutes)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many login attempts from this IP address. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false
})

// Rate Limiter 2: OTP & Password Reset Rate Limiting (5 requests per hour)
const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { message: "Too many OTP verification requests. Please try again after 1 hour." },
    standardHeaders: true,
    legacyHeaders: false
})

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post("/register", authController.registerUserController)

/**
 * @route POST /api/auth/verify-email
 * @description Verify 6-digit OTP code for user email
 * @access Public
 */
authRouter.post("/verify-email", authController.verifyEmailController)

/**
 * @route POST /api/auth/resend-otp
 * @description Resend a new 6-digit verification OTP
 * @access Public
 */
authRouter.post("/resend-otp", otpLimiter, authController.resendOtpController)

/**
 * @route POST /api/auth/login
 * @description Login user with email and password
 * @access Public
 */
authRouter.post("/login", loginLimiter, authController.loginUserController)

/**
 * @route POST /api/auth/forgot-password
 * @description Request a 6-digit OTP code for password reset
 * @access Public
 */
authRouter.post("/forgot-password", otpLimiter, authController.forgotPasswordController)

/**
 * @route POST /api/auth/reset-password
 * @description Reset user password with verified 6-digit OTP
 * @access Public
 */
authRouter.post("/reset-password", otpLimiter, authController.resetPasswordController)

/**
 * @route GET /api/auth/logout
 * @description Clear token from user cookie and add the token in blacklist
 * @access Public
 */
authRouter.get("/logout", authController.logoutUserController)

/**
 * @route GET /api/auth/get-me
 * @description Get the current logged in user details
 * @access Private/Optional
 */
authRouter.get("/get-me", authMiddleware.optionalAuthUser, authController.getMeController)

/**
 * @route PUT /api/auth/update-profile
 * @description Update current logged in user profile
 * @access Private
 */
authRouter.put("/update-profile", authMiddleware.authUser, authController.updateProfileController)

module.exports = authRouter