import React from 'react'
import './loader.scss'

export const Loader = ({ title = "Processing your request...", message = "Please wait a moment while we set up everything." }) => {
    return (
        <div className='saas-page-loader'>
            <div className='loader-card'>
                <div className='spinner-ring-container'>
                    <div className='outer-ring'></div>
                    <div className='inner-icon'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 17 22 22 12" />
                        </svg>
                    </div>
                </div>
                <h2>{title}</h2>
                <p>{message}</p>

                <div className='loading-progress-bar'>
                    <div className='progress-fill'></div>
                </div>
            </div>
        </div>
    )
}

export const ButtonSpinner = () => <span className="btn-spinner"></span>

export const ResumeGeneratorLoader = ({ title = "Generating ATS A4 Resume PDF...", message = "Tailoring candidate profile & formatting standard A4 PDF document..." }) => {
    return (
        <div className='resume-loader-overlay'>
            <div className='resume-loader-card'>
                <div className='document-icon-badge'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                </div>

                <h3>{title}</h3>
                <p>{message}</p>

                <div className='status-steps'>
                    <div className='step-item'>
                        <span className='dot'></span>
                        <span>Tailoring skills to target job requirements...</span>
                    </div>
                    <div className='step-item'>
                        <span className='dot'></span>
                        <span>Building ATS-friendly single/2-page A4 document...</span>
                    </div>
                    <div className='step-item'>
                        <span className='dot'></span>
                        <span>Compiling high-resolution PDF download file...</span>
                    </div>
                </div>

                <div className='resume-progress-bar'>
                    <div className='fill'></div>
                </div>
            </div>
        </div>
    )
}

export default Loader
