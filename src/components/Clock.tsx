import { useTime } from '../hooks/useLocalStorage'
import { useState, useEffect } from 'react'

interface ClockProps {
  userName?: string
  showGreeting?: boolean
  format?: '12h' | '24h'
}

export function Clock({ userName = 'User', showGreeting = true, format = '24h' }: ClockProps) {
  const time = useTime()
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const appEl = document.querySelector('.app')
    if (isMaximized) {
      appEl?.classList.add('clock-maximized')
    } else {
      appEl?.classList.remove('clock-maximized')
    }
    return () => {
      appEl?.classList.remove('clock-maximized')
    }
  }, [isMaximized])

  useEffect(() => {
    if (!isMaximized) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. If typing in an input or textarea, don't exit
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      // 2. Ignore modifier keys alone
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return

      // 3. Check for registered shortcuts
      const isCmdOrCtrl = e.ctrlKey || e.metaKey
      const isShortcut = 
        e.key === 'Escape' ||
        (isCmdOrCtrl && e.key === 'k') ||
        e.key === '/' ||
        (isCmdOrCtrl && e.key === '`') ||
        (isCmdOrCtrl && e.shiftKey && e.key === 'T') ||
        (e.key.toLowerCase() === 'c' && !isCmdOrCtrl && !e.altKey) ||
        e.key === '?'
      
      if (isShortcut) {
        setIsMaximized(false)
        // We do NOT stop propagation or prevent default here, 
        // so the registered action can still trigger.
      }
    }

    // Use capture phase to intercept before other handlers if necessary,
    // though here we just need to see the event to trigger exit.
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isMaximized])
  
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
    <div 
      className={`clock-container ${isMaximized ? 'maximized' : ''}`}
      onClick={() => setIsMaximized(!isMaximized)}
      title={isMaximized ? 'Click to exit' : 'Click to maximize'}
    >
      <div className="clock-time">{formattedTime}</div>
      <div className="clock-date">{formattedDate}</div>
      {showGreeting && !isMaximized && (
        <div className="clock-greeting">{greeting}, {userName}</div>
      )}
    </div>
  )
}
