import type { TypingWord } from '../../types/typing'

export interface InputResult {
  words: TypingWord[]
  currentIndex: number
  correctChars: number
  incorrectChars: number
}

export function handleInput(
  words: TypingWord[],
  currentIndex: number,
  input: string,
  correctChars: number,
  incorrectChars: number,
): InputResult {
  const updated = words.map(w => ({ ...w }))
  const currentWord = updated[currentIndex]

  if (input === ' ') {
    if (currentWord.typed.length === 0) return { words: updated, currentIndex, correctChars, incorrectChars }

    const isCorrect = currentWord.typed === currentWord.word
    currentWord.state = isCorrect ? 'correct' : 'incorrect'

    if (!isCorrect) {
      incorrectChars += currentWord.typed.length
    } else {
      correctChars += currentWord.word.length
    }

    currentWord.typed = ''
    const nextIndex = currentIndex + 1
    if (nextIndex < updated.length) {
      updated[nextIndex].state = 'current'
    }

    return { words: updated, currentIndex: nextIndex, correctChars, incorrectChars }
  }

  if (input === 'Backspace') {
    if (currentWord.typed.length > 0) {
      currentWord.typed = currentWord.typed.slice(0, -1)
    }
    return { words: updated, currentIndex, correctChars, incorrectChars }
  }

  if (input.length === 1) {
    currentWord.typed += input
    return { words: updated, currentIndex, correctChars, incorrectChars }
  }

  return { words: updated, currentIndex, correctChars, incorrectChars }
}
