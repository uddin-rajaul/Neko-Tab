import type { CSSProperties } from 'react'
import type { CustomTheme, CustomThemeColors } from '../types'

export const CUSTOM_THEME_COLOR_FIELDS: { key: keyof CustomThemeColors; label: string; cssVar: string }[] = [
  { key: 'bgPrimary', label: 'Background', cssVar: '--bg-primary' },
  { key: 'bgSecondary', label: 'Background 2', cssVar: '--bg-secondary' },
  { key: 'bgTertiary', label: 'Surface', cssVar: '--bg-tertiary' },
  { key: 'textPrimary', label: 'Text', cssVar: '--text-primary' },
  { key: 'textSecondary', label: 'Muted text', cssVar: '--text-secondary' },
  { key: 'accent', label: 'Accent', cssVar: '--accent' },
  { key: 'accentHover', label: 'Accent hover', cssVar: '--accent-hover' },
  { key: 'border', label: 'Border', cssVar: '--border' },
  { key: 'error', label: 'Error', cssVar: '--error' },
]

// Starting palettes for a new theme: the built-in Paper (light) and Carbon (dark) colors
export const DEFAULT_CUSTOM_COLORS: Record<'light' | 'dark', CustomThemeColors> = {
  light: {
    bgPrimary: '#F5F5F5', bgSecondary: '#FFFFFF', bgTertiary: '#E8E8E8',
    textPrimary: '#222526', textSecondary: '#555555',
    accent: '#444444', accentHover: '#333333', border: '#CCCCCC', error: '#D32F2F',
  },
  dark: {
    bgPrimary: '#222526', bgSecondary: '#1A1A1A', bgTertiary: '#2D3134',
    textPrimary: '#E0E0E0', textSecondary: '#BFBFBF',
    accent: '#3DD2CC', accentHover: '#5AE0DB', border: '#353A3E', error: '#FF5555',
  },
}

// Built-in light themes besides Paper, which has its own .paper rules
export const LIGHT_THEME_IDS: ReadonlySet<string> = new Set(['solarized-light', 'catppuccin-latte', 'gruvbox-light', 'rose-pine-dawn', 'everforest-light', 'github-light', 'tokyo-night-day', 'one-light'])

export function isCustomThemeId(themeId: string): themeId is `custom-${string}` {
  return themeId.startsWith('custom-')
}

export function findCustomTheme(themeId: string, customThemes: CustomTheme[] | undefined): CustomTheme | undefined {
  if (!isCustomThemeId(themeId)) return undefined
  return customThemes?.find(t => t.id === themeId)
}

/** CSS variables for a custom theme, applied inline so they override the theme class rules */
export function customThemeStyle(theme: CustomTheme | undefined): CSSProperties {
  if (!theme) return {}
  const vars: Record<string, string> = {}
  for (const field of CUSTOM_THEME_COLOR_FIELDS) {
    vars[field.cssVar] = theme.colors[field.key]
  }
  return vars as CSSProperties
}

/** Text color overrides from settings; spread after customThemeStyle so they win */
export function textColorStyle(textColors: { primary: string | null; secondary: string | null } | undefined): CSSProperties {
  const vars: Record<string, string> = {}
  if (textColors?.primary) vars['--text-primary'] = textColors.primary
  if (textColors?.secondary) vars['--text-secondary'] = textColors.secondary
  return vars as CSSProperties
}

/** Class names for the .app root / command palette; theme-light turns on the light-mode CSS rules */
export function themeClassName(themeId: string, customTheme: CustomTheme | undefined): string {
  if (customTheme) return customTheme.isLight ? 'custom-theme theme-light' : 'custom-theme'
  return LIGHT_THEME_IDS.has(themeId) ? `${themeId} theme-light` : themeId
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

// Font names end up inside a CSS font-family value, so strip characters that could break out of it
export function sanitizeFontName(name: string): string {
  return name.replace(/['"\\;{}<>]/g, '').trim().slice(0, 60)
}
