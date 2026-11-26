import type { Settings } from '../../types'
import { isHexColor } from '../../utils/customTheme'

type TextColors = Settings['textColors']

interface TextStyleSettingsProps {
  fontWeight: number
  textColors: TextColors
  onFontWeightChange: (weight: number) => void
  onTextColorsChange: (colors: TextColors) => void
}

const WEIGHTS = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semibold' },
  { value: 700, label: 'Bold' },
]

const COLOR_ROWS: { key: keyof TextColors; label: string; hint: string; cssVar: string }[] = [
  { key: 'primary', label: 'Main text', hint: 'clock, headings, search', cssVar: '--text-primary' },
  { key: 'secondary', label: 'Muted text', hint: 'links, date, status bar', cssVar: '--text-secondary' },
]

// What the active theme currently uses, so the picker starts from it
function themeColor(cssVar: string): string {
  const app = document.querySelector('.app')
  const value = app ? getComputedStyle(app).getPropertyValue(cssVar).trim() : ''
  return isHexColor(value) ? value : '#888888'
}

export function TextStyleSettings({ fontWeight, textColors, onFontWeightChange, onTextColorsChange }: TextStyleSettingsProps) {
  return (
    <div className='saas-card' style={{ marginTop: 16 }}>
      <label className='saas-label'>Text Thickness</label>
      <div className='saas-segmented-control'>
        {WEIGHTS.map(w => (
          <button
            key={w.value}
            className={`saas-segment ${fontWeight === w.value ? 'active' : ''}`}
            style={{ fontWeight: w.value }}
            onClick={() => onFontWeightChange(w.value)}
          >
            {w.label}
          </button>
        ))}
      </div>

      <label className='saas-label'>Text Color</label>
      {COLOR_ROWS.map(row => {
        const override = textColors[row.key]
        return (
          <div key={row.key} className='text-color-row'>
            <input
              type='color'
              value={override ?? themeColor(row.cssVar)}
              onChange={e => onTextColorsChange({ ...textColors, [row.key]: e.target.value })}
            />
            <div className='text-color-row-label'>
              <span>{row.label}</span>
              <span className='text-color-row-hint'>{override ? override.toUpperCase() : 'theme default'} · {row.hint}</span>
            </div>
            {override && (
              <button className='saas-btn-secondary' onClick={() => onTextColorsChange({ ...textColors, [row.key]: null })}>
                Use theme color
              </button>
            )}
          </div>
        )
      })}
      <p className='saas-hint'>Changes preview live. These colors apply on top of whichever theme you pick.</p>
    </div>
  )
}
