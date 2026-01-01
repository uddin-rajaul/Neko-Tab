import { useTime } from '../hooks/useLocalStorage'

interface ClockProps {
  userName?: string
  showGreeting?: boolean
  format?: '12h' | '24h'
}

export function Clock({ userName = 'User', showGreeting = true, format = '24h' }: ClockProps) {
  const time = useTime()
  
  const hours = time.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening'
  
  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: format === '12h'
  })
  
  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="clock-container">
      <div className="clock-time">{formattedTime}</div>
      <div className="clock-date">{formattedDate}</div>
      {showGreeting && (
        <div className="clock-greeting">{greeting}, {userName}</div>
      )}
    </div>
  )
}
