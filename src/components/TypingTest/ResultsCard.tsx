import type { TypingScore, TypingBest, TypingStreak, TypingDailyGoal } from '../../types/typing'

interface ResultsCardProps {
  score: TypingScore
  best: TypingBest
  streak: TypingStreak
  dailyGoal: TypingDailyGoal
  recentScores: TypingScore[]
  onRestart: () => void
  onClose: () => void
}

export function ResultsCard({ score, best, streak, dailyGoal, recentScores, onRestart, onClose }: ResultsCardProps) {
  const isNewBest = score.wpm >= best.wpm && score.wpm > 0
  const accuracyClass = score.accuracy >= 95 ? 'tt-acc-good' : score.accuracy >= 85 ? 'tt-acc-ok' : 'tt-acc-bad'

  return (
    <div className="tt-results">
      <div className="tt-results-header">
        {isNewBest && <div className="tt-new-best">NEW BEST</div>}
        <div className="tt-results-wpm">{score.wpm}</div>
        <div className="tt-results-wpm-label">WPM</div>
      </div>

      <div className="tt-results-grid">
        <div className="tt-result-item">
          <span className="tt-result-label">Accuracy</span>
          <span className={`tt-result-value ${accuracyClass}`}>{score.accuracy}%</span>
        </div>
        <div className="tt-result-item">
          <span className="tt-result-label">Raw CPM</span>
          <span className="tt-result-value">{score.rawCpm}</span>
        </div>
        <div className="tt-result-item">
          <span className="tt-result-label">Characters</span>
          <span className="tt-result-value">{score.correctChars}/{score.totalChars}</span>
        </div>
        <div className="tt-result-item">
          <span className="tt-result-label">Time</span>
          <span className="tt-result-value">{formatTime(score.timeElapsed)}</span>
        </div>
      </div>

      <div className="tt-results-meta">
        <div className="tt-meta-item">
          <span className="tt-meta-label">Best WPM</span>
          <span className="tt-meta-value">{best.wpm}</span>
        </div>
        <div className="tt-meta-item">
          <span className="tt-meta-label">Streak</span>
          <span className="tt-meta-value">{streak.count} day{streak.count !== 1 ? 's' : ''}</span>
        </div>
        <div className="tt-meta-item">
          <span className="tt-meta-label">Daily</span>
          <span className="tt-meta-value">{dailyGoal.completed}/{dailyGoal.target}</span>
        </div>
      </div>

      {recentScores.length > 1 && (
        <div className="tt-recent">
          <div className="tt-recent-label">Recent</div>
          <div className="tt-recent-scores">
            {recentScores.slice(0, 5).map((s, i) => (
              <span key={i} className="tt-recent-score">
                {s.wpm} wpm · {s.accuracy}%
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="tt-results-actions">
        <button className="tt-btn tt-btn-primary" onClick={onRestart}>
          &gt; Tab to restart
        </button>
        <button className="tt-btn tt-btn-secondary" onClick={onClose}>
          Esc to close
        </button>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
