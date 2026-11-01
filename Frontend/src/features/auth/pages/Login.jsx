import React, { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import { Loader, ButtonSpinner } from '../../../components/Loader/Loader'

const Login = () => {
    const { user, loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ showPassword, setShowPassword ] = useState(false)
    const [ error, setError ] = useState("")
    const [ unverifiedEmail, setUnverifiedEmail ] = useState("")
    const [ isSubmitting, setIsSubmitting ] = useState(false)

    // Redirect already authenticated users straight to dashboard
    if (user && !loading) {
        return <Navigate to="/dashboard" replace />
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setUnverifiedEmail("")
        setIsSubmitting(true)
        const res = await handleLogin({ email, password })
        setIsSubmitting(false)

        if (res?.success) {
            navigate('/dashboard')
        } else {
            setError(res?.message || "Login failed. Please check your credentials.")
            if (res?.isUnverified) {
                setUnverifiedEmail(res.email || email)
            }
        }
    }


    return (
        <main className='auth-page'>
            {/* Back to Landing Page Link */}
            <Link to='/' className='back-home-link'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to Home
            </Link>

            <div className="form-container">
                <div className='auth-header'>
                    <div className='logo-badge'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 17 22 12" />
                        </svg>
                    </div>
                    <h1>Welcome Back</h1>
                    <p>Log in to access your interview strategy dashboard</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            id="email"
                            name='email'
                            placeholder='name@example.com'
                            required
                        />
                    </div>

                    <div className="input-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label htmlFor="password">Password</label>
                            <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#ff2d78', textDecoration: 'none' }}>
                                Forgot Password?
                            </Link>
                        </div>
                        <div className="password-input-wrapper">
                            <input
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name='password'
                                placeholder='Enter your password'
                                autoComplete='current-password'
                                required
                            />
                            <button
                                type="button"
                                className="eye-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? "Hide password" : "Show password"}
                                tabIndex="-1"
                            >
                                {showPassword ? (
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

                    {error && (
                        <div className='error-banner'>
                            ⚠️ {error}
                            {unverifiedEmail && (
                                <div style={{ marginTop: '6px' }}>
                                    <Link to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`} style={{ color: '#ff2d78', fontWeight: 'bold', textDecoration: 'underline' }}>
                                        Click here to enter your 6-digit verification OTP &rarr;
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    <button className='submit-btn' type='submit' disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <ButtonSpinner /> Signing In...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <p className='auth-footer'>
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </main>
    )
}

export default Login