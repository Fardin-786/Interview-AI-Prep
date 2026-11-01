import { useContext } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, updateProfile, verifyEmail, resendOtp, forgotPassword, resetPassword } from "../services/auth.api";

export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

    const handleLogin = async ({ email, password }) => {
        try {
            const data = await login({ email, password })
            if (data && data.user) {
                setUser(data.user)
                return { success: true }
            }
            return { success: false, message: data?.message || "Login failed" }
        } catch (err) {
            return { 
                success: false, 
                isUnverified: err?.isUnverified || false, 
                email: err?.email || email, 
                message: err?.message || "Login failed" 
            }
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        try {
            const data = await register({ username, email, password })
            if (data && data.success) {
                return { 
                    success: true, 
                    email: data.email || email, 
                    message: data.message 
                }
            }
            return { success: false, message: data?.message || "Registration failed" }
        } catch (err) {
            return { success: false, message: err?.message || "Registration failed" }
        }
    }

    const handleVerifyEmail = async ({ email, otp }) => {
        try {
            const data = await verifyEmail({ email, otp })
            if (data && data.success) {
                return { success: true, message: data.message, user: data.user }
            }
            return { success: false, message: data?.message || "Verification failed." }
        } catch (err) {
            return { success: false, message: err?.message || "Verification failed." }
        }
    }

    const handleResendOtp = async ({ email }) => {
        try {
            const data = await resendOtp({ email })
            if (data && data.success) {
                return { success: true, message: data.message }
            }
            return { success: false, message: data?.message || "Failed to resend code." }
        } catch (err) {
            return { success: false, message: err?.message || "Failed to resend code." }
        }
    }

    const handleForgotPassword = async ({ email }) => {
        try {
            const data = await forgotPassword({ email })
            if (data && data.success) {
                return { 
                    success: true, 
                    email: data.email || email, 
                    message: data.message 
                }
            }
            return { success: false, message: data?.message || "Failed to process request." }
        } catch (err) {
            return { success: false, message: err?.message || "Failed to process request." }
        }
    }

    const handleResetPassword = async ({ email, otp, newPassword }) => {
        try {
            const data = await resetPassword({ email, otp, newPassword })
            if (data && data.success) {
                return { success: true, message: data.message }
            }
            return { success: false, message: data?.message || "Failed to reset password." }
        } catch (err) {
            return { success: false, message: err?.message || "Failed to reset password." }
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
        } catch (err) {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async ({ username, email }) => {
        try {
            const data = await updateProfile({ username, email })
            if (data && data.success) {
                if (data.user) {
                    setUser(data.user)
                }
                return {
                    success: true,
                    requiresEmailVerification: data.requiresEmailVerification || false,
                    pendingEmail: data.pendingEmail || email,
                    message: data.message || "Profile updated successfully!"
                }
            }
            return { success: false, message: data?.message || "Failed to update profile." }
        } catch (err) {
            return { success: false, message: err?.message || "Failed to update profile." }
        }
    }

    return { 
        user, 
        loading, 
        handleRegister, 
        handleVerifyEmail, 
        handleResendOtp, 
        handleForgotPassword, 
        handleResetPassword, 
        handleLogin, 
        handleLogout, 
        handleUpdateProfile 
    }
}