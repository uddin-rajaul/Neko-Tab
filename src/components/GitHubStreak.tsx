import { useState, useEffect } from 'react'

interface Props {
  username: string
}

interface ContribDay {
  date: string
  count: number
}

function computeStreak(days: ContribDay[]): number {
  // days are oldest-to-newest; walk backwards from today
  const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date))
  const today = new Date().toISOString().slice(0, 10)
  let streak = 0
  let expected = today

  for (const day of sorted) {
    if (day.date > expected) continue
    if (day.date < expected) break
    if (day.count > 0) {
      streak++
      const d = new Date(expected)
      d.setDate(d.getDate() - 1)
      expected = d.toISOString().slice(0, 10)
    } else {
      break
    }
  }
  return streak
}

export function GitHubStreak({ username }: Props) {
  const [streak, setStreak] = useState<number | null>(null)
  const [last14, setLast14] = useState<number[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!username) return
    setError(false)
    setStreak(null)

    const cacheKey = `neko-gh-streak-${username}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const { data, ts } = JSON.parse(cached)
        // cache for 30 minutes
        if (Date.now() - ts < 30 * 60 * 1000) {
          setStreak(data.streak)
          setLast14(data.last14)
          return
        }
      } catch { /* ignore */ }
    }

    fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`)
      .then(r => r.json())
      .then(json => {
        const days: ContribDay[] = json.contributions ?? []
        const s = computeStreak(days)
        const recent = days.slice(-14).map((d: ContribDay) => d.count)
        setStreak(s)
        setLast14(recent)
        localStorage.setItem(cacheKey, JSON.stringify({ data: { streak: s, last14: recent }, ts: Date.now() }))
      })
      .catch(() => setError(true))
  }, [username])

  if (!username) return null
  if (error) return (
    <div className="stat-item">
      <span className="stat-label">GH</span>
      <span className="stat-value" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>n/a</span>
    </div>
  )
  if (streak === null) return (
    <div className="stat-item">
      <span className="stat-label">GH STREAK</span>
      <span className="stat-value">...</span>
    </div>
  )

  const maxCount = Math.max(...last14, 1)

  return (
    <div className="stat-item gh-streak-item">
      <span className="stat-label">GH STREAK</span>
      <div className="gh-sparkline">
        {last14.map((count, i) => (
          <div
            key={i}
            className="gh-spark-bar"
            style={{ height: `${Math.max(2, Math.round((count / maxCount) * 14))}px` }}
            title={`${count} contributions`}
          />
        ))}
      </div>
      <span className="stat-value">
        {streak > 0 ? `● ${streak}d` : '◌ 0d'}
      </span>
    </div>
  )
}
