import { useTime } from '../hooks/useLocalStorage'

interface ClockProps {
  userName?: string
  showGreeting?: boolean
  format?: '12h' | '24h'
}

export function Clock({ userName = 'User', showGreeting = true, format = '24h' }: ClockProps) {
  const time = useTime()
  
  const hours = time.getHours()
  const minutes = time.getMinutes()

  const greetingPool: Record<string, string[]> = {
    lateNight: [
      'Burning the midnight oil',
      'Still up?',
      'The night shift suits you',
      'Quiet hours, sharp focus',
      'Owls and coders never sleep',
    ],
    earlyMorning: [
      'Rise and grind',
      'Early bird mode',
      'Getting a head start',
      'The world is still asleep',
      'Coffee first?',
    ],
    morning: [
      'Good morning',
      'Ready to build something?',
      'Fresh start',
      'Morning, let\'s get to it',
      'Hope the coffee is good',
    ],
    lateMorning: [
      'Good morning',
      'Almost noon — how\'s it going?',
      'Hope the morning\'s been kind',
      'Settling into the day',
    ],
    afternoon: [
      'Good afternoon',
      'Keep the momentum going',
      'Afternoon grind',
      'Deep work hours',
      'You\'ve got this',
    ],
    lateAfternoon: [
      'Wrapping up or pushing through?',
      'Golden hour productivity',
      'Almost there',
      'Good afternoon',
      'The day isn\'t over yet',
    ],
    evening: [
      'Good evening',
      'Winding down?',
      'Evening session',
      'One last push?',
      'Hope the day treated you well',
    ],
    night: [
      'Good evening',
      'Late night mode',
      'Building something tonight?',
      'The quiet before midnight',
      'Focus time',
    ],
  }

  const getSegment = () => {
    const h = hours, m = minutes
    if (h < 4)  return 'lateNight'
    if (h < 6)  return 'earlyMorning'
    if (h < 10) return 'morning'
    if (h < 12) return 'lateMorning'
    if (h < 15) return 'afternoon'
    if (h < 18) return 'lateAfternoon'
    if (h < 21) return 'evening'
    return 'night'
    void m // suppress unused warning
  }

  const segment = getSegment()
  const pool = greetingPool[segment]
  // Rotate daily so it changes but isn't random on every re-render
  const dayOfYear = Math.floor((time.getTime() - new Date(time.getFullYear(), 0, 0).getTime()) / 86400000)
  const greeting = pool[dayOfYear % pool.length]
  
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
