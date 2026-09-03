export interface TypingWord {
  word: string
  state: 'pending' | 'correct' | 'incorrect' | 'current'
  typed: string
}

export interface TypingTestSettings {
  wordCount: number
  dailyGoal: number
  showLiveStats: boolean
}

export interface TypingScore {
  wpm: number
  accuracy: number
  rawCpm: number
  correctChars: number
  incorrectChars: number
  totalChars: number
  timeElapsed: number
  wordCount: number
  date: string
}

export interface TypingBest {
  wpm: number
  accuracy: number
}

export interface TypingStreak {
  count: number
  lastDate: string
}

export interface TypingDailyGoal {
  target: number
  date: string
  completed: number
}

export interface TypingStats {
  wpm: number
  accuracy: number
  rawCpm: number
  correctChars: number
  incorrectChars: number
  totalChars: number
  timeElapsed: number
  wordsCompleted: number
  totalWords: number
}

export type TypingTestPhase = 'idle' | 'typing' | 'finished'

export type TestMode = 'words' | 'time'

export const TIME_LIMITS = [15, 30, 60, 120] as const
export type TimeLimit = typeof TIME_LIMITS[number]

export const WORD_COUNTS = [25, 50, 100] as const
export type WordCount = typeof WORD_COUNTS[number]
