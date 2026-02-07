import { useState, useEffect, useCallback, useRef } from 'react'
import { Scan, Play, Pause, RotateCcw, X, Shield, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { useActivity } from '../hooks/useActivity'
import { useLocalStorage } from '../hooks/useLocalStorage'

const POMODORO_DURATION = 25 * 60 // 25 minutes in seconds

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
  startedAt: number | null // timestamp when timer started
  pausedTimeLeft: number | null // remaining time when paused
}

interface CustomSite {
  id: string
  domain: string
}

export function FocusMode() {
  const [isActive, setIsActive] = useState(false)
  const [pomodoroState, setPomodoroState] = useLocalStorage<PomodoroState>('pomodoro-state', {
    isRunning: false,
    startedAt: null,
    pausedTimeLeft: null
  })
  const [blockedSites, setBlockedSites] = useLocalStorage<string[]>('blocked-sites', [])
  const [customSites, setCustomSites] = useLocalStorage<CustomSite[]>('custom-blocked-sites', [])
  const [customSiteInput, setCustomSiteInput] = useState('')
  const [showBlockSection, setShowBlockSection] = useState(false)
  const [timeLeft, setTimeLeft] = useState(POMODORO_DURATION)
  const { completeFocusSession } = useActivity()
  const hasCompletedRef = useRef(false)

  // Calculate time left from stored state on mount
  useEffect(() => {
    if (pomodoroState.isRunning && pomodoroState.startedAt) {
      const elapsed = Math.floor((Date.now() - pomodoroState.startedAt) / 1000)
      const remaining = POMODORO_DURATION - elapsed
      if (remaining > 0) {
        setTimeLeft(remaining)
      } else {
        // Timer finished while tab was closed
        setTimeLeft(0)
      }
    } else if (pomodoroState.pausedTimeLeft !== null) {
      setTimeLeft(pomodoroState.pausedTimeLeft)
    }
  }, []) // Only run on mount

  // Sync blocking state to chrome.storage for background script
  const syncBlockingState = useCallback((running: boolean, sites: string[], custom: CustomSite[]) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const presetDomains = running 
        ? DISTRACTING_SITES.filter(s => sites.includes(s.id)).map(s => s.domain)
        : []
      const customDomains = running ? custom.map(s => s.domain) : []
      chrome.storage.local.set({ 
        focusBlocking: { 
          isActive: running, 
          blockedDomains: [...presetDomains, ...customDomains]
        } 
      })
    }
  }, [])

  const toggleFocus = useCallback(() => {
    setIsActive(prev => !prev)
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isActive) {
      setIsActive(false)
    }
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
    if (isActive && 'Notification' in window) {
      Notification.requestPermission()
    }
  }, [isActive])

  // Timer countdown effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isActive && pomodoroState.isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && pomodoroState.isRunning && !hasCompletedRef.current) {
      hasCompletedRef.current = true
      // Stop timer
      setPomodoroState({
        isRunning: false,
        startedAt: null,
        pausedTimeLeft: null
      })
      // Disable blocking
      syncBlockingState(false, blockedSites, customSites)
      
      completeFocusSession()

      // Play sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
      audio.play().catch(e => console.log('Audio play failed', e))

      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus Session Complete!', {
          body: 'Great job! Take a small break.',
          icon: '/favicon.svg'
        })
      }
    }
    return () => clearInterval(interval)
  }, [isActive, pomodoroState.isRunning, timeLeft, completeFocusSession, syncBlockingState, blockedSites, customSites, setPomodoroState])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`
  }

  const startTimer = () => {
    hasCompletedRef.current = false
    const newState: PomodoroState = {
      isRunning: true,
      startedAt: Date.now() - ((POMODORO_DURATION - timeLeft) * 1000),
      pausedTimeLeft: null
    }
    setPomodoroState(newState)
    syncBlockingState(true, blockedSites, customSites)
  }

  const pauseTimer = () => {
    setPomodoroState({
      isRunning: false,
      startedAt: null,
      pausedTimeLeft: timeLeft
    })
    syncBlockingState(false, blockedSites, customSites)
  }

  const resetTimer = () => {
    hasCompletedRef.current = false
    setPomodoroState({
      isRunning: false,
      startedAt: null,
      pausedTimeLeft: null
    })
    setTimeLeft(POMODORO_DURATION)
    syncBlockingState(false, blockedSites, customSites)
  }

  const toggleSiteBlock = (siteId: string) => {
    setBlockedSites(prev => {
      const newSites = prev.includes(siteId) 
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
      // Update blocking if timer is running
      if (pomodoroState.isRunning) {
        syncBlockingState(true, newSites, customSites)
      }
      return newSites
    })
  }

  const addCustomSite = () => {
    let domain = customSiteInput.trim().toLowerCase()
    if (!domain) return
    
    // Clean up the input - remove protocol and path
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
    
    // Check if already exists
    if (customSites.some(s => s.domain === domain)) {
      setCustomSiteInput('')
      return
    }
    
    const newSite: CustomSite = {
      id: `custom-${Date.now()}`,
      domain
    }
    
    const newCustomSites = [...customSites, newSite]
    setCustomSites(newCustomSites)
    setCustomSiteInput('')
    
    // Update blocking if timer is running
    if (pomodoroState.isRunning) {
      syncBlockingState(true, blockedSites, newCustomSites)
    }
  }

  const removeCustomSite = (siteId: string) => {
    const newCustomSites = customSites.filter(s => s.id !== siteId)
    setCustomSites(newCustomSites)
    
    // Update blocking if timer is running
    if (pomodoroState.isRunning) {
      syncBlockingState(true, blockedSites, newCustomSites)
    }
  }

  const handleCustomSiteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomSite()
    }
  }

  return (
    <>
      <button
        className="focus-toggle-btn"
        onClick={toggleFocus}
        title="Focus Mode (Ctrl + F)"
      >
        <Scan size={20} />
      </button>

      {isActive && (
        <div className="focus-overlay">
          <button className="focus-close-btn" onClick={() => setIsActive(false)}>
            <X size={24} />
          </button>

          <div className="focus-content">
            <div className="focus-header">
              <span className="focus-subtitle">Focus Mode</span>
              <h2 className="focus-title">Deep work session</h2>
            </div>

            <div className="focus-timer">
              {formatTime(timeLeft)}
            </div>

            <div className="focus-controls">
              <button
                className="focus-control-btn primary"
                onClick={() => pomodoroState.isRunning ? pauseTimer() : startTimer()}
              >
                {pomodoroState.isRunning ? <Pause size={20} /> : <Play size={20} />}
                <span>{pomodoroState.isRunning ? 'Pause' : 'Start'}</span>
              </button>

              <button
                className="focus-control-btn secondary"
                onClick={resetTimer}
              >
                <RotateCcw size={20} />
                <span>Reset</span>
              </button>
            </div>

            {/* Block Distracting Sites Section */}
            <div className="focus-block-section">
              <button 
                className="focus-block-toggle"
                onClick={() => setShowBlockSection(!showBlockSection)}
              >
                <Shield size={18} />
                <span>Block Distracting Sites</span>
                {(blockedSites.length > 0 || customSites.length > 0) && (
                  <span className="blocked-count">{blockedSites.length + customSites.length}</span>
                )}
                {showBlockSection ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              
              {showBlockSection && (
                <div className="focus-block-list">
                  <p className="focus-block-hint">
                    Selected sites will be blocked while the timer is running
                  </p>
                  <div className="focus-sites-grid">
                    {DISTRACTING_SITES.map(site => (
                      <label 
                        key={site.id} 
                        className={`focus-site-checkbox ${blockedSites.includes(site.id) ? 'checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={blockedSites.includes(site.id)}
                          onChange={() => toggleSiteBlock(site.id)}
                        />
                        <span className="site-name">{site.name}</span>
                      </label>
                    ))}
                  </div>
                  
                  {/* Custom Sites Section */}
                  <div className="custom-sites-section">
                    <label className="custom-sites-label">Add Custom Site</label>
                    <div className="custom-site-input-row">
                      <input
                        type="text"
                        value={customSiteInput}
                        onChange={(e) => setCustomSiteInput(e.target.value)}
                        onKeyDown={handleCustomSiteKeyDown}
                        placeholder="e.g. example.com"
                        className="custom-site-input"
                      />
                      <button 
                        className="custom-site-add-btn"
                        onClick={addCustomSite}
                        disabled={!customSiteInput.trim()}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    {customSites.length > 0 && (
                      <div className="custom-sites-list">
                        {customSites.map(site => (
                          <div key={site.id} className="custom-site-item">
                            <span className="custom-site-domain">{site.domain}</span>
                            <button 
                              className="custom-site-remove-btn"
                              onClick={() => removeCustomSite(site.id)}
                              title="Remove"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="focus-footer">
              <p>Press Esc or Ctrl + F to exit focus mode</p>

              <div className="focus-tips">
                <h4>Focus Tips</h4>
                <ul>
                  <li>Close unnecessary tabs and applications</li>
                  <li>Put your phone on silent mode</li>
                  <li>Take breaks every 25 minutes</li>
                  <li>Stay hydrated and maintain good posture</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
