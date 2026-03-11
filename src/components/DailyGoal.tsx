import { useState, useRef, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

interface DailyGoalData {
  text: string
  date: string // YYYY-MM-DD
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function DailyGoal() {
  const [stored, setStored] = useLocalStorage<DailyGoalData | null>('neko-daily-goal', null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // reset if stale date
  const goal = stored?.date === todayKey() ? stored.text : null

  useEffect(() => {
    if (editing) {
      setDraft(goal ?? '')
      inputRef.current?.focus()
    }
  }, [editing])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed) {
      setStored({ text: trimmed, date: todayKey() })
    } else {
      setStored(null)
    }
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <div className="daily-goal-container">
        <span className="daily-goal-prompt">▸</span>
        <input
          ref={inputRef}
          className="daily-goal-input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder="today's goal..."
          maxLength={120}
          spellCheck={false}
        />
      </div>
    )
  }

  return (
    <div className="daily-goal-container" onClick={() => setEditing(true)} title="Click to set today's goal">
      {goal ? (
        <>
          <span className="daily-goal-prompt">▸</span>
          <span className="daily-goal-text">{goal}</span>
        </>
      ) : (
        <span className="daily-goal-placeholder">{'> set today\'s goal...'}</span>
      )}
    </div>
  )
}
