export interface UrlAlias {
  key: string   // e.g. "gh"
  url: string   // e.g. "https://github.com/raj"
}

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

export type AsciiArtSource = 'os' | 'cat' | 'custom'

export interface Settings {
  userName: string
  showGreeting: boolean
  showClock: boolean
  showWeather: boolean
  showStatusBar: boolean
  theme: ThemeType
  clockFormat: '12h' | '24h'
  asciiArtSource: AsciiArtSource
  asciiArt?: string // Deprecated, but keep for migration if needed
  customAsciiArt?: string
  // Background
  bgDim: number        // 0–90
  bgBlur: number       // 0–10
  // Widgets
  showDailyGoal: boolean
  showGitHubStreak: boolean
  githubUsername: string
  // Font
  font: string
  // Chrome Tab
  showChromeTab: boolean
}
