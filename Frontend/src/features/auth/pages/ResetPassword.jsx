import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import { ButtonSpinner } from '../../../components/Loader/Loader'

const ResetPassword = () => {
    const [ searchParams ] = useSearchParams()
    const emailParam = searchParams.get("email") || ""

    const [ email, setEmail ] = useState(emailParam)
    const [ otp, setOtp ] = useState(["", "", "", "", "", ""])
    const [ newPassword, setNewPassword ] = useState("")
    const [ confirmPassword, setConfirmPassword ] = useState("")
    const [ showNewPassword, setShowNewPassword ] = useState(false)
    const [ showConfirmPassword, setShowConfirmPassword ] = useState(false)
    const [ error, setError ] = useState("")
    const [ successMsg, setSuccessMsg ] = useState("")
    const [ isSubmitting, setIsSubmitting ] = useState(false)

    const navigate = useNavigate()
    const { user, loading, handleResetPassword } = useAuth()

    // Redirect already authenticated users to dashboard
    if (user && !loading) {
        return <Navigate to="/dashboard" replace />
    }

    const handleOtpChange = (element, index) => {
        const val = element.value.replace(/[^0-9]/g, '')
        if (val.length > 1) {
            const digits = val.slice(0, 6).split("")
            const newOtp = [...otp]
            digits.forEach((d, i) => {
                if (index + i < 6) newOtp[index + i] = d
            })
            setOtp(newOtp)
            return
        }

        const newOtp = [...otp]
        newOtp[index] = val
        setOtp(newOtp)

        // Focus next input slot
        if (val && element.nextElementSibling) {
            element.nextElementSibling.focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
        if (!pasted) return

        const digits = pasted.split("")
        const newOtp = ["", "", "", "", "", ""]
        digits.forEach((d, i) => {
            if (i < 6) newOtp[i] = d
        })
        setOtp(newOtp)
    }

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && e.target.previousElementSibling) {
            e.target.previousElementSibling.focus()
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setSuccessMsg("")

        const fullOtp = otp.join("")
        if (fullOtp.length !== 6) {
            setError("Please enter the complete 6-digit verification code sent to your email.")
            return
        }

        if (!email.trim()) {
            setError("Email address is required.")
            return
        }

        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters long.")
            return
        }

        if (newPassword !== confirmPassword) {
            setError("New password and confirm password do not match.")
            return
        }

        setIsSubmitting(true)
        const res = await handleResetPassword({ email, otp: fullOtp, newPassword })
        setIsSubmitting(false)

        if (res?.success) {
            setSuccessMsg(res.message || "Password reset successfully!")
            setTimeout(() => {
                navigate("/login")
            }, 600)
        } else {
            setError(res?.message || "Failed to reset password. Please check your code.")
        }
    }

    return (
        <main className='auth-page'>
            <Link to='/login' className='back-home-link'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to Login
            </Link>

            <div className="form-container">
                <div className='auth-header'>
                    <div className='logo-badge'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    <h1>Reset Password</h1>
                    <p>Enter the 6-digit OTP code sent to: <strong style={{ color: '#ff2d78' }}>{email || 'your email'}</strong> and set your new password</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {!emailParam && (
                        <div className="input-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                type="email"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <label>6-Digit Reset Code</label>
                        <div 
                            className="otp-inputs-row"
                            onPaste={handlePaste}
                            style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '6px' }}
                        >
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="1"
                                    value={data}
                                    onChange={(e) => handleOtpChange(e.target, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    style={{
                                        width: '46px',
                                        height: '52px',
                                        textAlign: 'center',
                                        fontSize: '20px',
                                        fontWeight: '700',
                                        borderRadius: '8px',
                                        border: '1px solid #2a3348',
                                        backgroundColor: '#1e2535',
                                        color: '#ff2d78'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="newPassword">New Password</label>
                        <div className="password-input-wrapper">
                            <input
                                onChange={(e) => setNewPassword(e.target.value)}
                                value={newPassword}
                                type={showNewPassword ? "text" : "password"}
                                id="newPassword"
                                name="newPassword"
                                placeholder="Enter new password (min 6 chars)"
                                autoComplete='new-password'
                                required
                            />
                            <button
                                type="button"
                                className="eye-toggle-btn"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                title={showNewPassword ? "Hide password" : "Show password"}
                                tabIndex="-1"
                            >
                                {showNewPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <div className="password-input-wrapper">
                            <input
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                value={confirmPassword}
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="Re-enter new password"
                                autoComplete='new-password'
                                required
                            />
                            <button
                                type="button"
                                className="eye-toggle-btn"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                title={showConfirmPassword ? "Hide password" : "Show password"}
                                tabIndex="-1"
                            >
                                {showConfirmPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && <div className='error-banner'>⚠️ {error}</div>}
                    {successMsg && <div className='status-banner success' style={{ backgroundColor: 'rgba(46, 204, 113, 0.15)', border: '1px solid #2ecc71', color: '#2ecc71', padding: '10px 14px', borderRadius: '8px', fontSize: '14px' }}>✅ {successMsg}</div>}

                    <button className='submit-btn' type='submit' disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <ButtonSpinner /> Resetting Password...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </form>

                <p className='auth-footer'>
                    Back to <Link to="/login">Login</Link>
                </p>
            </div>
        </main>
    )
}

export default ResetPassword
