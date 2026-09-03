import type { WeatherLocation } from '../types'

export interface ForecastDay {
  date: string
  tempMax: number
  tempMin: number
  weatherCode: number
  condition: string
  icon: string
}

export interface WeatherData {
  temp: number
  feelsLike: number
  humidity: number
  weatherCode: number
  condition: string
  icon: string
  location: WeatherLocation
  forecast: ForecastDay[]
  fetchedAt: number
}

export interface WeatherCache {
  data: WeatherData
  fetchedAt: number
}
