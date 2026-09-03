import { useState, useEffect, useCallback, useRef } from 'react'
import type { TypingWord, TypingScore, TypingBest, TypingStreak, TypingDailyGoal, TestMode, TimeLimit } from '../../types/typing'
import { TIME_LIMITS, WORD_COUNTS } from '../../types/typing'
import { generateWords } from '../../utils/typing/generateWords'
import { handleInput } from '../../utils/typing/inputHandler'
import { calculateStats } from '../../utils/typing/calculateStats'
import { getBest, saveBest, getHistory, addHistory, getStreak, updateStreak, getDailyGoal, incrementDailyGoal } from '../../utils/typing/history'
import { HiddenInput } from './HiddenInput'
import type { HiddenInputHandle } from './HiddenInput'
import { WordDisplay } from './WordDisplay'
import { StatsView } from './StatsView'
import { ResultsCard } from './ResultsCard'

interface TypingOverlayProps {
  isOpen: boolean
  onClose: () => void
  wordCount?: number
  timeLimit?: number
}

export function TypingOverlay({ isOpen, onClose, wordCount = 50, timeLimit = 60 }: TypingOverlayProps) {
  const [phase, setPhase] = useState<'idle' | 'typing' | 'finished'>('idle')
  const [mode, setMode] = useState<TestMode>('words')
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<TimeLimit>(timeLimit as TimeLimit)
  const [selectedWordCount, setSelectedWordCount] = useState(wordCount)
  const [words, setWords] = useState<TypingWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctChars, setCorrectChars] = useState(0)
  const [incorrectChars, setIncorrectChars] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [score, setScore] = useState<TypingScore | null>(null)
  const [best, setBest] = useState<TypingBest>({ wpm: 0, accuracy: 0 })
  const [streak, setStreak] = useState<TypingStreak>({ count: 0, lastDate: '' })
  const [dailyGoal, setDailyGoal] = useState<TypingDailyGoal>({ target: 5, date: '', completed: 0 })
  const [recentScores, setRecentScores] = useState<TypingScore[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerStarted = useRef(false)
  const inputRef = useRef<HiddenInputHandle>(null)

  const initTest = useCallback(() => {
    const count = mode === 'time' ? 50 : selectedWordCount
    const wordList = generateWords(count)
    const initialWords: TypingWord[] = wordList.map((word, i) => ({
      word,
      state: i === 0 ? 'current' : 'pending',
      typed: '',
    }))
    setWords(initialWords)
    setCurrentIndex(0)
    setCorrectChars(0)
    setIncorrectChars(0)
    setTimeElapsed(0)
    setTimeRemaining(mode === 'time' ? selectedTimeLimit : 0)
    setScore(null)
    setPhase('typing')
    timerStarted.current = false
  }, [mode, selectedWordCount, selectedTimeLimit])

  // Sync props from settings when overlay opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTimeLimit(timeLimit as TimeLimit)
      setSelectedWordCount(wordCount)
      setBest(getBest())
      setStreak(getStreak())
      setDailyGoal(getDailyGoal())
      setRecentScores(getHistory())
    }
  }, [isOpen, timeLimit, wordCount])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Word mode: end when all words done
  useEffect(() => {
    if (phase !== 'typing' || mode !== 'words') return
    const allDone = words.length > 0 && words.every(w => w.state === 'correct' || w.state === 'incorrect')
    if (allDone && currentIndex >= words.length) {
      finishTest()
    }
  }, [words, currentIndex, phase, mode])

  // Time mode: end when timer hits 0
  useEffect(() => {
    if (phase !== 'typing' || mode !== 'time') return
    if (timeRemaining <= 0 && timerStarted.current) {
      finishTest()
    }
  }, [timeRemaining, phase, mode])

  // Time mode: continuous word generation
  useEffect(() => {
    if (phase !== 'typing' || mode !== 'time') return
    if (words.length === 0) return
    const remaining = words.length - currentIndex
    if (remaining <= 10) {
      const newWords = generateWords(20)
      const appended = newWords.map((word) => ({
        word,
        state: 'pending' as const,
        typed: '',
      }))
      setWords(prev => [...prev, ...appended])
    }
  }, [currentIndex, words.length, phase, mode])

  const finishTest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)

    const actualTime = mode === 'time' ? selectedTimeLimit : timeElapsed
    const wordsCompleted = mode === 'time'
      ? words.slice(0, currentIndex).filter(w => w.state === 'correct' || w.state === 'incorrect').length
      : words.length

    const finalStats = calculateStats(correctChars, incorrectChars, actualTime, wordsCompleted, wordsCompleted)
    const newScore: TypingScore = {
      ...finalStats,
      wordCount: wordsCompleted,
      date: new Date().toISOString(),
    }

    setScore(newScore)
    setPhase('finished')
    saveBest(newScore)
    setBest(getBest())
    addHistory(newScore)
    setRecentScores(getHistory())
    updateStreak()
    setStreak(getStreak())
    incrementDailyGoal()
    setDailyGoal(getDailyGoal())
  }, [correctChars, incorrectChars, timeElapsed, words, currentIndex, mode, selectedTimeLimit])

  const handleTypingInput = useCallback((value: string) => {
    if (phase === 'finished') {
      if (value === 'Tab') {
        initTest()
      }
      return
    }

    // Start test on first keystroke (if in idle) — don't process the key
    if (phase === 'idle') {
      const count = mode === 'time' ? 50 : selectedWordCount
      const wordList = generateWords(count)
      const initialWords: TypingWord[] = wordList.map((word, i) => ({
        word,
        state: i === 0 ? 'current' : 'pending',
        typed: '',
      }))
      setWords(initialWords)
      setCurrentIndex(0)
      setCorrectChars(0)
      setIncorrectChars(0)
      setTimeElapsed(0)
      setTimeRemaining(mode === 'time' ? selectedTimeLimit : 0)
      setScore(null)
      setPhase('typing')
      timerStarted.current = true

      // Start timer
      timerRef.current = setInterval(() => {
        if (mode === 'time') {
          setTimeRemaining(t => {
            if (t <= 1) {
              if (timerRef.current) clearInterval(timerRef.current)
              return 0
            }
            return t - 1
          })
          setTimeElapsed(t => t + 1)
        } else {
          setTimeElapsed(t => t + 1)
        }
      }, 1000)
      return
    }

    if (value === 'Tab') {
      initTest()
      return
    }

    if (!timerStarted.current) {
      timerStarted.current = true
      if (mode === 'time') {
        setTimeRemaining(selectedTimeLimit)
      }
      timerRef.current = setInterval(() => {
        if (mode === 'time') {
          setTimeRemaining(t => {
            if (t <= 1) {
              if (timerRef.current) clearInterval(timerRef.current)
              return 0
            }
            return t - 1
          })
          setTimeElapsed(t => t + 1)
        } else {
          setTimeElapsed(t => t + 1)
        }
      }, 1000)
    }

    const result = handleInput(words, currentIndex, value, correctChars, incorrectChars)
    setWords(result.words)
    setCurrentIndex(result.currentIndex)
    setCorrectChars(result.correctChars)
    setIncorrectChars(result.incorrectChars)
  }, [phase, words, currentIndex, correctChars, incorrectChars, initTest, mode, selectedTimeLimit, selectedWordCount])

  // Reset overlay when closed
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current)
      setPhase('idle')
      setWords([])
      setCurrentIndex(0)
      setScore(null)
      timerStarted.current = false
    }
  }, [isOpen])

  // Escape to close, Tab to restart
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const wordsCompleted = mode === 'time'
    ? words.slice(0, currentIndex).filter(w => w.state === 'correct' || w.state === 'incorrect').length
    : currentIndex
  const totalWords = mode === 'time' ? wordsCompleted : selectedWordCount
  const stats = calculateStats(correctChars, incorrectChars, timeElapsed, wordsCompleted, totalWords)

  const handleModeChange = (newMode: TestMode) => {
    if (phase === 'idle') {
      setMode(newMode)
      inputRef.current?.focus()
    }
  }

  const handleWordCountChange = (count: number) => {
    if (phase === 'idle') {
      setSelectedWordCount(count)
      inputRef.current?.focus()
    }
  }

  const handleTimeLimitChange = (limit: TimeLimit) => {
    if (phase === 'idle') {
      setSelectedTimeLimit(limit)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="tt-overlay" onClick={onClose}>
      <div className="tt-container" onClick={e => e.stopPropagation()}>
        <HiddenInput ref={inputRef} onInput={handleTypingInput} disabled={phase === 'finished'} />

        {/* Mode & Config Selector */}
        <div className="tt-config">
          <div className="tt-mode-selector">
            <button
              className={`tt-mode-btn ${mode === 'words' ? 'active' : ''}`}
              onClick={() => handleModeChange('words')}
            >
              words
            </button>
            <button
              className={`tt-mode-btn ${mode === 'time' ? 'active' : ''}`}
              onClick={() => handleModeChange('time')}
            >
              time
            </button>
          </div>
          {mode === 'words' && (
            <div className="tt-option-selector">
              {WORD_COUNTS.map(count => (
                <button
                  key={count}
                  className={`tt-option-btn ${selectedWordCount === count ? 'active' : ''}`}
                  onClick={() => handleWordCountChange(count)}
                >
                  {count}
                </button>
              ))}
            </div>
          )}
          {mode === 'time' && (
            <div className="tt-option-selector">
              {TIME_LIMITS.map(limit => (
                <button
                  key={limit}
                  className={`tt-option-btn ${selectedTimeLimit === limit ? 'active' : ''}`}
                  onClick={() => handleTimeLimitChange(limit)}
                >
                  {limit}
                </button>
              ))}
            </div>
          )}
        </div>

        {phase === 'idle' && (
          <div className="tt-idle">
            <div className="tt-idle-prompt">&gt; ready to type?</div>
            <div className="tt-idle-hint">start typing to begin</div>
            {(best.wpm > 0 || streak.count > 0 || dailyGoal.completed > 0) && (
              <div className="tt-idle-stats">
                {best.wpm > 0 && (
                  <div className="tt-idle-stat">
                    <span className="tt-idle-stat-label">Best WPM</span>
                    <span className="tt-idle-stat-value">{best.wpm}</span>
                  </div>
                )}
                {best.accuracy > 0 && (
                  <div className="tt-idle-stat">
                    <span className="tt-idle-stat-label">Best Accuracy</span>
                    <span className="tt-idle-stat-value">{best.accuracy}%</span>
                  </div>
                )}
                {streak.count > 0 && (
                  <div className="tt-idle-stat">
                    <span className="tt-idle-stat-label">Streak</span>
                    <span className="tt-idle-stat-value">{streak.count} day{streak.count !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {dailyGoal.completed > 0 && (
                  <div className="tt-idle-stat">
                    <span className="tt-idle-stat-label">Today</span>
                    <span className="tt-idle-stat-value">{dailyGoal.completed}/{dailyGoal.target}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {phase === 'typing' && (
          <>
            <WordDisplay words={words} currentIndex={currentIndex} />
            <StatsView
              stats={stats}
              isTyping={true}
              mode={mode}
              timeRemaining={timeRemaining}
              timeLimit={selectedTimeLimit}
            />
          </>
        )}

        {phase === 'finished' && score && (
          <ResultsCard
            score={score}
            best={best}
            streak={streak}
            dailyGoal={dailyGoal}
            recentScores={recentScores}
            onRestart={initTest}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}
