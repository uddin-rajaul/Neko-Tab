import { useState, useEffect, useRef } from 'react'
import { Activity } from 'lucide-react'
import { GitHubStreak } from './GitHubStreak'
import { FocusStreak } from './FocusStreak'
import { useSettings } from '../hooks/useLocalStorage'

interface HeapInfo {
  usedMB: number
  totalMB: number
  pct: number // 0–100
}

function readHeap(): HeapInfo | null {
  if (!('memory' in performance)) return null
  const m = (performance as any).memory
  const usedMB = Math.round(m.usedJSHeapSize / (1024 * 1024))
  const totalMB = Math.round(m.jsHeapSizeLimit / (1024 * 1024))
  const pct = Math.round((m.usedJSHeapSize / m.jsHeapSizeLimit) * 100)
  return { usedMB, totalMB, pct }
}

function heapColor(pct: number): string {
  if (pct < 50) return 'var(--accent)'  // match theme accent
  if (pct < 75) return '#facc15'  // yellow
  return '#f87171'                 // red
}

// Ping a tiny resource and return round-trip ms, or null on timeout/failure
async function measureLatency(): Promise<number | null> {
  const PING_URL = 'https://1.1.1.1/cdn-cgi/trace'
  const TIMEOUT_MS = 4000
  const start = performance.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    await fetch(PING_URL, {
      method: 'HEAD',
      mode: 'no-cors', // avoids CORS block; we just care about the round-trip
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timer)
    return Math.round(performance.now() - start)
  } catch {
    return null
  }
}

function latencyColor(ms: number | null): string {
  if (ms === null) return 'var(--text-secondary)'
  if (ms < 80)  return 'var(--accent)' // match theme accent
  if (ms < 200) return '#facc15' // yellow
  return '#f87171'               // red
}

export function ActivityWidget() {
  const [settings] = useSettings()
  const [heap, setHeap] = useState<HeapInfo | null>(null)
  const [latency, setLatency] = useState<number | null | 'pending'>('pending')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const updateHeap = () => setHeap(readHeap())

    const runPing = async () => {
      const ms = await measureLatency()
      setLatency(ms)
    }

    updateHeap()
    runPing()

    const heapInterval = setInterval(updateHeap, 3000)
    intervalRef.current = setInterval(runPing, 10000)

    return () => {
      clearInterval(heapInterval)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const latencyDisplay = latency === 'pending'
    ? '...'
    : latency === null
      ? 'TIMEOUT'
      : `${latency}ms`

  const pingColor = latency === 'pending' || latency === null
    ? latencyColor(null)
    : latencyColor(latency)

  return (
    <div className="activity-widget-container">
      <div className="activity-summary">
        {heap ? (
          <div className="stat-item heap-stat-item" title={`JS heap: ${heap.usedMB}MB used of ${heap.totalMB}MB limit`}>
            <span className="stat-label">HEAP</span>
            <div className="heap-bar-track">
              <div
                className="heap-bar-fill"
                style={{ width: `${heap.pct}%`, background: heapColor(heap.pct) }}
              />
            </div>
            <span className="stat-value" style={{ color: heapColor(heap.pct) }}>
              {heap.usedMB}MB
            </span>
          </div>
        ) : null}
        <div className="stat-item">
          <Activity size={14} className="stat-icon" style={{ color: pingColor }} />
          <span className="stat-label">PING</span>
          <span className="stat-value" style={{ color: pingColor }}>{latencyDisplay}</span>
        </div>
        {settings.showGitHubStreak && settings.githubUsername && (
          <GitHubStreak username={settings.githubUsername} />
        )}
        <FocusStreak />
      </div>
    </div>
  )
}
