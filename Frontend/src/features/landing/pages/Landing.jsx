import React from 'react'
import { Link } from 'react-router'
import '../style/landing.scss'
import { useAuth } from '../../auth/hooks/useAuth'

const Landing = () => {
    const { user } = useAuth()

    return (
        <div className='landing-page'>
            {/* Header Navbar */}
            <header className='landing-header'>
                <Link to='/' className='brand-logo'>
                    <div className='logo-icon'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 12 17 22 12" />
                        </svg>
                    </div>
                    <span className='logo-text'>PrepStrategist <span>AI</span></span>
                </Link>

                <div className='auth-actions'>
                    {user ? (
                        <Link to='/dashboard' className='btn-primary'>Go to Dashboard</Link>
                    ) : (
                        <>
                            <Link to='/login' className='btn-secondary'>Login</Link>
                            <Link to='/register' className='btn-primary'>Register</Link>
                        </>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <section className='hero-section'>
                <div className='badge-pill'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                    </svg>
                    Next-Gen AI Interview Strategist
                </div>

                <h1 className='hero-title'>
                    Ace Your Tech Interviews with <span className='highlight'>AI Precision</span>
                </h1>

                <p className='hero-description'>
                    Upload your resume, analyze real job descriptions, and unlock tailored technical questions, behavioral STAR responses, skill gap metrics, and download standard A4 ATS resumes.
                </p>

                <div className='hero-ctas'>
                    {user ? (
                        <Link to='/dashboard' className='cta-main'>Launch Generator &rarr;</Link>
                    ) : (
                        <>
                            <Link to='/register' className='cta-main'>Get Started Free</Link>
                            <Link to='/login' className='cta-secondary'>Login to Account</Link>
                        </>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section className='features-section'>
                <div className='section-header'>
                    <h2>Everything You Need for Interview Mastery</h2>
                    <p>Powered by advanced AI to prepare you for high-stakes technical evaluations.</p>
                </div>

                <div className='features-grid'>
                    {/* Feature 1 */}
                    <div className='feature-card'>
                        <div className='feature-icon'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 18l6-6-6-6" />
                                <path d="M8 6l-6 6 6 6" />
                            </svg>
                        </div>
                        <h3>Technical Q&amp;A</h3>
                        <p>Role-specific technical questions generated from exact job descriptions along with interviewer intention and optimal code answers.</p>
                    </div>

                    {/* Feature 2 */}
                    <div className='feature-card'>
                        <div className='feature-icon'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                            </svg>
                        </div>
                        <h3>Behavioral STAR Answers</h3>
                        <p>Structured scenario responses designed using the STAR framework to showcase leadership and teamwork skills.</p>
                    </div>

                    {/* Feature 3 */}
                    <div className='feature-card'>
                        <div className='feature-icon'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <h3>Skill Gap &amp; Match Score</h3>
                        <p>Real-time analysis comparing your resume profile against target job requirements with severity breakdown.</p>
                    </div>

                    {/* Feature 4 */}
                    <div className='feature-card'>
                        <div className='feature-icon'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="18" x2="12" y2="12" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                            </svg>
                        </div>
                        <h3>ATS A4 Resume PDF</h3>
                        <p>Generate and download standard, beautifully formatted A4 resumes optimized for Applicant Tracking Systems.</p>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className='steps-section'>
                <div className='steps-container'>
                    <div className='section-header'>
                        <h2>How It Works</h2>
                    </div>

                    <div className='steps-grid'>
                        <div className='step-item'>
                            <div className='step-number'>1</div>
                            <h4>Provide Profile</h4>
                            <p>Upload your existing resume PDF/DOCX or enter a quick self-description.</p>
                        </div>

                        <div className='step-item'>
                            <div className='step-number'>2</div>
                            <h4>Paste Job Role</h4>
                            <p>Copy and paste the job description for the company and position you're targeting.</p>
                        </div>

                        <div className='step-item'>
                            <div className='step-number'>3</div>
                            <h4>Get Custom Plan</h4>
                            <p>Receive your personalized interview strategy, day-by-day roadmap, and downloadable resume.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className='landing-footer'>
                <p>&copy; {new Date().getFullYear()} PrepStrategist AI. All rights reserved.</p>
                <div className='footer-links'>
                    <a href='#'>Privacy Policy</a>
                    <a href='#'>Terms of Service</a>
                    <a href='#'>Help Center</a>
                </div>
            </footer>
        </div>
    )
}

export default Landing
