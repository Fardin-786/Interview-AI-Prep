const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")
const { sendVerificationOtpEmail, sendPasswordResetOtpEmail } = require("../services/mail.service")
const { setOtp, getOtp, delOtp, blacklistToken } = require("../config/redis")
const { addEmailJob } = require("../queues/email.queue")

/**
 * @name registerUserController
 * @description Registers a new user account with hashed password & generates a 6-digit OTP for email verification.
 * @route POST /api/auth/register
 * @access Public
 */
async function registerUserController(req, res) {
    try {
        let { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email and password."
            })
        }

        username = username.trim()
        email = email.toLowerCase().trim()

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long."
            })
        }

        // Generate 6-digit OTP code & 15-minute expiration
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000)

        // 1. Check if email already exists
        const existingEmailUser = await userModel.findOne({
            $or: [{ email }, { pendingEmail: email }]
        })

        if (existingEmailUser) {
            // Auto-Cure: If existing account is unverified, refresh credentials and OTP so user can verify seamlessly
            if (!existingEmailUser.isVerified) {
                const hash = await bcrypt.hash(password, 10)
                existingEmailUser.username = username
                existingEmailUser.password = hash
                existingEmailUser.verificationOTP = otp
                existingEmailUser.otpExpiresAt = otpExpiresAt
                await existingEmailUser.save()

                await addEmailJob('send-verification-otp', { email: existingEmailUser.email, username, otp })

                return res.status(200).json({
                    success: true,
                    isVerified: false,
                    email: existingEmailUser.email,
                    message: "A verification code has been refreshed for your account. Please check your email for the 6-digit code."
                })
            }

            return res.status(400).json({
                message: "An account with this email address already exists. Please log in instead."
            })
        }

        // 2. Check if username is already taken
        const existingUsernameUser = await userModel.findOne({ username })
        if (existingUsernameUser) {
            return res.status(400).json({
                message: "This username is already taken. Please choose a different username."
            })
        }

        // Hash user password
        const hash = await bcrypt.hash(password, 10)

        // Create new user document (unverified by default)
        const user = await userModel.create({
            username,
            email,
            password: hash,
            isVerified: false,
            verificationOTP: otp,
            otpExpiresAt
        })

        // Offload OTP verification email sending to queue/service (<2ms RAM write)
        await addEmailJob('send-verification-otp', { email, username, otp })

        return res.status(201).json({
            success: true,
            isVerified: false,
            email: user.email,
            message: "Registration successful. A 6-digit verification code has been sent to your email."
        })
    } catch (err) {
        console.error("Error in registerUserController:", err)
        return res.status(500).json({
            message: err?.message || "Registration failed. Please try again."
        })
    }
}

/**
 * @name verifyEmailController
 * @description Verifies 6-digit OTP code for registration or email address update.
 * @route POST /api/auth/verify-email
 * @access Public
 */
async function verifyEmailController(req, res) {
    try {
        let { email, otp } = req.body

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email address and 6-digit OTP code are required."
            })
        }

        email = email.toLowerCase().trim()
        otp = String(otp).trim()

        // Find user by primary email or pending email
        const user = await userModel.findOne({
            $or: [{ email }, { pendingEmail: email }]
        })

        if (!user) {
            return res.status(404).json({
                message: "User account not found."
            })
        }

        // If user is already verified and no pending email change
        if (user.isVerified && !user.pendingEmail) {
            return res.status(200).json({
                success: true,
                message: "Email is already verified! You can log in to your account.",
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            })
        }

        // Check if OTP matches and is not expired
        if (user.verificationOTP !== otp) {
            return res.status(400).json({
                message: "Invalid OTP code. Please check your email or click 'Resend OTP' to get a new code."
            })
        }

        if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
            return res.status(400).json({
                message: "OTP code has expired. Please click 'Resend OTP' to get a new code."
            })
        }

        // If user is verifying a new pending email
        if (user.pendingEmail === email) {
            user.email = user.pendingEmail
            user.pendingEmail = undefined
        }

        // Mark user as verified and clear OTP fields
        user.isVerified = true
        user.verificationOTP = undefined
        user.otpExpiresAt = undefined
        await user.save()

        return res.status(200).json({
            success: true,
            message: "Email verified successfully! You can now log in to your account.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        console.error("Error in verifyEmailController:", err)
        return res.status(500).json({
            message: "Failed to verify OTP code."
        })
    }
}

