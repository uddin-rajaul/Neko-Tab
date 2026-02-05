import { useState, useEffect } from 'react'
import { Settings, X, Plus, Check, Upload, Palette, Save } from 'lucide-react'
import type { Settings as SettingsType, ThemeInfo } from '../types'
import { convertImageToAscii } from '../utils/imageToAscii'

const THEMES: ThemeInfo[] = [
  // Simple Color Themes
  { id: 'carbon', name: 'Carbon', bgColor: '#222526', textColor: '#E0E0E0', accentColor: '#3dd2cc', category: 'color' },
  { id: 'paper', name: 'Paper', bgColor: '#F5F5F5', textColor: '#222526', accentColor: '#444444', category: 'color' },
  { id: 'nord', name: 'Nord', bgColor: '#2E3440', textColor: '#D8DEE9', accentColor: '#88C0D0', category: 'color' },
  { id: 'solarized', name: 'Solarized', bgColor: '#002B36', textColor: '#93A1A1', accentColor: '#2AA198', category: 'color' },
  { id: 'matrix', name: 'Matrix', bgColor: '#0D0D0D', textColor: '#00FF41', accentColor: '#008F11', category: 'color' },
  { id: 'dracula', name: 'Dracula', bgColor: '#282A36', textColor: '#F8F8F2', accentColor: '#BD93F9', category: 'color' },
  { id: 'monokai', name: 'Monokai', bgColor: '#272822', textColor: '#F8F8F2', accentColor: '#F92672', category: 'color' },
  { id: 'gruvbox', name: 'Gruvbox', bgColor: '#282828', textColor: '#EBDBB2', accentColor: '#FE8019', category: 'color' },
  { id: 'tokyo-night', name: 'Tokyo Night', bgColor: '#1A1B26', textColor: '#A9B1D6', accentColor: '#7AA2F7', category: 'color' },
  { id: 'catppuccin', name: 'Catppuccin', bgColor: '#1E1E2E', textColor: '#CDD6F4', accentColor: '#F5C2E7', category: 'color' },
  { id: 'one-dark', name: 'One Dark', bgColor: '#282C34', textColor: '#ABB2BF', accentColor: '#61AFEF', category: 'color' },
  { id: 'rose-pine', name: 'Rosé Pine', bgColor: '#191724', textColor: '#E0DEF4', accentColor: '#EBBCBA', category: 'color' },
  { id: 'everforest', name: 'Everforest', bgColor: '#2D353B', textColor: '#D3C6AA', accentColor: '#A7C080', category: 'color' },
  // Animated Themes
  { id: 'cyberpunk', name: 'Cyberpunk', bgColor: '#0a0a0f', textColor: '#00f0ff', accentColor: '#ff00ff', category: 'animated' },
  { id: 'aurora', name: 'Aurora', bgColor: '#0f0c29', textColor: '#ffffff', accentColor: '#a855f7', category: 'animated' },
  { id: 'synthwave', name: 'Synthwave', bgColor: '#1a1a2e', textColor: '#eaeaea', accentColor: '#e94560', category: 'animated' },
  { id: 'vaporwave', name: 'Vaporwave', bgColor: '#1a0a2e', textColor: '#ff71ce', accentColor: '#01cdfe', category: 'animated' },
  // Special Effect Themes
  { id: 'retro-terminal', name: 'Retro CRT', bgColor: '#0a0a0a', textColor: '#33ff33', accentColor: '#33ff33', category: 'special' },
  { id: 'sunset', name: 'Sunset', bgColor: '#1a1423', textColor: '#ffecd2', accentColor: '#fcb69f', category: 'special' },
  { id: 'ocean', name: 'Ocean', bgColor: '#0c1821', textColor: '#ccd6f6', accentColor: '#64ffda', category: 'special' },
  { id: 'midnight', name: 'Midnight', bgColor: '#020617', textColor: '#e2e8f0', accentColor: '#6366f1', category: 'special' },
]

interface SettingsPanelProps {
  settings: SettingsType
  onSettingsChange: (settings: SettingsType) => void
  onAddCategory: (name: string) => void
}

