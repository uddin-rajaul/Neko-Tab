import { useState, useEffect } from 'react'
import { HardDrive, Wifi, WifiOff } from 'lucide-react'

export function ActivityWidget() {
  const [memoryUsage, setMemoryUsage] = useState<string>('--')
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    // Memory usage (if available)
    const updateMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usedMB = Math.round(memory.usedJSHeapSize / (1024 * 1024))
        const totalMB = Math.round(memory.jsHeapSizeLimit / (1024 * 1024))
        setMemoryUsage(`${usedMB}MB / ${totalMB}MB`)
      } else {
        setMemoryUsage('N/A')
      }
    }

    // Network status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    updateMemory()
    const memoryInterval = setInterval(updateMemory, 5000)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(memoryInterval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="activity-widget-container">
      <div className="activity-summary">
        <div className="stat-item">
          <HardDrive size={14} className="stat-icon" />
          <span className="stat-label">MEMORY</span>
          <span className="stat-value">{memoryUsage}</span>
        </div>
        <div className={`stat-item ${isOnline ? 'status-online' : 'status-offline'}`}>
          {isOnline ? <Wifi size={14} className="stat-icon" /> : <WifiOff size={14} className="stat-icon" />}
          <span className="stat-label">NETWORK</span>
          <span className="stat-value">{isOnline ? 'CONNECTED' : 'OFFLINE'}</span>
        </div>
      </div>
    </div>
  )
}

