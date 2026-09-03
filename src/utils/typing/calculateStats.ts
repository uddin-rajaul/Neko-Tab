import type { TypingStats } from '../../types/typing'

export function calculateStats(
  correctChars: number,
  incorrectChars: number,
  timeElapsed: number,
  wordsCompleted: number,
  totalWords: number,
): TypingStats {
  const totalChars = correctChars + incorrectChars
  const minutes = timeElapsed / 60
  const wpm = minutes > 0 ? Math.round((correctChars / 5) / minutes) : 0
  const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 1000) / 10 : 0
  const rawCpm = minutes > 0 ? Math.round(totalChars / minutes) : 0

  return {
    wpm,
    accuracy,
    rawCpm,
    correctChars,
    incorrectChars,
    totalChars,
    timeElapsed,
    wordsCompleted,
    totalWords,
  }
}
