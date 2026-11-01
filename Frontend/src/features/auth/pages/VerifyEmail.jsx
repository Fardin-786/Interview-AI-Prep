import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import { ButtonSpinner } from '../../../components/Loader/Loader'

const VerifyEmail = () => {
    const [ searchParams ] = useSearchParams()
    const emailParam = searchParams.get("email") || ""

    const [ email, setEmail ] = useState(emailParam)
    const [ otp, setOtp ] = useState(["", "", "", "", "", ""])
    const [ error, setError ] = useState("")
    const [ successMsg, setSuccessMsg ] = useState("")
    const [ isSubmitting, setIsSubmitting ] = useState(false)

    // Resend countdown timer state (60s)
    const [ timer, setTimer ] = useState(60)
    const [ canResend, setCanResend ] = useState(false)
    const [ isResending, setIsResending ] = useState(false)

    const navigate = useNavigate()
    const { user, handleVerifyEmail, handleResendOtp } = useAuth()

    useEffect(() => {
        let interval = null
        if (timer > 0) {
            setCanResend(false)
            interval = setInterval(() => {
                setTimer((prev) => prev - 1)
            }, 1000)
        } else {
            setCanResend(true)
        }
        return () => clearInterval(interval)
    }, [ timer ])

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

        setIsSubmitting(true)
        const res = await handleVerifyEmail({ email, otp: fullOtp })
        setIsSubmitting(false)

        if (res?.success) {
            setSuccessMsg(user ? "Email address updated successfully!" : (res.message || "Email verified successfully!"))
            setTimeout(() => {
                if (user) {
                    navigate("/dashboard")
                } else {
                    navigate("/login")
                }
            }, 600)
        } else {
            setError(res?.message || "Invalid or expired OTP code.")
        }
    }

    const onResend = async () => {
        if (!canResend) return
        setError("")
        setSuccessMsg("")
        setIsResending(true)

        const res = await handleResendOtp({ email })
        setIsResending(false)

        if (res?.success) {
            setSuccessMsg(res.message || "A new OTP code has been sent to your email.")
            setTimer(60)
        } else {
            setError(res?.message || "Failed to resend code.")
        }
    }

    return (
        <main className='auth-page'>
            <Link to={user ? '/dashboard' : '/'} className='back-home-link'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                </svg>
                {user ? 'Back to Dashboard' : 'Back to Home'}
            </Link>

            <div className="form-container">
                <div className='auth-header'>
                    <div className='logo-badge'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                    </div>
                    <h1>Verify Email Address</h1>
                    <p>Enter the 6-digit OTP code sent to: <strong style={{ color: '#ff2d78' }}>{email || 'your email'}</strong></p>
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
                        <label>6-Digit Verification Code</label>
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

                    {error && <div className='error-banner'>⚠️ {error}</div>}
                    {successMsg && <div className='status-banner success' style={{ backgroundColor: 'rgba(46, 204, 113, 0.15)', border: '1px solid #2ecc71', color: '#2ecc71', padding: '10px 14px', borderRadius: '8px', fontSize: '14px' }}>✅ {successMsg}</div>}

                    <button className='submit-btn' type='submit' disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <ButtonSpinner /> Verifying Code...
                            </>
                        ) : (
                            'Verify Email & Activate'
                        )}
                    </button>
                </form>

                <div className='auth-footer' style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <p>
                        Didn't receive the code?{' '}
                        {canResend ? (
                            <button
                                type="button"
                                onClick={onResend}
                                disabled={isResending}
                                style={{ background: 'none', border: 'none', color: '#ff2d78', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>
                                {isResending ? 'Resending...' : 'Resend OTP'}
                            </button>
                        ) : (
                            <span style={{ opacity: 0.6 }}>Resend in {timer}s</span>
                        )}
                    </p>
                    <p style={{ fontSize: '0.8rem' }}>
                        Back to {user ? <Link to="/dashboard">Dashboard</Link> : <Link to="/login">Login</Link>}
                    </p>
                </div>
            </div>
        </main>
    )
}

export default VerifyEmail
