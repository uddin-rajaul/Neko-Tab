import { useEffect } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { useStartupSites } from '../hooks/useStartupSites'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function StartupLauncher() {
  const { sites, shouldShow, markShown, openStartupSites, setForceShow } = useStartupSites()

  // Listen for shortcut-triggered show request from background service worker
  useEffect(() => {
    const listener = (msg: any) => {
      if (msg?.type === 'neko-show-startup-card') {
        setForceShow(true)
      }
    }
    chrome.runtime?.onMessage?.addListener(listener)
    return () => chrome.runtime?.onMessage?.removeListener(listener)
  }, [setForceShow])

  if (!shouldShow) return null

  const handleOpen = () => {
    void openStartupSites()
  }

  const handleDismiss = () => {
    markShown()
  }

  return (
    <div className="startup-launcher">
      <div className="startup-launcher-inner">
        <span className="startup-launcher-prompt">
          {getGreeting()} — open your startup sites?
        </span>
        <button className="startup-launcher-open" onClick={handleOpen}>
          <ExternalLink size={13} />
          Open all ({sites.length})
        </button>
        <button className="startup-launcher-dismiss" onClick={handleDismiss} title="Not today">
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
