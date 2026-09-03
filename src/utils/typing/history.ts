import type { TypingScore, TypingBest, TypingStreak, TypingDailyGoal } from '../../types/typing'

const BEST_KEY = 'neko-typing-best'
const HISTORY_KEY = 'neko-typing-history'
const STREAK_KEY = 'neko-typing-streak'
const DAILY_KEY = 'neko-typing-daily-goal'

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getBest(): TypingBest {
  return loadJSON<TypingBest>(BEST_KEY, { wpm: 0, accuracy: 0 })
}

export function saveBest(score: TypingScore) {
  const best = getBest()
  const updated: TypingBest = {
    wpm: Math.max(best.wpm, score.wpm),
    accuracy: Math.max(best.accuracy, score.accuracy),
  }
  saveJSON(BEST_KEY, updated)
  return updated
}

export function getHistory(): TypingScore[] {
  return loadJSON<TypingScore[]>(HISTORY_KEY, [])
}

export function addHistory(score: TypingScore): TypingScore[] {
  const history = getHistory()
  const updated = [score, ...history].slice(0, 10)
  saveJSON(HISTORY_KEY, updated)
  return updated
}

export function getStreak(): TypingStreak {
  return loadJSON<TypingStreak>(STREAK_KEY, { count: 0, lastDate: '' })
}

export function updateStreak(): TypingStreak {
  const streak = getStreak()
  const today = todayKey()

  if (streak.lastDate === today) return streak

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

  const updated: TypingStreak = {
    count: streak.lastDate === yesterdayKey ? streak.count + 1 : 1,
    lastDate: today,
  }
  saveJSON(STREAK_KEY, updated)
  return updated
}

export function getDailyGoal(): TypingDailyGoal {
  const goal = loadJSON<TypingDailyGoal>(DAILY_KEY, { target: 5, date: todayKey(), completed: 0 })
  if (goal.date !== todayKey()) {
    return { target: goal.target, date: todayKey(), completed: 0 }
  }
  return goal
}

export function incrementDailyGoal(): TypingDailyGoal {
  const goal = getDailyGoal()
  const updated: TypingDailyGoal = {
    ...goal,
    completed: goal.completed + 1,
    date: todayKey(),
  }
  saveJSON(DAILY_KEY, updated)
  return updated
}

export function setDailyGoalTarget(target: number): TypingDailyGoal {
  const goal = getDailyGoal()
  const updated: TypingDailyGoal = { ...goal, target, date: todayKey() }
  saveJSON(DAILY_KEY, updated)
  return updated
}

export function resetScores() {
  localStorage.removeItem(BEST_KEY)
  localStorage.removeItem(HISTORY_KEY)
  localStorage.removeItem(STREAK_KEY)
  localStorage.removeItem(DAILY_KEY)
}
