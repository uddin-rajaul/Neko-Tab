import { useEffect, useRef } from 'react'
import type { TypingWord } from '../../types/typing'

interface WordDisplayProps {
  words: TypingWord[]
  currentIndex: number
}

export function WordDisplay({ words, currentIndex }: WordDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [currentIndex])

  return (
    <div className="tt-word-display" ref={containerRef}>
      <span className="tt-prompt">&gt;</span>
      {words.map((word, i) => {
        const isCurrent = i === currentIndex
        const className = `tt-word ${word.state === 'correct' ? 'tt-correct' : ''} ${word.state === 'incorrect' ? 'tt-incorrect' : ''} ${isCurrent ? 'tt-current' : ''}`

        return (
          <span
            key={`${i}-${word.word}`}
            ref={isCurrent ? currentRef : undefined}
            className={className}
          >
            {isCurrent ? (
              <>
                <span className="tt-typed">{word.typed}</span>
                <span className="tt-cursor" />
                <span className="tt-remaining">{word.word.slice(word.typed.length)}</span>
              </>
            ) : (
              word.word
            )}
          </span>
        )
      })}
    </div>
  )
}
