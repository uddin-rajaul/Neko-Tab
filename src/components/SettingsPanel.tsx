import { useState, useEffect } from 'react'
import { Settings, X, Moon, Sun, Plus, Check, Upload } from 'lucide-react'
import type { Settings as SettingsType } from '../types'
import { convertImageToAscii } from '../utils/imageToAscii'

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
          <div className='settings-panel' onClick={e => e.stopPropagation()}>
            <div className='settings-header'>
              <h3>Settings</h3>
              <button className='close-btn' onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className='settings-content'>
              <div className='setting-item'>
                <label htmlFor='userName'>Your Name</label>
                <input
                  id='userName'
                  type='text'
                  value={localSettings.userName}
                  onChange={e => handleChange('userName', e.target.value)}
                  className='setting-input'
                />
              </div>

              <div className='setting-item'>
                <label>Theme</label>
                <button 
                  className='theme-toggle-btn'
                  onClick={() => handleChange('theme', localSettings.theme === 'dark' ? 'light' : 'dark')}
                >
                  {localSettings.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                  <span>{localSettings.theme === 'dark' ? 'Dark' : 'Light'}</span>
                </button>
              </div>

              <div className='setting-item'>
                <label>Clock Format</label>
                <div className='radio-group'>
                  <label className={`radio-label ${localSettings.clockFormat === '12h' ? 'active' : ''}`}>
                    <input
                      type='radio'
                      name='clockFormat'
                      value='12h'
                      checked={localSettings.clockFormat === '12h'}
                      onChange={() => handleChange('clockFormat', '12h')}
                    />
                    12h
                  </label>
                  <label className={`radio-label ${localSettings.clockFormat === '24h' ? 'active' : ''}`}>
                    <input
                      type='radio'
                      name='clockFormat'
                      value='24h'
                      checked={localSettings.clockFormat === '24h'}
                      onChange={() => handleChange('clockFormat', '24h')}
                    />
                    24h
                  </label>
                </div>
              </div>

              <div className='setting-item'>
                <label>ASCII Art</label>
                <div className='file-upload-wrapper' style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                  <label className='checkbox-label' style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input
                      type='checkbox'
                      checked={isInverted}
                      onChange={e => setIsInverted(e.target.checked)}
                    />
                    Invert
                  </label>
                </div>
                
                <div className='ascii-edit-container' style={{ marginTop: '10px' }}>
                  <label style={{ fontSize: '0.8em', marginBottom: '5px', display: 'block', color: 'var(--ash)' }}>Edit / Paste Custom ASCII:</label>
                  <textarea
                    className='ascii-editor'
                    value={localSettings.asciiArt || ''}
                    onChange={e => handleChange('asciiArt', e.target.value)}
                    placeholder="Paste your ASCII art here..."
                    spellCheck={false}
                    style={{ 
                      width: '100%', 
                      height: '150px', 
                      fontFamily: 'monospace', 
                      fontSize: '10px',
                      backgroundColor: 'var(--jet-black)',
                      color: 'var(--platinum)',
                      border: '1px solid var(--border-color)',
                      padding: '8px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div className='setting-item'>
                <label>
                  <input
                    type='checkbox'
                    checked={localSettings.showGreeting}
                    onChange={e => handleChange('showGreeting', e.target.checked)}
                  />
                  Show Greeting
                </label>
              </div>

              <div className='setting-item'>
                <label>
                  <input
                    type='checkbox'
                    checked={localSettings.showClock}
                    onChange={e => handleChange('showClock', e.target.checked)}
                  />
                  Show Clock
                </label>
              </div>

              <div className='setting-divider'></div>

              <div className='setting-item'>
                <label>Add New Category</label>
                <div className='add-category-form'>
                  <input
                    type='text'
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                    placeholder='Category name'
                    className='setting-input'
                  />
                  <button 
                    className='add-category-settings-btn'
                    onClick={handleAddCategory}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className='settings-footer'>
              <button className='apply-btn' onClick={handleSave}>
                <Check size={16} />
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