export function SettingsPanel({ settings, onSettingsChange, onAddCategory }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localSettings, setLocalSettings] = useState<SettingsType>(settings)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isInverted, setIsInverted] = useState(false)

  // Sync local settings when panel opens or settings change externally
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings)
    }
  }, [isOpen, settings])

  // Re-convert when inverted state changes or new file uploaded
  useEffect(() => {
    if (uploadedFile) {
      convertImageToAscii(uploadedFile, 50, isInverted)
        .then(ascii => {
          setLocalSettings(prev => ({ ...prev, asciiArt: ascii }))
        })
        .catch(err => console.error('Failed to convert image', err))
    }
  }, [isInverted, uploadedFile])

  const handleChange = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onSettingsChange(localSettings)
    setIsOpen(false)
  }

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim())
      setNewCategoryName('')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  return (
    <>
      <button 
        className='settings-toggle'
        onClick={() => setIsOpen(true)}
        title='Settings'
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <div className='settings-overlay' onClick={() => setIsOpen(false)}>
          <div className='settings-panel theme-selector-panel' onClick={e => e.stopPropagation()}>
            <div className='settings-header'>
              <div className='settings-title'>
                <Palette size={20} />
                <h3>Theme Selector</h3>
              </div>
              <button className='close-btn' onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className='settings-content'>
              {/* Theme Selection Grid */}
              <div className='setting-item'>
                <label className='section-label'>COLOR THEMES</label>
                <div className='theme-grid'>
                  {THEMES.filter(t => t.category === 'color').map(theme => (
                    <div 
                      key={theme.id}
                      className={`theme-card ${localSettings.theme === theme.id ? 'active' : ''}`}
                      onClick={() => handleChange('theme', theme.id)}
                    >
                      <div 
                        className='theme-preview'
                        style={{ 
                          backgroundColor: theme.bgColor,
                          borderColor: localSettings.theme === theme.id ? theme.accentColor : 'transparent'
                        }}
                      >
                        <div className='theme-preview-lines'>
                          <div className='preview-line' style={{ backgroundColor: theme.accentColor, width: '60%' }}></div>
                          <div className='preview-line' style={{ backgroundColor: theme.textColor, width: '80%', opacity: 0.3 }}></div>
                          <div className='preview-line' style={{ backgroundColor: theme.textColor, width: '40%', opacity: 0.3 }}></div>
                        </div>
                        <div className='theme-preview-dot' style={{ backgroundColor: theme.accentColor }}></div>
                        {localSettings.theme === theme.id && (
                          <div className='theme-check' style={{ backgroundColor: theme.accentColor }}>
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                      <div className='theme-info'>
                        <span className='theme-name'>{theme.name}</span>
                        {localSettings.theme === theme.id && <span className='theme-active-badge'>ACTIVE</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='setting-item'>
                <label className='section-label'>✨ ANIMATED THEMES</label>
                <div className='theme-grid'>
                  {THEMES.filter(t => t.category === 'animated').map(theme => (
                    <div 
                      key={theme.id}
                      className={`theme-card ${localSettings.theme === theme.id ? 'active' : ''}`}
                      onClick={() => handleChange('theme', theme.id)}
                    >
                      <div 
                        className={`theme-preview theme-preview-animated ${theme.id}`}
                        style={{ 
                          backgroundColor: theme.bgColor,
                          borderColor: localSettings.theme === theme.id ? theme.accentColor : 'transparent'
                        }}
                      >
                        <div className='theme-preview-lines'>
                          <div className='preview-line' style={{ backgroundColor: theme.accentColor, width: '60%' }}></div>
                          <div className='preview-line' style={{ backgroundColor: theme.textColor, width: '80%', opacity: 0.3 }}></div>
                          <div className='preview-line' style={{ backgroundColor: theme.textColor, width: '40%', opacity: 0.3 }}></div>
                        </div>
                        <div className='theme-preview-dot' style={{ backgroundColor: theme.accentColor }}></div>
                        {localSettings.theme === theme.id && (
                          <div className='theme-check' style={{ backgroundColor: theme.accentColor }}>
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                      <div className='theme-info'>
                        <span className='theme-name'>{theme.name}</span>
                        {localSettings.theme === theme.id && <span className='theme-active-badge'>ACTIVE</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='setting-item'>
                <label className='section-label'>🎨 SPECIAL EFFECTS</label>
                <div className='theme-grid'>
                  {THEMES.filter(t => t.category === 'special').map(theme => (
                    <div 
                      key={theme.id}
                      className={`theme-card ${localSettings.theme === theme.id ? 'active' : ''}`}
                      onClick={() => handleChange('theme', theme.id)}
                    >
                      <div 
                        className={`theme-preview theme-preview-special ${theme.id}`}
                        style={{ 
                          backgroundColor: theme.bgColor,
                          borderColor: localSettings.theme === theme.id ? theme.accentColor : 'transparent'
                        }}
                      >
                        <div className='theme-preview-lines'>
                          <div className='preview-line' style={{ backgroundColor: theme.accentColor, width: '60%' }}></div>
                          <div className='preview-line' style={{ backgroundColor: theme.textColor, width: '80%', opacity: 0.3 }}></div>
                          <div className='preview-line' style={{ backgroundColor: theme.textColor, width: '40%', opacity: 0.3 }}></div>
                        </div>
                        <div className='theme-preview-dot' style={{ backgroundColor: theme.accentColor }}></div>
                        {localSettings.theme === theme.id && (
                          <div className='theme-check' style={{ backgroundColor: theme.accentColor }}>
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                      <div className='theme-info'>
                        <span className='theme-name'>{theme.name}</span>
                        {localSettings.theme === theme.id && <span className='theme-active-badge'>ACTIVE</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='settings-columns'>
                {/* Left Column - User Settings */}
                <div className='settings-column'>
                  <label className='section-label'>USER IDENTIFIER</label>
                  <input
                    id='userName'
                    type='text'
                    value={localSettings.userName}
                    onChange={e => handleChange('userName', e.target.value)}
                    className='setting-input'
                    placeholder='Your Name'
                  />
                </div>

                {/* Right Column - System Preferences */}
                <div className='settings-column'>
                  <label className='section-label'>SYSTEM PREFERENCES</label>
                  <div className='checkbox-group'>
                    <label className="checkbox-label">
                      <span>Show Status Bar</span>
                      <input
                        type='checkbox'
                        checked={localSettings.showStatusBar}
                        onChange={e => handleChange('showStatusBar', e.target.checked)}
                        className="custom-checkbox"
                      />
                    </label>
                    <label className="checkbox-label">
                      <span>Show Greeting</span>
                      <input
                        type='checkbox'
                        checked={localSettings.showGreeting}
                        onChange={e => handleChange('showGreeting', e.target.checked)}
                        className="custom-checkbox"
                      />
                    </label>
                    <label className="checkbox-label">
                      <span>Show Clock</span>
                      <input
                        type='checkbox'
                        checked={localSettings.showClock}
                        onChange={e => handleChange('showClock', e.target.checked)}
                        className="custom-checkbox"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* ASCII Art Section - Collapsible */}
              <details className='ascii-section'>
                <summary className='section-label'>ASCII ART SETTINGS</summary>
                <div className='ascii-content'>
                  <div className='ascii-controls'>
                    <label className='file-upload-btn'>
                      <Upload size={16} />
                      <span>Upload Image</span>
                      <input 
                        type='file' 
                        accept='image/*' 
                        onChange={handleImageUpload}
                        className='hidden-input'
                      />
                    </label>
                    <label className='checkbox-label'>
                      <input
                        type='checkbox'
                        checked={isInverted}
                        onChange={e => setIsInverted(e.target.checked)}
                        className="custom-checkbox"
                      />
                      <span>Invert</span>
                    </label>
                  </div>
                  
                  <div className='ascii-edit-container'>
                    <label className="sub-label">Edit / Paste Custom ASCII:</label>
                    <textarea
                      className='ascii-editor'
                      value={localSettings.asciiArt || ''}
                      onChange={e => handleChange('asciiArt', e.target.value)}
                      placeholder="Paste your ASCII art here..."
                      spellCheck={false}
                    />
                  </div>
                </div>
              </details>

              <div className='setting-divider'></div>

              <div className='setting-item'>
                <label className='section-label'>Add New Category</label>
                <div className='add-category-form'>
                  <input
                    type='text'
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder='Category name'
                    className='setting-input'
                  />
                  <button className='add-category-settings-btn' onClick={handleAddCategory}>
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className='settings-footer'>
              <button className='apply-btn primary' onClick={handleSave}>
                <Save size={16} />
                Save & Apply
              </button>
              <button className='apply-btn secondary' onClick={() => setIsOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
