import { getWordPool, shuffleArray } from './wordList'

export function generateWords(count: number): string[] {
  const pool = getWordPool()
  const shuffled = shuffleArray(pool)
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length])
  }
  return result
}
