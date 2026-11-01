import React, { useState, useEffect, useRef } from 'react'
import '../style/resumeStudio.scss'
import { getResumeHtml, regenerateResumeHtml, exportCustomResumePdf } from '../services/interview.api'
import { ButtonSpinner } from '../../../components/Loader/Loader'

const ResumeStudioModal = ({ isOpen, onClose, interviewReportId, jobTitle }) => {
    const [ htmlContent, setHtmlContent ] = useState("")
    const [ selectedTemplate, setSelectedTemplate ] = useState("modern")
    const [ isEditing, setIsEditing ] = useState(false)
    const [ isLoading, setIsLoading ] = useState(true)
    const [ isRegenerating, setIsRegenerating ] = useState(false)
    const [ isDownloading, setIsDownloading ] = useState(false)
    const [ error, setError ] = useState("")
    const sheetRef = useRef(null)

    useEffect(() => {
        if (isOpen && interviewReportId) {
            loadResume()
        }
    }, [ isOpen, interviewReportId ])

    const loadResume = async () => {
        setIsLoading(true)
        setError("")
        try {
            const data = await getResumeHtml(interviewReportId)
            if (data?.resumeHtml) {
                setHtmlContent(data.resumeHtml)
                if (data.selectedTemplate) {
                    setSelectedTemplate(data.selectedTemplate)
                }
            }
        } catch (err) {
            console.error("Failed to load resume HTML:", err)
            setError(err?.message || "Failed to load resume preview.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegenerate = async () => {
        setIsRegenerating(true)
        setError("")
        try {
            const data = await regenerateResumeHtml({ interviewReportId })
            if (data?.resumeHtml) {
                setHtmlContent(data.resumeHtml)
            }
        } catch (err) {
            console.error("Failed to regenerate resume:", err)
            setError(err?.message || "Failed to regenerate resume with AI.")
        } finally {
            setIsRegenerating(false)
        }
    }

    const handleDownload = async () => {
        if (!sheetRef.current) return
        setIsDownloading(true)
        setError("")

        try {
            // Grab the current live HTML from the DOM including all inline user edits
            const currentLiveHtml = sheetRef.current.innerHTML

            const blob = await exportCustomResumePdf({
                htmlContent: currentLiveHtml,
                template: selectedTemplate,
                fileName: `${(jobTitle || 'Resume').replace(/\s+/g, '_')}_ATS`
            })

            const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `${(jobTitle || 'Resume').replace(/\s+/g, '_')}_ATS.pdf`)
            document.body.appendChild(link)
            link.click()
            link.parentNode.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (err) {
            console.error("Failed to download PDF:", err)
            setError("Failed to generate PDF download.")
        } finally {
            setIsDownloading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className='resume-studio-modal'>
            {/* Top Toolbar */}
            <header className='studio-toolbar'>
                <div className='brand-section'>
                    <span className='studio-badge'>Studio</span>
                    <h2>ATS Resume Customizer</h2>
                </div>

                <div className='controls-section'>
                    {/* Template Switcher */}
                    <div className='template-picker' title='Switch ATS Resume Theme'>
                        <button
                            type='button'
                            className={`tpl-btn ${selectedTemplate === 'modern' ? 'active' : ''}`}
                            onClick={() => setSelectedTemplate('modern')}
                        >
                            Modern
                        </button>
                        <button
                            type='button'
                            className={`tpl-btn ${selectedTemplate === 'classic' ? 'active' : ''}`}
                            onClick={() => setSelectedTemplate('classic')}
                        >
                            Classic ATS
                        </button>
                        <button
                            type='button'
                            className={`tpl-btn ${selectedTemplate === 'executive' ? 'active' : ''}`}
                            onClick={() => setSelectedTemplate('executive')}
                        >
                            Executive
                        </button>
                    </div>

                    {/* Inline Edit Toggle */}
                    <button
                        type='button'
                        className={`edit-toggle-btn ${isEditing ? 'active' : ''}`}
                        onClick={() => setIsEditing(!isEditing)}
                        title={isEditing ? 'Exit Edit Mode' : 'Enable Inline Editing'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        {isEditing ? 'Done Editing' : 'Edit Text'}
                    </button>

                    {/* AI Regenerate Button */}
                    <button
                        type='button'
                        className='btn-regenerate'
                        onClick={handleRegenerate}
                        disabled={isRegenerating || isLoading}
                        title='Regenerate fresh bullet points with Gemini AI'
                    >
                        {isRegenerating ? (
                            <>
                                <ButtonSpinner /> AI Writing...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                                </svg>
                                Regenerate with AI
                            </>
                        )}
                    </button>

                    {/* Download PDF Button */}
                    <button
                        type='button'
                        className='btn-download-pdf'
                        onClick={handleDownload}
                        disabled={isDownloading || isLoading}
                    >
                        {isDownloading ? (
                            <>
                                <ButtonSpinner /> Exporting PDF...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download ATS PDF
                            </>
                        )}
                    </button>

                    {/* Close Studio Button */}
                    <button
                        type='button'
                        className='close-studio-btn'
                        onClick={onClose}
                        title='Close Resume Studio'
                    >
                        &times;
                    </button>
                </div>
            </header>

            {/* Edit Mode Notice Banner */}
            {isEditing && (
                <div className='edit-notice-bar'>
                    <span>✏️ <strong>Live Edit Mode Active:</strong> Click directly on your name, summary, or any bullet point to edit text. When finished, click <strong>"Done Editing"</strong>.</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div style={{ background: '#7f1d1d', color: '#fecaca', padding: '8px 1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
                    ⚠️ {error}
                </div>
            )}

            {/* A4 Paper Viewport */}
            <main className='studio-viewport'>
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8b949e', gap: '1rem' }}>
                        <ButtonSpinner />
                        <p>Generating your tailored ATS resume with Gemini AI...</p>
                    </div>
                ) : (
                    <div
                        ref={sheetRef}
                        className={`a4-paper-container template-${selectedTemplate} ${isEditing ? 'editable-active' : ''}`}
                        contentEditable={isEditing}
                        suppressContentEditableWarning={true}
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                )}
            </main>
        </div>
    )
}

export default ResumeStudioModal
