import React, { useState, useEffect, useRef } from 'react'
import '../style/resumeStudio.scss'
import { getResumeHtml, regenerateResumeHtml, exportCustomResumePdf } from '../services/interview.api'
import { ButtonSpinner } from '../../../components/Loader/Loader'
import html2pdf from 'html2pdf.js'

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

    const triggerNativePrint = (html, template, title) => {
        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = '0'
        iframe.title = 'Resume Print Frame'
        document.body.appendChild(iframe)

        const doc = iframe.contentWindow.document
        doc.open()
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${(title || 'Resume').replace(/\s+/g, '_')}_ATS</title>
                <style>
                    @page { size: A4 portrait; margin: 8mm 10mm; }
                    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    html, body { margin: 0; padding: 0; background: #fff; color: #1e293b; font-size: 9pt; line-height: 1.35; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                    .resume-wrapper { width: 100%; }
                    .resume-section { margin-bottom: 7px; page-break-inside: avoid; break-inside: avoid; }
                    .summary-text { margin: 0 0 3px 0; font-size: 8.8pt; color: #334155; line-height: 1.32; }
                    .job-entry, .project-entry { margin-bottom: 5px; page-break-inside: avoid; break-inside: avoid; }
                    .job-header, .project-header { display: flex; justify-content: space-between; align-items: baseline; font-size: 9.2pt; }
                    .job-role, .project-name { font-weight: 700; color: #0f172a; }
                    .job-dates, .project-tech { font-size: 8.2pt; color: #64748b; font-weight: 600; }
                    .job-company { font-size: 8.2pt; font-style: italic; color: #475569; margin-bottom: 2px; }
                    .job-bullets { margin: 2px 0 3px 0; padding-left: 14px; }
                    .job-bullets li { margin-bottom: 2px; font-size: 8.6pt; line-height: 1.3; color: #334155; }
                    .edu-entry { font-size: 8.6pt; margin-bottom: 2px; color: #334155; }

                    /* Template specific */
                    .template-modern .candidate-name { font-size: 18pt; font-weight: 800; color: #0f172a; margin: 0 0 2px 0; }
                    .template-modern .candidate-target-title { font-size: 10.5pt; font-weight: 700; color: #ff2d78; margin-bottom: 3px; }
                    .template-modern .candidate-contact { font-size: 8.5pt; color: #64748b; margin-bottom: 8px; }
                    .template-modern .section-title { font-size: 9.5pt; font-weight: 700; color: #0f172a; text-transform: uppercase; border-bottom: 1.5px solid #ff2d78; padding-bottom: 2px; margin-top: 8px; margin-bottom: 4px; }
                    .template-modern .skill-tag { display: inline-block; background: #f1f5f9; color: #1e293b; padding: 2px 5px; border-radius: 3px; font-size: 8pt; margin-right: 4px; margin-bottom: 3px; }

                    .template-classic { font-family: "Times New Roman", Times, Georgia, serif; color: #000; }
                    .template-classic .candidate-name { font-size: 19pt; font-weight: 700; text-align: center; margin-bottom: 2px; text-transform: uppercase; }
                    .template-classic .candidate-target-title { font-size: 10.5pt; font-weight: 700; text-align: center; font-style: italic; margin-bottom: 3px; }
                    .template-classic .candidate-contact { font-size: 8.5pt; text-align: center; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 8px; }
                    .template-classic .section-title { font-size: 9.5pt; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #333; margin-top: 8px; margin-bottom: 4px; }
                    .template-classic .skill-tag { display: inline-block; font-size: 8.5pt; margin-right: 8px; }

                    .template-executive { font-family: "Segoe UI", Arial, sans-serif; color: #2d3748; }
                    .template-executive .candidate-name { font-size: 19pt; font-weight: 700; color: #1a365d; margin-bottom: 2px; }
                    .template-executive .candidate-target-title { font-size: 10.5pt; font-weight: 600; color: #2b6cb0; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px; }
                    .template-executive .candidate-contact { font-size: 8.5pt; color: #718096; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 8px; }
                    .template-executive .section-title { font-size: 9.5pt; font-weight: 700; color: #2b6cb0; border-left: 3px solid #2b6cb0; padding-left: 6px; margin-top: 8px; margin-bottom: 4px; text-transform: uppercase; }
                    .template-executive .skill-tag { display: inline-block; background: #edf2f7; color: #2b6cb0; padding: 2px 5px; border-radius: 3px; font-size: 8pt; margin-right: 4px; margin-bottom: 3px; }
                </style>
            </head>
            <body>
                <div class="resume-wrapper template-${template}">
                    ${html}
                </div>
            </body>
            </html>
        `)
        doc.close()

        setTimeout(() => {
            iframe.contentWindow.focus()
            iframe.contentWindow.print()
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe)
                }
            }, 2000)
        }, 300)
    }

    const handleDownload = async () => {
        if (!sheetRef.current) return
        setIsDownloading(true)
        setError("")

        try {
            const fileName = `${(jobTitle || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_')}_ATS.pdf`

            // Blur any focused editable field to remove cursor / selection outlines
            if (document.activeElement && document.activeElement.blur) {
                document.activeElement.blur()
            }

            // Clone sheet to export cleanly without disrupting live interactive screen
            const element = sheetRef.current.cloneNode(true)
            element.classList.remove('editable-active')
            element.style.boxShadow = 'none'
            element.style.margin = '0 auto'
            element.style.border = 'none'
            element.style.outline = 'none'
            element.style.width = '210mm'
            element.style.backgroundColor = '#ffffff'

            // Wrap in off-screen container for crisp vector capture
            const container = document.createElement('div')
            container.style.position = 'fixed'
            container.style.left = '-9999px'
            container.style.top = '0'
            container.style.width = '210mm'
            container.style.background = '#ffffff'
            container.appendChild(element)
            document.body.appendChild(container)

            const opt = {
                margin: [8, 10, 8, 10], // mm
                filename: fileName,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                    scrollX: 0,
                    scrollY: 0,
                    windowWidth: 794
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait'
                },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            }

            await html2pdf().set(opt).from(element).save()
            document.body.removeChild(container)
        } catch (err) {
            console.warn("Client html2pdf error, triggering high-fidelity print fallback:", err)
            try {
                triggerNativePrint(sheetRef.current.innerHTML, selectedTemplate, jobTitle)
            } catch (printErr) {
                console.error("Print fallback also failed:", printErr)
                setError("Failed to generate PDF. Please click the 'Print' button to save as PDF.")
            }
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

                    {/* Native Print / Save Vector PDF Button */}
                    <button
                        type='button'
                        className='btn-print-pdf'
                        onClick={() => triggerNativePrint(sheetRef.current.innerHTML, selectedTemplate, jobTitle)}
                        disabled={isLoading}
                        title='Print or Save as Vector PDF via browser print preview'
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                        Print
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

            {/* Mobile swipe hint */}
            <div className='mobile-preview-hint'>
                <span>↔️ Swipe horizontally to view full A4 resume</span>
            </div>

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
