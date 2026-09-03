import { useState, useEffect, useRef, useCallback } from 'react'
import type { RssItem } from '../types/rss'
import type { Settings } from '../types'
import { getCachedRss, isRssCacheStale, refreshAllFeeds, formatTimeAgo } from '../utils/rss'

const ROTATION_MS = 6000
const FADE_MS = 200

interface RssTickerProps {
  settings: Settings
}

export function RssTicker({ settings }: RssTickerProps) {
  const [items, setItems] = useState<RssItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [fading, setFading] = useState(false)
  const [focusActive, setFocusActive] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickerRef = useRef<HTMLDivElement>(null)

  const enabled = settings.showRssTicker
  const feeds = settings.rssFeeds ?? []

  // Check focus mode by looking for the overlay element
  useEffect(() => {
    if (!enabled) return
    const check = () => setFocusActive(!!document.querySelector('.focus-overlay'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [enabled])

  // Load cache + refresh if stale
  useEffect(() => {
    if (!enabled || feeds.length === 0) return

    const cached = getCachedRss()
    if (cached?.items.length) {
      setItems(cached.items)
    }

    if (isRssCacheStale() || !cached?.items.length) {
      refreshAllFeeds(feeds)
        .then(newItems => {
          if (newItems.length) setItems(newItems)
        })
        .catch(() => {})
    }
  }, [enabled, feeds.length])

  // Refresh on visibility change
  useEffect(() => {
    if (!enabled || feeds.length === 0) return
    const handler = () => {
      if (document.visibilityState === 'visible' && isRssCacheStale()) {
        refreshAllFeeds(feeds).then(newItems => {
          if (newItems.length) setItems(newItems)
        }).catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [enabled, feeds.length])

  // Rotation engine
  useEffect(() => {
    if (!enabled || items.length <= 1 || paused || focusActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % items.length)
        setFading(false)
      }, FADE_MS)
    }, ROTATION_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [enabled, items.length, paused, focusActive])

  // Global 't' key for pause/resume
  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      // Don't capture if typing in an input
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 't' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setPaused(p => !p)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [enabled])

  const handleClick = useCallback((item: RssItem) => {
    if (item.link) {
      window.open(item.link, '_blank', 'noopener,noreferrer')
      setPaused(true)
    }
  }, [])

  const handleNext = useCallback(() => {
    if (items.length <= 1) return
    setFading(true)
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % items.length)
      setFading(false)
    }, FADE_MS)
  }, [items.length])

  // Don't render if disabled
  if (!enabled) return null

  // Focus mode active — hide
  if (focusActive) return null

  // No feeds configured
  if (feeds.length === 0) {
    return (
      <div className="rss-ticker" ref={tickerRef}>
        <span className="rss-ticker-prefix">&gt;</span>
        <span
          className="rss-ticker-text rss-ticker-nudge"
          onClick={() => document.querySelector<HTMLElement>('.settings-toggle')?.click()}
        >
          RSS: add feeds &rarr;
        </span>
      </div>
    )
  }

  // All feeds disabled
  if (feeds.every(f => !f.enabled)) {
    return (
      <div className="rss-ticker">
        <span className="rss-ticker-prefix">&gt;</span>
        <span className="rss-ticker-text rss-ticker-offline">RSS: all feeds disabled</span>
      </div>
    )
  }

  // Loading state
  if (items.length === 0) {
    return (
      <div className="rss-ticker">
        <span className="rss-ticker-prefix">&gt;</span>
        <span className="rss-ticker-text rss-ticker-loading">RSS: fetching...</span>
      </div>
    )
  }

  const current = items[currentIndex % items.length]
  const timeAgo = formatTimeAgo(current.pubDate)

  return (
    <div
      className={`rss-ticker ${paused ? 'rss-ticker-paused' : ''}`}
      ref={tickerRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="rss-ticker-prefix">&gt;</span>
      <span className="rss-ticker-feed">[{current.feedName}]</span>
      <span
        className={`rss-ticker-text ${fading ? 'rss-ticker-fading' : ''}`}
        onClick={() => handleClick(current)}
        title={current.title}
      >
        {current.title}
      </span>
      {timeAgo && <span className="rss-ticker-time">&middot; {timeAgo}</span>}
      {paused && items.length > 1 && (
        <button className="rss-ticker-next" onClick={handleNext} title="Next headline">
          &rsaquo;
        </button>
      )}
    </div>
  )
}
