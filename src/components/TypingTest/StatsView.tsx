import type { TypingStats, TestMode, TimeLimit } from '../../types/typing'

interface StatsViewProps {
  stats: TypingStats
  isTyping: boolean
  mode?: TestMode
  timeRemaining?: number
  timeLimit?: TimeLimit
}

export function StatsView({ stats, isTyping, mode = 'words', timeRemaining = 0, timeLimit = 60 }: StatsViewProps) {
  const accuracyClass = stats.accuracy >= 95 ? 'tt-acc-good' : stats.accuracy >= 85 ? 'tt-acc-ok' : 'tt-acc-bad'
  const progress = stats.totalWords > 0 ? (stats.wordsCompleted / stats.totalWords) * 100 : 0

  const timeDisplay = mode === 'time'
    ? formatTime(timeRemaining)
    : formatTime(stats.timeElapsed)

  const timeLabel = mode === 'time' ? 'LEFT' : 'TIME'

  return (
    <div className="tt-stats">
      <div className="tt-stats-row">
        <span className="tt-stat">
          <span className="tt-stat-label">WPM</span>
          <span className="tt-stat-value">{stats.wpm}</span>
        </span>
        <span className="tt-stat">
          <span className="tt-stat-label">ACC</span>
          <span className={`tt-stat-value ${accuracyClass}`}>{stats.accuracy}%</span>
        </span>
        <span className="tt-stat">
          <span className="tt-stat-label">WORDS</span>
          <span className="tt-stat-value">{stats.wordsCompleted}{mode === 'words' ? `/${stats.totalWords}` : ''}</span>
        </span>
        <span className="tt-stat">
          <span className="tt-stat-label">{timeLabel}</span>
          <span className={`tt-stat-value ${mode === 'time' && timeRemaining <= 5 ? 'tt-time-low' : ''}`}>
            {timeDisplay}
          </span>
        </span>
      </div>
      {isTyping && (
        <div className="tt-progress-bar">
          <div
            className={`tt-progress-fill ${mode === 'time' ? 'tt-progress-countdown' : ''}`}
            style={{ width: mode === 'time' ? `${(timeRemaining / timeLimit) * 100}%` : `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
