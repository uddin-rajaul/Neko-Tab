import { useState, useEffect, useRef, useCallback } from 'react'
import type { WeatherData } from '../types/weather'
import type { Settings, WeatherLocation } from '../types'
import { getCachedWeather, fetchWeather, isCacheStale, formatAge, resolveLocation } from '../utils/weather'

interface WeatherProps {
  settings: Settings
}

function dayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Today'
  if (index === 1) return 'Tomorrow'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

export function Weather({ settings }: WeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const itemRef = useRef<HTMLDivElement>(null)

  const location = settings.weather?.location ?? null
  const enabled = settings.weather?.enabled ?? false

  // Load from cache immediately, then fetch if stale
  useEffect(() => {
    if (!enabled || !location) return

    const cached = getCachedWeather()
    if (cached && cached.location.name === location.name) {
      setWeather(cached)
    }

    if (isCacheStale()) {
      setLoading(true)
      resolveLocation(location)
        .then(resolved => fetchWeather(resolved))
        .then(data => { setWeather(data); setError(null) })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [enabled, location?.name])

  // Refresh on visibility change (user switches back to tab)
  useEffect(() => {
    if (!enabled || !location) return
    const handler = () => {
      if (document.visibilityState === 'visible' && isCacheStale()) {
        resolveLocation(location)
          .then(resolved => fetchWeather(resolved))
          .then(setWeather)
          .catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [enabled, location?.name])

  // Click outside to close
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        cardRef.current && !cardRef.current.contains(e.target as Node) &&
        itemRef.current && !itemRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [open])

  const handleRefresh = useCallback(() => {
    if (!location) return
    setLoading(true)
    resolveLocation(location)
      .then(resolved => fetchWeather(resolved))
      .then(data => { setWeather(data); setError(null) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [location])

  // Not enabled — render nothing
  if (!enabled) return null

  // Enabled but no location — nudge
  if (!location) {
    return (
      <div className="stat-item weather-stat-item weather-nudge" onClick={() => {
        document.querySelector<HTMLElement>('.settings-toggle')?.click()
      }}>
        <span className="stat-label">WEATHER</span>
        <span className="stat-value" style={{ color: 'var(--status-warning)', cursor: 'pointer' }}>
          set city &rarr;
        </span>
      </div>
    )
  }

  // Loading with no data yet
  if (!weather && loading) {
    return (
      <div className="stat-item weather-stat-item">
        <span className="stat-label">WEATHER</span>
        <span className="stat-value" style={{ opacity: 0.5 }}>...</span>
      </div>
    )
  }

  // Error and no cached data
  if (error && !weather) {
    return (
      <div className="stat-item weather-stat-item">
        <span className="stat-label">WEATHER</span>
        <span className="stat-value" style={{ color: 'var(--status-danger)' }}>offline</span>
      </div>
    )
  }

  if (!weather) return null

  const stale = isCacheStale()

  return (
    <>
      <div
        ref={itemRef}
        className={`stat-item weather-stat-item ${open ? 'weather-active' : ''}`}
        onClick={() => setOpen(!open)}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter') setOpen(!open) }}
      >
        <span className="stat-label">WEATHER</span>
        <span className="stat-value">
          {weather.icon} {weather.temp}&deg;C
        </span>
        <span className="weather-city">{weather.location.name}</span>
        {stale && <span className="weather-age">{formatAge(weather.fetchedAt)}</span>}
      </div>

      {open && (
        <div ref={cardRef} className="weather-popup">
          <div className="weather-popup-header">
            <span className="weather-popup-location">{weather.location.name}</span>
            <button className="weather-refresh-btn" onClick={handleRefresh} disabled={loading} title="Refresh">
              {loading ? '...' : '\u21bb'}
            </button>
          </div>

          <div className="weather-popup-current">
            <div className="weather-current-main">
              <span className="weather-current-icon">{weather.icon}</span>
              <span className="weather-current-temp">{weather.temp}&deg;C</span>
              <span className="weather-current-condition">{weather.condition}</span>
            </div>
            <div className="weather-current-detail">
              Feels {weather.feelsLike}&deg;C &middot; Humidity {weather.humidity}%
            </div>
          </div>

          <div className="weather-popup-divider" />

          <div className="weather-forecast">
            {weather.forecast.slice(1).map((day, i) => (
              <div className="weather-forecast-row" key={day.date}>
                <span className="weather-forecast-day">{dayLabel(day.date, i + 1)}</span>
                <span className="weather-forecast-temps">
                  {day.tempMax}&deg; / {day.tempMin}&deg;
                </span>
                <span className="weather-forecast-icon">{day.icon}</span>
                <span className="weather-forecast-condition">{day.condition}</span>
              </div>
            ))}
          </div>

          {stale && (
            <div className="weather-popup-stale">
              Data from {formatAge(weather.fetchedAt)}
            </div>
          )}
        </div>
      )}
    </>
  )
}
