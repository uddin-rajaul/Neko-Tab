export interface Bookmark {
  id: string
  title: string
  url: string
}

export interface BookmarkCategory {
  id: string
  name: string
  bookmarks: Bookmark[]
}

export interface Settings {
  userName: string
  showGreeting: boolean
  showClock: boolean
  showWeather: boolean
  theme: 'dark' | 'light'
  clockFormat: '12h' | '24h'
  asciiArt?: string
}
