import { useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import type { CustomTheme, CustomThemeColors } from '../../types'
import { CUSTOM_THEME_COLOR_FIELDS, DEFAULT_CUSTOM_COLORS, isHexColor } from '../../utils/customTheme'

interface CustomThemeEditorProps {
  initialTheme: CustomTheme
  isNew: boolean
  onSave: (theme: CustomTheme) => void
  onDelete: () => void
  onCancel: () => void
}

function sameColors(a: CustomThemeColors, b: CustomThemeColors): boolean {
  return CUSTOM_THEME_COLOR_FIELDS.every(f => a[f.key].toLowerCase() === b[f.key].toLowerCase())
}

export function CustomThemeEditor({ initialTheme, isNew, onSave, onDelete, onCancel }: CustomThemeEditorProps) {
  const [theme, setTheme] = useState<CustomTheme>(initialTheme)
  // Hex text fields can be mid-edit (e.g. "#3d"), so keep their raw text separate from the saved colors
  const [hexDrafts, setHexDrafts] = useState<CustomThemeColors>(initialTheme.colors)

  const setColor = (key: keyof CustomThemeColors, value: string) => {
    setHexDrafts(prev => ({ ...prev, [key]: value }))
    if (isHexColor(value)) {
      setTheme(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }))
    }
  }

  const replaceColors = (colors: CustomThemeColors) => {
    setHexDrafts(colors)
    setTheme(prev => ({ ...prev, colors }))
  }

  const setMode = (isLight: boolean) => {
    // Swap to the other starting palette only while the colors are still untouched
    const currentDefault = DEFAULT_CUSTOM_COLORS[theme.isLight ? 'light' : 'dark']
    if (sameColors(theme.colors, currentDefault)) {
      replaceColors(DEFAULT_CUSTOM_COLORS[isLight ? 'light' : 'dark'])
    }
    setTheme(prev => ({ ...prev, isLight }))
  }

  const { colors } = theme
  const canSave = theme.name.trim().length > 0

  return (
    <div className='saas-card custom-theme-editor'>
      <label className='saas-label'>{isNew ? 'New Theme' : 'Edit Theme'}</label>

      <div className='custom-theme-editor-top'>
        <div className='custom-theme-editor-fields'>
          <input
            type='text'
            className='saas-input'
            placeholder='Theme name'
            value={theme.name}
            maxLength={30}
            onChange={e => setTheme(prev => ({ ...prev, name: e.target.value }))}
          />
          <div className='saas-segmented-control'>
            <button className={`saas-segment ${theme.isLight ? 'active' : ''}`} onClick={() => setMode(true)}>
              Light
            </button>
            <button className={`saas-segment ${!theme.isLight ? 'active' : ''}`} onClick={() => setMode(false)}>
              Dark
            </button>
          </div>
        </div>

        <div
          className='custom-theme-live-preview'
          style={{ backgroundColor: colors.bgPrimary, borderColor: colors.border, color: colors.textPrimary }}
        >
          <div className='custom-theme-live-preview-search' style={{ backgroundColor: colors.bgTertiary, borderColor: colors.border }}>
            <span style={{ color: colors.accent }}>&gt;</span>
            <span style={{ color: colors.textSecondary }}> search...</span>
          </div>
          <div style={{ color: colors.accent, fontWeight: 600 }}>Category</div>
          <div style={{ color: colors.textSecondary }}>bookmark · link</div>
          <div style={{ color: colors.error }}>error</div>
        </div>
      </div>

      <div className='custom-theme-color-grid'>
        {CUSTOM_THEME_COLOR_FIELDS.map(field => (
          <label key={field.key} className='custom-theme-color-field'>
            <input
              type='color'
              value={colors[field.key]}
              onChange={e => setColor(field.key, e.target.value)}
            />
            <span className='custom-theme-color-label'>{field.label}</span>
            <input
              type='text'
              className={`saas-input custom-theme-hex ${isHexColor(hexDrafts[field.key]) ? '' : 'invalid'}`}
              value={hexDrafts[field.key]}
              maxLength={7}
              spellCheck={false}
              onChange={e => setColor(field.key, e.target.value.trim())}
            />
          </label>
        ))}
      </div>

      <div className='custom-theme-editor-actions'>
        {!isNew && (
          <button className='saas-btn-secondary custom-theme-delete' onClick={onDelete}>
            <Trash2 size={14} /> Delete
          </button>
        )}
        <button className='saas-btn-secondary' onClick={() => replaceColors(DEFAULT_CUSTOM_COLORS[theme.isLight ? 'light' : 'dark'])}>
          Reset colors
        </button>
        <div style={{ flex: 1 }} />
        <button className='saas-btn-secondary' onClick={onCancel}>Cancel</button>
        <button
          className='saas-btn-primary'
          disabled={!canSave}
          onClick={() => onSave({ ...theme, name: theme.name.trim() })}
        >
          <Check size={14} /> {isNew ? 'Add theme' : 'Update theme'}
        </button>
      </div>
      <p className='saas-hint'>Then click Save Changes to apply it.</p>
    </div>
  )
}