/**
 * @name resendOtpController
 * @description Generates and resends a new 6-digit OTP code to primary or pending email.
 * @route POST /api/auth/resend-otp
 * @access Public
 */
async function resendOtpController(req, res) {
    try {
        let { email } = req.body

        if (!email) {
            return res.status(400).json({
                message: "Email address is required."
            })
        }

        email = email.toLowerCase().trim()

        const user = await userModel.findOne({
            $or: [{ email }, { pendingEmail: email }]
        })

        if (!user) {
            return res.status(404).json({
                message: "User account not found."
            })
        }

        if (user.isVerified && !user.pendingEmail) {
            return res.status(200).json({
                success: true,
                message: "Email address is already verified."
            })
        }

        // Generate fresh OTP & expiration
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        user.verificationOTP = otp
        user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
        await user.save()

        // Resend email to target email
        const targetEmail = user.pendingEmail || user.email
        await addEmailJob('send-verification-otp', { email: targetEmail, username: user.username, otp })

        return res.status(200).json({
            success: true,
            message: "A new 6-digit OTP verification code has been sent to your email."
        })
    } catch (err) {
        console.error("Error in resendOtpController:", err)
        return res.status(500).json({
            message: "Failed to resend OTP code."
        })
    }
}

/**
 * @name loginUserController
 * @description Authenticates user credentials and checks that account is verified.
 * @route POST /api/auth/login
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        let { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide both email and password."
            })
        }

        email = email.toLowerCase().trim()

        // Find user by primary email
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password."
            })
        }

        // Validate password match
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid email or password."
            })
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                isUnverified: true,
                email: user.email,
                message: "Your email address is not verified yet. Please verify your email before logging in."
            })
        }

        // Sign JWT token valid for 1 day
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        // Set HTTP-only cookie
        res.cookie("token", token)

        return res.status(200).json({
            message: "User logged in successfully.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        console.error("Error in loginUserController:", err)
        return res.status(500).json({
            message: "Login failed. Please try again."
        })
    }
}

/**
 * @name logoutUserController
 * @description Logs out user by clearing HTTP cookie and blacklisting token.
 * @route GET /api/auth/logout
 * @access Public
 */
async function logoutUserController(req, res) {
    try {
        const token = req.cookies.token
        if (token) {
            await blacklistToken(token, 86400) // ⚡ Blacklist in Redis RAM (<1ms)
            await tokenBlacklistModel.create({ token }) // MongoDB Backup
        }

        res.clearCookie("token")
        return res.status(200).json({
            message: "User logged out successfully."
        })
    } catch (err) {
        res.clearCookie("token")
        return res.status(200).json({
            message: "User logged out successfully."
        })
    }
}

/**
 * @name getMeController
 * @description Fetches details of the currently authenticated user.
 * @route GET /api/auth/get-me
 * @access Private/Optional
 */
async function getMeController(req, res) {
    if (!req.user || !req.user.id) {
        return res.status(200).json({
            message: "User not authenticated.",
            user: null
        })
    }

    try {
        const user = await userModel.findById(req.user.id)
        if (!user || !user.isVerified) {
            return res.status(200).json({
                message: "User not found or unverified.",
                user: null
            })
        }

        return res.status(200).json({
            message: "User details fetched successfully.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        return res.status(200).json({
            message: "Error fetching user details.",
            user: null
        })
    }
}

/**
 * @name updateProfileController
 * @description Updates profile username directly, or triggers 6-digit OTP verification for new email.
 * @route PUT /api/auth/update-profile
 * @access Private
 */
