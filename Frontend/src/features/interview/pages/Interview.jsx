import React, { useState, useEffect } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, useParams, Link } from 'react-router'
import { Loader, ButtonSpinner, ResumeGeneratorLoader } from '../../../components/Loader/Loader'
import ResumeStudioModal from '../components/ResumeStudioModal'

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
]

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [ open, setOpen ] = useState(false)
    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

const RoadMapDay = ({ day, completedTasks, onToggleTask }) => {
    const totalTasks = day.tasks?.length || 0
    const dayCompletedCount = (day.tasks || []).filter((_, i) => completedTasks[`day_${day.day}_task_${i}`]).length
    const isDayCompleted = totalTasks > 0 && dayCompletedCount === totalTasks

    return (
        <div className={`roadmap-day ${isDayCompleted ? 'roadmap-day--completed' : ''}`}>
            {/* Timeline Milestone Dot */}
            <div className={`roadmap-node ${isDayCompleted ? 'roadmap-node--completed' : ''}`}>
                <span>{day.day}</span>
            </div>

            {/* Day Content Card */}
            <div className='roadmap-card'>
                <div className='roadmap-card__header'>
                    <div className='roadmap-card__title-group'>
                        <span className={`roadmap-day-pill ${isDayCompleted ? 'roadmap-day-pill--completed' : ''}`}>
                            Day {day.day}
                        </span>
                        <h3 className='roadmap-card__focus'>{day.focus}</h3>
                    </div>

                    <div className='roadmap-card__status'>
                        {isDayCompleted ? (
                            <span className='day-status-badge day-status-badge--completed'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Completed
                            </span>
                        ) : (
                            <span className='day-status-badge'>
                                {dayCompletedCount}/{totalTasks} Done
                            </span>
                        )}
                    </div>
                </div>

                <div className='roadmap-tasks'>
                    {(day.tasks || []).map((task, i) => {
                        const taskId = `day_${day.day}_task_${i}`
                        const isDone = !!completedTasks[taskId]

                        return (
                            <div 
                                key={i} 
                                className={`task-item ${isDone ? 'task-item--checked' : ''}`}
                                onClick={() => onToggleTask(taskId)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleTask(taskId) }}
                            >
                                <div className={`task-checkbox ${isDone ? 'checked' : ''}`}>
                                    {isDone && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </div>
                                <span className='task-text'>{task}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical')
    const [ isDownloading, setIsDownloading ] = useState(false)
    const [ isResumeStudioOpen, setIsResumeStudioOpen ] = useState(false)
    const [ completedTasks, setCompletedTasks ] = useState({})
    const { report, getReportById, loading, getResumePdf } = useInterview()
    const { interviewId } = useParams()

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
            try {
                const saved = localStorage.getItem(`roadmap_tasks_${interviewId}`)
                if (saved) {
                    setCompletedTasks(JSON.parse(saved))
                }
            } catch (e) {
                console.error("Failed to load saved roadmap tasks:", e)
            }
        }
    }, [ interviewId ])

    const handleToggleTask = (taskId) => {
        setCompletedTasks(prev => {
            const next = { ...prev, [taskId]: !prev[taskId] }
            try {
                localStorage.setItem(`roadmap_tasks_${interviewId}`, JSON.stringify(next))
            } catch (e) {
                console.error("Failed to save roadmap tasks:", e)
            }
            return next
        })
    }

    const allTasksCount = (report?.preparationPlan || []).reduce((acc, d) => acc + (d.tasks?.length || 0), 0)
    const completedTasksCount = Object.keys(completedTasks).filter(k => completedTasks[k]).length
    const progressPercent = allTasksCount > 0 ? Math.min(100, Math.round((completedTasksCount / allTasksCount) * 100)) : 0

    const handleDownload = async () => {
        setIsDownloading(true)
        await getResumePdf(interviewId)
        setIsDownloading(false)
    }

    if (loading || !report) {
        return <Loader title="Loading Interview Strategy..." message="Fetching questions, preparation roadmap, and ATS evaluation metrics..." />
    }

    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
            report.matchScore >= 60 ? 'score--mid' : 'score--low'

    return (
        <div className='interview-page'>
            {/* Dedicated Resume Generation Modal */}
            {isDownloading && <ResumeGeneratorLoader />}

            {/* Interactive ATS Resume Studio Modal */}
            <ResumeStudioModal 
                isOpen={isResumeStudioOpen} 
                onClose={() => setIsResumeStudioOpen(false)} 
                interviewReportId={interviewId} 
                jobTitle={report?.title} 
            />

            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-top-header">
                        <Link to="/dashboard" className="back-dashboard-link">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back to Dashboard
                        </Link>
                    </div>

                    <div className="nav-content">
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setIsResumeStudioOpen(true)}
                        className='button primary-button customize-resume-btn'
                        style={{ background: 'linear-gradient(135deg, #ff2d78, #d20d3b)', boxShadow: '0 4px 15px rgba(255, 45, 120, 0.35)' }}>
                        <svg height={"1rem"} style={{ marginRight: "0.6rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                        </svg>
                        Customize Resume
                    </button>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{(report?.technicalQuestions || []).length} questions</span>
                            </div>
                            <div className='q-list'>
                                {(report?.technicalQuestions || []).map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{(report?.behavioralQuestions || []).length} questions</span>
                            </div>
                            <div className='q-list'>
                                {(report?.behavioralQuestions || []).map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section className='roadmap-section'>
                            <div className='content-header'>
                                <div>
                                    <h2>Preparation Road Map</h2>
                                    <p className='section-subtext'>Interactive readiness track — check off tasks as you prepare.</p>
                                </div>
                                <span className='content-header__count'>{(report?.preparationPlan || []).length}-day plan</span>
                            </div>

                            {/* Overall Progress Tracker Bar */}
                            <div className='roadmap-progress-card'>
                                <div className='progress-card-info'>
                                    <span className='progress-label'>Readiness Track</span>
                                    <span className='progress-stats'>
                                        <strong>{completedTasksCount}</strong> of <strong>{allTasksCount}</strong> tasks completed ({progressPercent}%)
                                    </span>
                                </div>
                                <div className='progress-track-bar'>
                                    <div className='progress-track-fill' style={{ width: `${progressPercent}%` }} />
                                </div>
                            </div>

                            <div className='roadmap-list'>
                                {(report?.preparationPlan || []).map((day) => (
                                    <RoadMapDay 
                                        key={day.day} 
                                        day={day} 
                                        completedTasks={completedTasks}
                                        onToggleTask={handleToggleTask}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report?.matchScore ?? 0}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>Strong match for this role</p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Skill Gaps */}
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {(report?.skillGaps || []).map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>

                </aside>
            </div>
        </div>
    )
}

export default Interview