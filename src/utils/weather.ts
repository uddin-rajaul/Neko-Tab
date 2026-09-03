import type { WeatherLocation } from '../types'
import type { WeatherData, WeatherCache, ForecastDay } from '../types/weather'

const CACHE_KEY = 'nekotab-weather-cache'
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

const WMO_CODES: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Clear', icon: '\u2600' },
  1: { condition: 'Mostly clear', icon: '\u2600' },
  2: { condition: 'Partly cloudy', icon: '\u26c5' },
  3: { condition: 'Overcast', icon: '\u2601' },
  45: { condition: 'Foggy', icon: '\u2601' },
  48: { condition: 'Rime fog', icon: '\u2601' },
  51: { condition: 'Light drizzle', icon: '\u2602' },
  53: { condition: 'Drizzle', icon: '\u2602' },
  55: { condition: 'Dense drizzle', icon: '\u2602' },
  61: { condition: 'Light rain', icon: '\u2614' },
  63: { condition: 'Rain', icon: '\u2614' },
  65: { condition: 'Heavy rain', icon: '\u2614' },
  71: { condition: 'Light snow', icon: '\u2744' },
  73: { condition: 'Snow', icon: '\u2744' },
  75: { condition: 'Heavy snow', icon: '\u2744' },
  80: { condition: 'Light showers', icon: '\u2614' },
  81: { condition: 'Showers', icon: '\u2614' },
  82: { condition: 'Heavy showers', icon: '\u2614' },
  95: { condition: 'Thunderstorm', icon: '\u26c8' },
  96: { condition: 'Thunderstorm + hail', icon: '\u26c8' },
  99: { condition: 'Thunderstorm + heavy hail', icon: '\u26c8' },
}

function decodeWMO(code: number): { condition: string; icon: string } {
  return WMO_CODES[code] ?? { condition: 'Unknown', icon: '\u2601' }
}

function readCache(): WeatherCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as WeatherCache
  } catch {
    return null
  }
}

function writeCache(data: WeatherData): void {
  const cache: WeatherCache = { data, fetchedAt: Date.now() }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

export function getCachedWeather(): WeatherData | null {
  const cache = readCache()
  if (!cache) return null
  if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) return cache.data // return stale with timestamp
  return cache.data
}

export function isCacheStale(): boolean {
  const cache = readCache()
  if (!cache) return true
  return Date.now() - cache.fetchedAt > CACHE_TTL_MS
}

export async function fetchWeather(location: WeatherLocation): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(location.lat),
    longitude: String(location.lon),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: location.timezone,
    forecast_days: '4',
  })

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`)

  const json = await res.json()
  const current = json.current
  const daily = json.daily

  const currentWMO = decodeWMO(current.weather_code)

  const forecast: ForecastDay[] = []
  for (let i = 0; i < daily.time.length && i < 4; i++) {
    const wmo = decodeWMO(daily.weather_code[i])
    forecast.push({
      date: daily.time[i],
      tempMax: Math.round(daily.temperature_2m_max[i]),
      tempMin: Math.round(daily.temperature_2m_min[i]),
      weatherCode: daily.weather_code[i],
      condition: wmo.condition,
      icon: wmo.icon,
    })
  }

  const data: WeatherData = {
    temp: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: Math.round(current.relative_humidity_2m),
    weatherCode: current.weather_code,
    condition: currentWMO.condition,
    icon: currentWMO.icon,
    location,
    forecast,
    fetchedAt: Date.now(),
  }

  writeCache(data)
  return data
}

export async function reverseGeocode(lat: number, lon: number): Promise<WeatherLocation> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1`
  )
  if (!res.ok) throw new Error('Geocoding failed')
  const json = await res.json()
  if (!json.results?.length) throw new Error('City not found')
  const r = json.results[0]
  return {
    name: r.name,
    lat: r.latitude,
    lon: r.longitude,
    timezone: r.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

export async function geocodeCity(cityName: string): Promise<WeatherLocation> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en`
  )
  if (!res.ok) throw new Error('Geocoding failed')
  const json = await res.json()
  if (!json.results?.length) throw new Error('City not found')
  const r = json.results[0]
  return {
    name: r.name,
    lat: r.latitude,
    lon: r.longitude,
    timezone: r.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

export function formatAge(fetchedAt: number): string {
  const mins = Math.floor((Date.now() - fetchedAt) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export async function resolveLocation(location: WeatherLocation): Promise<WeatherLocation> {
  if (location.lat !== 0 || location.lon !== 0) return location
  return geocodeCity(location.name)
}

export interface CitySearchResult {
  name: string
  admin1: string
  country: string
  lat: number
  lon: number
  timezone: string
}

export async function searchCity(query: string): Promise<CitySearchResult[]> {
  if (!query.trim()) return []
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
  )
  if (!res.ok) return []
  const json = await res.json()
  if (!json.results) return []
  return json.results.map((r: any) => ({
    name: r.name,
    admin1: r.admin1 ?? '',
    country: r.country ?? '',
    lat: r.latitude,
    lon: r.longitude,
    timezone: r.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  }))
}

export async function detectByIP(): Promise<WeatherLocation> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch('https://ipwho.is/', { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) throw new Error('IP detection failed')
    const json = await res.json()
    if (!json.success) throw new Error(json.message ?? 'IP detection failed')
    return {
      name: json.city ?? json.country ?? 'Unknown',
      lat: json.latitude,
      lon: json.longitude,
      timezone: json.timezone?.id ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  } catch (e: any) {
    clearTimeout(timer)
    if (e.name === 'AbortError') throw new Error('IP detection timed out')
    throw e
  }
}

export function clearWeatherCache(): void {
  localStorage.removeItem(CACHE_KEY)
}
