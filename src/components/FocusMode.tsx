import { useState, useEffect, useCallback } from 'react'
import { Scan, Play, Pause, RotateCcw, X } from 'lucide-react'
import { useActivity } from '../hooks/useActivity'

export function FocusMode() {
  const [isActive, setIsActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const { completeFocusSession } = useActivity()

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

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isActive && isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsRunning(false)
      completeFocusSession()

      // Play sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
      audio.play().catch(e => console.log('Audio play failed', e))

      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus Session Complete!', {
          body: 'Great job! Take a small break.',
          icon: '/favicon.svg' // Assuming favicon exists
        })
      }
    }
    return () => clearInterval(interval)
  }, [isActive, isRunning, timeLeft, completeFocusSession])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(25 * 60)
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
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? <Pause size={20} /> : <Play size={20} />}
                <span>{isRunning ? 'Pause' : 'Start'}</span>
              </button>

              <button
                className="focus-control-btn secondary"
                onClick={resetTimer}
              >
                <RotateCcw size={20} />
                <span>Reset</span>
              </button>
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
