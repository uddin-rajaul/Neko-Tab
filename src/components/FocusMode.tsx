import { useState, useEffect, useCallback, useRef } from 'react'
import { Scan, Play, Pause, RotateCcw, X, Shield, Plus } from 'lucide-react'
import { useActivity } from '../hooks/useActivity'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useFocusSessions } from '../hooks/useFocusSessions'
import type { FocusSession } from '../hooks/useFocusSessions'
import { clearFocusSessionTabUsageCount, readFocusSessionTabUsageCount } from '../utils/tabUsage'

const ConsistencyIcon = ({ size = 18, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Page base with folded corner */}
    <path d="M 12 25 H 88 C 92 25 94 27 94 32 V 75 H 77 C 73 75 70 78 70 82 V 95 H 12 C 8 95 6 93 6 88 V 32 C 6 27 8 25 12 25 Z" />
    <path d="M 70 95 C 75 95 80 92 84 87 C 89 82 94 77 94 75" />
    
    {/* Top binding line */}
    <line x1="6" y1="36" x2="94" y2="36" />

    {/* Rings */}
    <line x1="20" y1="8" x2="20" y2="17" /> <circle cx="20" cy="21" r="2.5" />
    <line x1="40" y1="8" x2="40" y2="17" /> <circle cx="40" cy="21" r="2.5" />
    <line x1="60" y1="8" x2="60" y2="17" /> <circle cx="60" cy="21" r="2.5" />
    <line x1="80" y1="8" x2="80" y2="17" /> <circle cx="80" cy="21" r="2.5" />

    {/* Row 1 checks */}
    <path d="M 18 52 L 23 57 L 32 46" />
    <path d="M 43 52 L 48 57 L 57 46" />
    <path d="M 68 52 L 73 57 L 82 46" />

    {/* Row 2 checks */}
    <path d="M 18 70 L 23 75 L 32 64" />
    <path d="M 43 70 L 48 75 L 57 64" />
    <path d="M 68 70 L 73 75 L 82 64" />

    {/* Row 3 squares */}
    <rect x="18" y="80" width="8" height="8" rx="1.5" />
    <rect x="43" y="80" width="8" height="8" rx="1.5" />
  </svg>
)

const DURATION_PRESETS = [15, 25, 45, 90]

const DISTRACTING_SITES = [
  { id: 'facebook', name: 'Facebook', domain: 'facebook.com' },
  { id: 'instagram', name: 'Instagram', domain: 'instagram.com' },
  { id: 'tiktok', name: 'TikTok', domain: 'tiktok.com' },
  { id: 'twitter', name: 'Twitter/X', domain: 'twitter.com' },
  { id: 'x', name: 'X.com', domain: 'x.com' },
  { id: 'linkedin', name: 'LinkedIn', domain: 'linkedin.com' },
  { id: 'reddit', name: 'Reddit', domain: 'reddit.com' },
  { id: 'youtube', name: 'YouTube', domain: 'youtube.com' },
  { id: 'netflix', name: 'Netflix', domain: 'netflix.com' },
  { id: 'twitch', name: 'Twitch', domain: 'twitch.tv' },
]

interface PomodoroState {
  isRunning: boolean
  startedAt: number | null
  pausedTimeLeft: number | null
  task: string
  durationSec: number
  sessionId: string | null
  ownerTabId: string | null
}

interface CustomSite {
  id: string
  domain: string
}

interface SummaryData {
  task: string
  durationSec: number
  tabsUsed: number
  distractions: {
    domain: string
    attemptedAt: number
  }[]
}

