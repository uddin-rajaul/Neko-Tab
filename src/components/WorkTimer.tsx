import { useState, useEffect, useRef } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

export function WorkTimer() {
  const [startedAt, setStartedAt] = useLocalStorage<number | null>('neko-timer-start', null)
  const [elapsed, setElapsed] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const tick = () => {
      if (startedAt !== null) {
        setElapsed(Date.now() - startedAt)
        raf.current = requestAnimationFrame(tick)
      }
    }
    if (startedAt !== null) {
      raf.current = requestAnimationFrame(tick)
    } else {
      setElapsed(0)
    }
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [startedAt])

  // Ctrl+Shift+T to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        setStartedAt(s => s === null ? Date.now() : null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const toggle = () => setStartedAt(s => s === null ? Date.now() : null)
  const reset  = (e: React.MouseEvent) => { e.stopPropagation(); setStartedAt(null) }

  return (
    <div
      className={`stat-item work-timer-item ${startedAt !== null ? 'running' : ''}`}
      onClick={toggle}
      title={startedAt ? 'Click to stop (Ctrl+Shift+T)' : 'Click to start timer (Ctrl+Shift+T)'}
    >
      <span className="work-timer-dot">{startedAt !== null ? '●' : '◌'}</span>
      <span className="stat-label">TIMER</span>
      <span className="stat-value work-timer-value">{fmt(elapsed)}</span>
      {startedAt !== null && elapsed > 0 && (
        <button className="work-timer-reset" onClick={reset} title="Reset">✕</button>
      )}
    </div>
  )
}
