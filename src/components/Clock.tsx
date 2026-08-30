import { useTime } from '../hooks/useLocalStorage'
import { useState, useEffect } from 'react'

interface ClockProps {
  userName?: string
  showGreeting?: boolean
  format?: '12h' | '24h'
  theme?: string
}

// 5x7 dot-matrix bitmaps for the Nothing theme clock
const MATRIX_GLYPHS: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
}

function MatrixChar({ char }: { char: string }) {
  const rows = MATRIX_GLYPHS[char]
  if (!rows) return null
  return (
    <span className="matrix-char">
      {rows.flatMap((row, r) =>
        row.split('').map((bit, c) => (
          <span key={`${r}-${c}`} className={`matrix-dot${bit === '1' ? ' on' : ''}`} />
        ))
      )}
    </span>
  )
}

export function Clock({ userName = 'User', showGreeting = true, format = '24h', theme }: ClockProps) {
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
    const h = hours
    if (h < 4)  return 'lateNight'
    if (h < 6)  return 'earlyMorning'
    if (h < 10) return 'morning'
    if (h < 12) return 'lateMorning'
    if (h < 15) return 'afternoon'
    if (h < 18) return 'lateAfternoon'
    if (h < 21) return 'evening'
    return 'night'
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

  const isNothing = theme === 'nothing'
  const timeMatch = formattedTime.match(/^(\d{1,2}:\d{2})\s*(AM|PM)?$/i)
  const timePart = (timeMatch?.[1] ?? formattedTime).padStart(5, '0')
  const ampm = timeMatch?.[2]

  return (
    <div
      className={`clock-container ${isMaximized ? 'maximized' : ''}`}
      onClick={() => setIsMaximized(!isMaximized)}
      title={isMaximized ? 'Click to exit' : 'Click to maximize'}
    >
      {isNothing ? (
        <div className="clock-matrix">
          <span className="matrix-digits">
            {timePart.split('').map((ch, i) => <MatrixChar key={i} char={ch} />)}
          </span>
          {ampm && <span className="matrix-ampm">{ampm}</span>}
        </div>
      ) : (
        <div className="clock-time">{formattedTime}</div>
      )}
      <div className="clock-date">{formattedDate}</div>
      {showGreeting && !isMaximized && (
        <div className="clock-greeting">{greeting}, {userName}</div>
      )}
    </div>
  )
}
