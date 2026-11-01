import React, { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import { ButtonSpinner } from '../../../components/Loader/Loader'

const ForgotPassword = () => {
    const navigate = useNavigate()
    const [ email, setEmail ] = useState("")
    const [ error, setError ] = useState("")
    const [ successMsg, setSuccessMsg ] = useState("")
    const [ isSubmitting, setIsSubmitting ] = useState(false)

    const { user, loading, handleForgotPassword } = useAuth()

    // Redirect already authenticated users to dashboard
    if (user && !loading) {
        return <Navigate to="/dashboard" replace />
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setSuccessMsg("")

        if (!email.trim()) {
            setError("Email address is required.")
            return
        }

        setIsSubmitting(true)
        const res = await handleForgotPassword({ email })
        setIsSubmitting(false)

        if (res?.success) {
            setSuccessMsg(res.message || "Password reset code sent!")
            setTimeout(() => {
                navigate(`/reset-password?email=${encodeURIComponent(email)}`)
            }, 500)
        } else {
            setError(res?.message || "Failed to process forgot password request.")
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
                    <h1>Forgot Password?</h1>
                    <p>Enter your registered email address to receive a 6-digit verification code</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            id="email"
                            name="email"
                            placeholder="name@example.com"
                            autoComplete="email"
                            required
                        />
                    </div>

                    {error && <div className='error-banner'>⚠️ {error}</div>}
                    {successMsg && <div className='status-banner success' style={{ backgroundColor: 'rgba(46, 204, 113, 0.15)', border: '1px solid #2ecc71', color: '#2ecc71', padding: '10px 14px', borderRadius: '8px', fontSize: '14px' }}>✅ {successMsg}</div>}

                    <button className='submit-btn' type='submit' disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <ButtonSpinner /> Sending Code...
                            </>
                        ) : (
                            'Send Reset Code'
                        )}
                    </button>
                </form>

                <p className='auth-footer'>
                    Remember your password? <Link to="/login">Sign In</Link>
                </p>
            </div>
        </main>
    )
}

export default ForgotPassword