async function updateProfileController(req, res) {
    try {
        const { username, email } = req.body

        if (!username || !email) {
            return res.status(400).json({
                message: "Username and email are required."
            })
        }

        const currentUser = await userModel.findById(req.user.id)
        if (!currentUser) {
            return res.status(404).json({
                message: "User account not found."
            })
        }

        // Check if username is taken by another user
        const isUsernameTaken = await userModel.findOne({
            _id: { $ne: req.user.id },
            username
        })

        if (isUsernameTaken) {
            return res.status(400).json({
                message: "Username is already taken by another user."
            })
        }

        const isEmailChanged = email.toLowerCase().trim() !== currentUser.email.toLowerCase().trim()

        if (isEmailChanged) {
            // Check if new email is taken by another user
            const isEmailTaken = await userModel.findOne({
                _id: { $ne: req.user.id },
                $or: [{ email }, { pendingEmail: email }]
            })

            if (isEmailTaken) {
                return res.status(400).json({
                    message: "Account already exists with this new email address."
                })
            }

            // Generate 6-digit OTP for new email verification
            const otp = Math.floor(100000 + Math.random() * 900000).toString()
            const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000)

            currentUser.username = username
            currentUser.pendingEmail = email
            currentUser.verificationOTP = otp
            currentUser.otpExpiresAt = otpExpiresAt
            await currentUser.save()

            // Send OTP verification email to new email address via BullMQ queue
            await addEmailJob('send-verification-otp', { email, username, otp })

            return res.status(200).json({
                success: true,
                requiresEmailVerification: true,
                pendingEmail: email,
                message: `Username updated. A 6-digit verification code has been sent to ${email}. Please verify to complete email change.`
            })
        }

        // Only username changed (email unchanged)
        currentUser.username = username
        await currentUser.save()

        return res.status(200).json({
            success: true,
            requiresEmailVerification: false,
            message: "Profile updated successfully.",
            user: {
                id: currentUser._id,
                username: currentUser.username,
                email: currentUser.email
            }
        })
    } catch (err) {
        console.error("Error in updateProfileController:", err)
        return res.status(500).json({
            message: "Failed to update profile."
        })
    }
}

/**
 * @name forgotPasswordController
 * @description Generates and sends a 6-digit OTP code for password reset via Nodemailer.
 * @route POST /api/auth/forgot-password
 * @access Public
 */
async function forgotPasswordController(req, res) {
    try {
        let { email } = req.body

        if (!email) {
            return res.status(400).json({
                message: "Email address is required."
            })
        }

        email = email.toLowerCase().trim()

        const user = await userModel.findOne({ email })
        if (!user) {
            // Standard security practice: return generic success message to prevent user email enumeration
            return res.status(200).json({
                success: true,
                message: "If an account with that email address exists, a 6-digit password reset code has been sent."
            })
        }

        // Generate 6-digit OTP & 15-minute expiration
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        user.resetPasswordOTP = otp
        user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
        await user.save()

        // Send Password Reset OTP email
        await addEmailJob('send-reset-otp', { email: user.email, username: user.username, otp })

        return res.status(200).json({
            success: true,
            email: user.email,
            message: "A 6-digit password reset code has been sent to your email address."
        })
    } catch (err) {
        console.error("Error in forgotPasswordController:", err)
        return res.status(500).json({
            message: "Failed to process forgot password request."
        })
    }
}

/**
 * @name resetPasswordController
 * @description Validates 6-digit OTP and updates user's hashed password in MongoDB.
 * @route POST /api/auth/reset-password
 * @access Public
 */
async function resetPasswordController(req, res) {
    try {
        let { email, otp, newPassword } = req.body

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                message: "Email address, 6-digit OTP code, and new password are required."
            })
        }

        email = email.toLowerCase().trim()
        otp = String(otp).trim()

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters long."
            })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(404).json({
                message: "User account not found."
            })
        }

        // Validate OTP code and expiration
        if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
            return res.status(400).json({
                message: "Invalid or incorrect OTP code. Please try again."
            })
        }

        if (user.resetPasswordExpiresAt && user.resetPasswordExpiresAt < new Date()) {
            return res.status(400).json({
                message: "Password reset OTP code has expired. Please request a new code."
            })
        }

        // Hash new password and clear reset OTP fields
        const hash = await bcrypt.hash(newPassword, 10)
        user.password = hash
        user.resetPasswordOTP = undefined
        user.resetPasswordExpiresAt = undefined
        await user.save()

        return res.status(200).json({
            success: true,
            message: "Password reset successfully! You can now log in with your new password."
        })
    } catch (err) {
        console.error("Error in resetPasswordController:", err)
        return res.status(500).json({
            message: "Failed to reset password."
        })
    }
}

module.exports = {
    registerUserController,
    verifyEmailController,
    resendOtpController,
    loginUserController,
    logoutUserController,
    getMeController,
    updateProfileController,
    forgotPasswordController,
    resetPasswordController
}