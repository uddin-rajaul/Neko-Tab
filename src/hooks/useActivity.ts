import { useState, useEffect, useCallback } from 'react'

interface ActivityData {
  date: string
  secondsToday: number
  streak: number // This is now Focus Streak
  lastVisit: string
  lastFocusDate: string | null
}

const DEFAULT_DATA: ActivityData = {
  date: new Date().toLocaleDateString(),
  secondsToday: 0,
  streak: 0,
  lastVisit: new Date().toLocaleDateString(),
  lastFocusDate: null,
}

export function useActivity() {
  const [data, setData] = useState<ActivityData>(() => {
    const stored = localStorage.getItem('activity_data')
    if (stored) {
      const parsed = JSON.parse(stored)
      // Check if it's a new day
      const today = new Date().toLocaleDateString()
      if (parsed.date !== today) {
        return {
          ...parsed,
          date: today,
          secondsToday: 0, // Reset timer for new day
          lastVisit: today
        }
      }
      return parsed
    }
    return DEFAULT_DATA
  })

  useEffect(() => {
    // Save to local storage whenever data changes
    localStorage.setItem('activity_data', JSON.stringify(data))
  }, [data])

  useEffect(() => {
    const timer = setInterval(() => {
      setData(prev => {
        const today = new Date().toLocaleDateString()
        if (prev.date !== today) {
             // Day changed while app was open
             return {
                 ...prev,
                 date: today,
                 secondsToday: 0,
                 lastVisit: today
             }
        }
        return {
          ...prev,
          secondsToday: prev.secondsToday + 1
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const completeFocusSession = useCallback(() => {
    setData(prev => {
        const today = new Date().toLocaleDateString()
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString()
        
        // If already focused today, don't increment streak, just return (or we could count sessions too, but request said streak)
        if (prev.lastFocusDate === today) {
             return { ...prev, lastFocusDate: today }
        }

        const isConsecutive = prev.lastFocusDate === yesterday
        
        return {
            ...prev,
            streak: isConsecutive ? prev.streak + 1 : 1,
            lastFocusDate: today
        }
    })
  }, [])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    return `${hours}h ${remainingMins}m`
  }

  return {
    sessionTime: formatTime(data.secondsToday),
    streak: data.streak,
    completeFocusSession
  }
}

