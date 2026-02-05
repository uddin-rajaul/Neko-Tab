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

export type ThemeType = 
  // Simple Color Themes
  | 'carbon' | 'paper' | 'nord' | 'solarized' | 'matrix'
  | 'dracula' | 'monokai' | 'gruvbox' | 'tokyo-night' | 'catppuccin'
  | 'one-dark' | 'rose-pine' | 'everforest'
  // Animated Themes
  | 'cyberpunk' | 'aurora' | 'synthwave' | 'vaporwave'
  // Special Effect Themes
  | 'retro-terminal' | 'sunset' | 'ocean' | 'midnight'

export interface ThemeInfo {
  id: ThemeType
  name: string
  bgColor: string
  textColor: string
  accentColor: string
  category?: 'color' | 'animated' | 'special'
}

export interface Settings {
  userName: string
  showGreeting: boolean
  showClock: boolean
  showWeather: boolean
  showStatusBar: boolean
  theme: ThemeType
  clockFormat: '12h' | '24h'
  asciiArt?: string
}