export function FocusMode() {
  const [isActive, setIsActive] = useState(false)
  const [durationMin, setDurationMin] = useLocalStorage<number>('focus-duration-min', 25)
  const [customInput, setCustomInput] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [taskInput, setTaskInput] = useState('')
  const [pomodoroState, setPomodoroState] = useLocalStorage<PomodoroState>('pomodoro-state', {
    isRunning: false,
    startedAt: null,
    pausedTimeLeft: null,
    task: '',
    durationSec: 25 * 60,
    sessionId: null,
    ownerTabId: null,
  })
  const [blockedSites, setBlockedSites] = useLocalStorage<string[]>('blocked-sites', [])
  const [customSites, setCustomSites] = useLocalStorage<CustomSite[]>('custom-blocked-sites', [])
  const [customSiteInput, setCustomSiteInput] = useState('')
  const [showBlockSection, setShowBlockSection] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [timeLeft, setTimeLeft] = useState(durationMin * 60)
  const { completeFocusSession } = useActivity()
  const { addSession, todayBlocks, todayFormatted, streak, bestStreak, weeklyBlocks, identityLine } = useFocusSessions()
  const hasCompletedRef = useRef(false)
  const taskRef = useRef<HTMLInputElement>(null)

  const getClientTabId = useCallback(() => {
    const existingId = sessionStorage.getItem('neko-focus-tab-id')
    if (existingId) return existingId

    const nextId = crypto.randomUUID()
    sessionStorage.setItem('neko-focus-tab-id', nextId)
    return nextId
  }, [])

  const readDistractionLog = useCallback(async (sessionId: string | null) => {
    if (!sessionId) return []

    try {
      const storageKey = `focus-distraction-log:${sessionId}`
      const raw = localStorage.getItem(storageKey)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [])

  const clearDistractionLog = useCallback(async (sessionId: string | null) => {
    if (!sessionId) return

    try {
      localStorage.removeItem(`focus-distraction-log:${sessionId}`)
    } catch {
      // Ignore cleanup failures for ephemeral session data.
    }
  }, [])

  // Restore timer state on mount
  useEffect(() => {
    if (pomodoroState.isRunning && pomodoroState.startedAt) {
      const elapsed = Math.floor((Date.now() - pomodoroState.startedAt) / 1000)
      const remaining = pomodoroState.durationSec - elapsed
      setTimeLeft(remaining > 0 ? remaining : 0)
    } else if (pomodoroState.pausedTimeLeft !== null) {
      setTimeLeft(pomodoroState.pausedTimeLeft)
    } else {
      setTimeLeft(durationMin * 60)
    }
    if (pomodoroState.task) setTaskInput(pomodoroState.task)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const syncBlockingState = useCallback((running: boolean, sites: string[], custom: CustomSite[], sessionId: string | null) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const presetDomains = running
        ? DISTRACTING_SITES.filter(s => sites.includes(s.id)).map(s => s.domain)
        : []
      const customDomains = running ? custom.map(s => s.domain) : []
      chrome.storage.local.set({
        focusBlocking: {
          isActive: running,
          blockedDomains: [...presetDomains, ...customDomains],
          sessionId: running ? sessionId : null,
        }
      })
    }
  }, [])

  const toggleFocus = useCallback(() => setIsActive(prev => !prev), [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isActive) setIsActive(false)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault()
      toggleFocus()
    }
  }, [isActive, toggleFocus])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (isActive && 'Notification' in window) Notification.requestPermission()
    if (isActive) setTimeout(() => taskRef.current?.focus(), 100)
  }, [isActive])

  // Timer countdown
  useEffect(() => {
    if (!pomodoroState.isRunning || !pomodoroState.startedAt) {
      if (pomodoroState.pausedTimeLeft !== null) {
        setTimeLeft(pomodoroState.pausedTimeLeft)
      } else {
        setTimeLeft(durationMin * 60)
      }
      return
    }

    const syncRemaining = () => {
      const elapsed = Math.floor((Date.now() - pomodoroState.startedAt!) / 1000)
      const remaining = Math.max(0, pomodoroState.durationSec - elapsed)
      setTimeLeft(remaining)
    }

    syncRemaining()
    const interval = setInterval(syncRemaining, 1000)
    window.addEventListener('focus', syncRemaining)
    document.addEventListener('visibilitychange', syncRemaining)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', syncRemaining)
      document.removeEventListener('visibilitychange', syncRemaining)
    }
  }, [pomodoroState.isRunning, pomodoroState.startedAt, pomodoroState.durationSec, pomodoroState.pausedTimeLeft, durationMin])

  useEffect(() => {
    if (
      timeLeft === 0 &&
      pomodoroState.isRunning &&
      !hasCompletedRef.current &&
      pomodoroState.ownerTabId === getClientTabId()
    ) {
      hasCompletedRef.current = true
      const finishSession = async () => {
        const distractions = await readDistractionLog(pomodoroState.sessionId)
        const tabsUsed = await readFocusSessionTabUsageCount(pomodoroState.sessionId)
        const completedSession: FocusSession = {
          task: pomodoroState.task || 'Deep work',
          startedAt: pomodoroState.startedAt ?? Date.now() - pomodoroState.durationSec * 1000,
          completedAt: Date.now(),
          durationSec: pomodoroState.durationSec,
          completed: true,
          tabsUsed,
          distractions,
        }

        addSession(completedSession)
        completeFocusSession()
        setPomodoroState({
          isRunning: false,
          startedAt: null,
          pausedTimeLeft: null,
          task: '',
          durationSec: durationMin * 60,
          sessionId: null,
          ownerTabId: null,
        })
        syncBlockingState(false, blockedSites, customSites, null)
        setSummaryData({
          task: completedSession.task,
          durationSec: completedSession.durationSec,
          tabsUsed,
          distractions,
        })
        setShowSummary(true)
        await clearDistractionLog(pomodoroState.sessionId)
        await clearFocusSessionTabUsageCount(pomodoroState.sessionId)
      }

      void finishSession()
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
      audio.play().catch(() => {})
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: 'neko-focus-session-complete' }).catch(() => {})
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus session complete!', { body: 'Great job. Take a break.', icon: '/favicon.svg' })
      }
    }
  }, [timeLeft, pomodoroState.isRunning, pomodoroState.sessionId, pomodoroState.startedAt, pomodoroState.durationSec, pomodoroState.task, pomodoroState.ownerTabId, blockedSites, customSites, durationMin, addSession, completeFocusSession, syncBlockingState, readDistractionLog, clearDistractionLog, getClientTabId]) // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`
  }

  const selectDuration = (min: number) => {
    if (pomodoroState.isRunning) return
    setDurationMin(min)
    setTimeLeft(min * 60)
    setPomodoroState(prev => ({ ...prev, durationSec: min * 60, pausedTimeLeft: null }))
    setShowCustom(false)
  }

  const applyCustomDuration = () => {
    const val = parseInt(customInput)
    if (!val || val < 1 || val > 480) return
    selectDuration(val)
    setCustomInput('')
  }

  const startTimer = () => {
    hasCompletedRef.current = false
    const dur = pomodoroState.pausedTimeLeft !== null ? pomodoroState.pausedTimeLeft : durationMin * 60
    const sessionId = pomodoroState.sessionId ?? crypto.randomUUID()
    const ownerTabId = getClientTabId()
    void clearDistractionLog(sessionId)
    void clearFocusSessionTabUsageCount(sessionId)
    setPomodoroState({
      isRunning: true,
      startedAt: Date.now() - ((durationMin * 60 - dur) * 1000),
      pausedTimeLeft: null,
      task: taskInput.trim() || 'Deep work',
      durationSec: durationMin * 60,
      sessionId,
      ownerTabId,
    })
    syncBlockingState(true, blockedSites, customSites, sessionId)
  }

  const pauseTimer = () => {
    setPomodoroState(prev => ({ ...prev, isRunning: false, startedAt: null, pausedTimeLeft: timeLeft }))
    syncBlockingState(false, blockedSites, customSites, null)
  }

  const resetTimer = () => {
    void clearDistractionLog(pomodoroState.sessionId)
    void clearFocusSessionTabUsageCount(pomodoroState.sessionId)
    hasCompletedRef.current = false
    setPomodoroState({
      isRunning: false,
      startedAt: null,
      pausedTimeLeft: null,
      task: '',
      durationSec: durationMin * 60,
      sessionId: null,
      ownerTabId: null,
    })
    setTimeLeft(durationMin * 60)
    setTaskInput('')
    syncBlockingState(false, blockedSites, customSites, null)
  }

  const toggleSiteBlock = (siteId: string) => {
    setBlockedSites(prev => {
      const next = prev.includes(siteId) ? prev.filter(id => id !== siteId) : [...prev, siteId]
      if (pomodoroState.isRunning) syncBlockingState(true, next, customSites, pomodoroState.sessionId)
      return next
    })
  }

  const addCustomSite = () => {
    let domain = customSiteInput.trim().toLowerCase()
    if (!domain) return
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
    if (customSites.some(s => s.domain === domain)) { setCustomSiteInput(''); return }
    const newSite: CustomSite = { id: `custom-${Date.now()}`, domain }
    const next = [...customSites, newSite]
    setCustomSites(next)
    setCustomSiteInput('')
    if (pomodoroState.isRunning) syncBlockingState(true, blockedSites, next, pomodoroState.sessionId)
  }

  const removeCustomSite = (siteId: string) => {
    const next = customSites.filter(s => s.id !== siteId)
    setCustomSites(next)
    if (pomodoroState.isRunning) syncBlockingState(true, blockedSites, next, pomodoroState.sessionId)
  }

  const maxWeekly = Math.max(...weeklyBlocks, 1)

  const todaySessions = (() => {
    try {
      const raw = localStorage.getItem('focus-sessions')
      const all: FocusSession[] = raw ? JSON.parse(raw) : []
      const today = new Date().toLocaleDateString()
      return all.filter(s => s.completed && new Date(s.completedAt).toLocaleDateString() === today)
        .sort((a, b) => b.completedAt - a.completedAt)
    } catch { return [] }
  })()


  return (
    <>
      <button
        className="focus-toggle-btn"
        onClick={toggleFocus}
        title="Focus Mode (Ctrl+F)"
      >
        <Scan size={20} />
      </button>

      {isActive && (
        <div className="focus-overlay" onClick={() => setIsActive(false)}>
          <div className="focus-modal" onClick={e => e.stopPropagation()}>
            <div className="focus-header">
              <h2>FOCUS MODE</h2>
              <button onClick={() => setIsActive(false)} className="close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="focus-task-section">
              <div className="task-prompt">&gt; what are you working on?</div>
              <input
                ref={taskRef}
                type="text"
                className="focus-task-input"
                placeholder="griding out the week, writing a report, etc."
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                disabled={pomodoroState.isRunning}
              />
            </div>

            <div className="focus-duration-section">
              <span className="duration-label">duration:</span>
              <div className="duration-presets">
                {DURATION_PRESETS.map(m => (
                  <button
                    key={m}
                    className={`duration-btn ${durationMin === m ? 'active' : ''}`}
                    onClick={() => selectDuration(m)}
                    disabled={pomodoroState.isRunning}
                  >
                    [{m}]
                  </button>
                ))}
                
                {showCustom ? (
                  <div className="custom-duration-input">
                    <input
                      type="number"
                      min="1"
                      max="480"
                      value={customInput}
                      onChange={e => setCustomInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && applyCustomDuration()}
                      disabled={pomodoroState.isRunning}
                      autoFocus
                    />
                    <button onClick={applyCustomDuration} disabled={pomodoroState.isRunning}>
                      ✓
                    </button>
                  </div>
                ) : (
                  <button
                    className="duration-btn custom-btn"
                    onClick={() => setShowCustom(true)}
                    disabled={pomodoroState.isRunning}
                  >
                    [custom]
                  </button>
                )}
              </div>
            </div>

            <div className="focus-timer-display">
              <div className="time">{formatTime(timeLeft)}</div>
            </div>

            <div className="focus-controls">
              {!pomodoroState.isRunning ? (
                <button onClick={startTimer} className="focus-btn primary">
                  <Play size={16} /> [ ▶ Start ]
                </button>
              ) : (
                <button onClick={pauseTimer} className="focus-btn">
                  <Pause size={16} /> [ ⏸ Pause ]
                </button>
              )}
              <button onClick={resetTimer} className="focus-btn" disabled={!pomodoroState.isRunning && pomodoroState.pausedTimeLeft === null}>
                <RotateCcw size={16} /> [ ↺ Reset ]
              </button>
            </div>

            <div className="focus-divider"></div>

            <div className="focus-dashboard">
              <div className="dashboard-stats">
                <div className="stat-col">
                  <div className="stat-value">{todayBlocks} {todayBlocks === 1 ? 'block' : 'blocks'}</div>
                  <div className="stat-sub">{todayFormatted}</div>
                  <div className="stat-title">TODAY</div>
                </div>
                <div className="stat-col">
                  <div className="stat-value">🔥 {streak} days</div>
                  <div className="stat-title">STREAK</div>
                </div>
                <div className="stat-col">
                  <div className="stat-value">{bestStreak} days</div>
                  <div className="stat-title">BEST</div>
                </div>
              </div>

              <div className="weekly-bar-container">
                <div className="weekly-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ConsistencyIcon size={16} /> this week (Mon–Sun)
                </div>
                <div className="gh-sparkline big">
                  {weeklyBlocks.map((count, i) => (
                    <div
                      key={i}
                      className="gh-spark-bar focus-spark-bar"
                      style={{ height: `${Math.max(4, Math.round((count / maxWeekly) * 30))}px` }}
                      title={`${count} block${count !== 1 ? 's' : ''}`}
                    />
                  ))}
                </div>
              </div>

              <div className="identity-line">
                "{identityLine}"
              </div>
            </div>

            <div className="focus-divider"></div>

            <div className="focus-section">
              <button
                className="section-toggle"
                onClick={() => setShowBlockSection(prev => !prev)}
              >
                <span>[ {showBlockSection ? '▲' : '▼'} Block distracting sites ]</span>
              </button>

              {showBlockSection && (
                <div className="focus-block-content">
                  <div className="block-preset-grid">
                    {DISTRACTING_SITES.map(site => (
                      <label key={site.id} className="block-checkbox">
                        <input
                          type="checkbox"
                          checked={blockedSites.includes(site.id)}
                          onChange={() => toggleSiteBlock(site.id)}
                        />
                        {site.name}
                      </label>
                    ))}
                  </div>

                  <div className="custom-block-section">
                    <div className="custom-block-input">
                      <input
                        type="text"
                        placeholder="Add custom domain (e.g. news.com)"
                        value={customSiteInput}
                        onChange={e => setCustomSiteInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomSite()}
                      />
                      <button onClick={addCustomSite} disabled={!customSiteInput.trim()}>
                        <Plus size={16} />
                      </button>
                    </div>
                    {customSites.length > 0 && (
                      <div className="custom-sites-list">
                        {customSites.map(site => (
                          <div key={site.id} className="custom-site-tag">
                            <span>{site.domain}</span>
                            <button onClick={() => removeCustomSite(site.id)}>
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="focus-divider"></div>

            <div className="session-log-section">
              <h3>today's sessions</h3>
              {todaySessions.length === 0 ? (
                <div className="empty-log">No sessions yet today.</div>
              ) : (
                <div className="session-list">
                  {todaySessions.map((session, idx) => {
                    const startD = new Date(session.startedAt)
                    const timeStr = `${String(startD.getHours()).padStart(2, '0')}:${String(startD.getMinutes()).padStart(2, '0')}`
                    const min = Math.round(session.durationSec / 60)
                    return (
                      <div key={idx} className="session-item">
                        <span className="session-time">{timeStr}</span>
                        <span className="session-task">{session.task}</span>
                        <span className="session-dur">{min}m ✓</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSummary && summaryData && (
        <div className="focus-overlay" onClick={() => setShowSummary(false)}>
          <div className="focus-summary-modal" onClick={e => e.stopPropagation()}>
            <Shield size={48} className="summary-icon" />
            <h2>Session Complete</h2>
            <div className="summary-details">
              <p className="summary-task">"{summaryData.task}"</p>
              <p className="summary-time">{Math.round(summaryData.durationSec / 60)} minutes focused.</p>
              <p className="summary-time">
                {summaryData.tabsUsed} tab{summaryData.tabsUsed === 1 ? '' : 's'} opened during this block.
              </p>
              <p className="summary-time">
                {summaryData.distractions.length} distraction{summaryData.distractions.length === 1 ? '' : 's'} attempted.
              </p>
            </div>
            <p className="identity-text">{identityLine}</p>
            <button className="focus-btn primary" onClick={() => setShowSummary(false)}>
              [ Close ]
            </button>
          </div>
        </div>
      )}
    </>
  )
}
