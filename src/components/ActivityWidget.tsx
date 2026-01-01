import { Clock, Zap } from 'lucide-react'
import { useActivity } from '../hooks/useActivity'

export function ActivityWidget() {
  const { sessionTime, streak } = useActivity()

  return (
    <div className="activity-widget-container">
      <div className="activity-summary">
        <div className="stat-item" title="Daily Session Time">
          <Clock size={15} className="stat-icon" />
          <span className="stat-value">{sessionTime}</span>
        </div>

        <div className="stat-item" title="Daily Focus Streak">
          <Zap size={15} className="stat-icon" />
          <span className="stat-value">{streak} days</span>
        </div>
      </div>
    </div>
  )
}

