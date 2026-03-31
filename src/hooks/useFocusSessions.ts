import { useState, useCallback } from 'react'

export interface FocusSession {
  task: string
  startedAt: number
  completedAt: number
  durationSec: number
  completed: boolean
  tabsUsed?: number
  distractions?: {
    domain: string
    attemptedAt: number
  }[]
}

function todayKey(): string {
  return new Date().toLocaleDateString()
}

function isoDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10)
}

function loadSessions(): FocusSession[] {
  try {
    const raw = localStorage.getItem('focus-sessions')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSessions(sessions: FocusSession[]) {
  localStorage.setItem('focus-sessions', JSON.stringify(sessions))
}

export function useFocusSessions() {
  const [sessions, setSessions] = useState<FocusSession[]>(loadSessions)

  const addSession = useCallback((session: FocusSession) => {
    setSessions(prev => {
      const next = [...prev, session]
      saveSessions(next)
      return next
    })
  }, [])

  // Sessions completed today
  const todaySessions = sessions.filter(s => {
    return s.completed && new Date(s.completedAt).toLocaleDateString() === todayKey()
  })

  const todayBlocks = todaySessions.length
  const todaySeconds = todaySessions.reduce((acc, s) => acc + s.durationSec, 0)

  // Current streak: consecutive days with at least one completed session
  function computeStreak(): number {
    const completedDays = new Set(
      sessions.filter(s => s.completed).map(s => isoDate(s.completedAt))
    )
    if (completedDays.size === 0) return 0

    let streak = 0
    const cursor = new Date()
    // Allow today or yesterday as starting point (don't break streak if not done yet today)
    const todayISO = cursor.toISOString().slice(0, 10)
    const yesterdayISO = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    let check = completedDays.has(todayISO) ? todayISO : yesterdayISO
    if (!completedDays.has(check)) return 0

    const d = new Date(check)
    while (completedDays.has(d.toISOString().slice(0, 10))) {
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  }

  // Best streak ever
  function computeBestStreak(): number {
    const completedDays = [...new Set(
      sessions.filter(s => s.completed).map(s => isoDate(s.completedAt))
    )].sort()

    if (completedDays.length === 0) return 0

    let best = 1
    let current = 1
    for (let i = 1; i < completedDays.length; i++) {
      const prev = new Date(completedDays[i - 1])
      const curr = new Date(completedDays[i])
      const diff = (curr.getTime() - prev.getTime()) / 86400000
      if (diff === 1) {
        current++
        best = Math.max(best, current)
      } else {
        current = 1
      }
    }
    return best
  }

  // Last 7 days block counts for sparkline (oldest → newest)
  function weeklyBlocks(): number[] {
    const counts: number[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      counts.push(sessions.filter(s => s.completed && isoDate(s.completedAt) === d).length)
    }
    return counts
  }

  const IDENTITY_LINES = [
    'You are someone who protects deep work.',
    'Consistency is your edge.',
    'Every block compounds.',
    'You ship. That is who you are.',
    'Small sessions. Real progress.',
    'The streak is proof, not motivation.',
  ]

  function identityLine(): string {
    const streak = computeStreak()
    return IDENTITY_LINES[streak % IDENTITY_LINES.length]
  }

  function formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    const m = Math.floor(seconds / 60)
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    const rem = m % 60
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`
  }

  return {
    sessions,
    addSession,
    todayBlocks,
    todaySeconds,
    todayFormatted: formatTime(todaySeconds),
    streak: computeStreak(),
    bestStreak: computeBestStreak(),
    weeklyBlocks: weeklyBlocks(),
    identityLine: identityLine(),
  }
}
