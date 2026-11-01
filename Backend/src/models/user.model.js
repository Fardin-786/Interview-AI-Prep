const mongoose = require("mongoose")

// User document schema definition
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [ true, "Username already taken" ],
        required: [ true, "Username is required" ],
    },

    email: {
        type: String,
        unique: [ true, "Account already exists with this email address" ],
        required: [ true, "Email address is required" ],
    },

    password: {
        type: String,
        required: [ true, "Password is required" ]
    },

    // Email verification & email update fields
    isVerified: {
        type: Boolean,
        default: false
    },

    pendingEmail: {
        type: String
    },

    verificationOTP: {
        type: String
    },

    otpExpiresAt: {
        type: Date
    },

    // Password Reset fields
    resetPasswordOTP: {
        type: String
    },

    resetPasswordExpiresAt: {
        type: Date
    }
}, {
    timestamps: true
})

// Add MongoDB index for pendingEmail for faster update profile lookups
userSchema.index({ pendingEmail: 1 })

const userModel = mongoose.model("users", userSchema)

module.exports = userModel