import { useState, useEffect } from 'react'
import { Settings, X, Plus, Check, Upload, Palette, Save, Monitor, Terminal, LayoutGrid, Hash, Trash2, Download, Cpu, AlertTriangle, Plug } from 'lucide-react'
import type { Settings as SettingsType, ThemeInfo, UrlAlias } from '../types'
import { convertImageToAscii } from '../utils/imageToAscii'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useGoogleCalendar } from '../hooks/useGoogleCalendar'

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

const FONTS = [
  { id: 'jetbrains-mono',  name: 'JetBrains Mono',  family: 'JetBrains Mono' },
  { id: 'geist-mono',      name: 'Geist Mono',       family: 'Geist Mono' },
  { id: 'space-mono',      name: 'Space Mono',       family: 'Space Mono' },
  { id: 'fira-code',       name: 'Fira Code',        family: 'Fira Code' },
  { id: 'cascadia-code',   name: 'Cascadia Code',    family: 'Cascadia Code' },
  { id: 'ibm-plex-mono',   name: 'IBM Plex Mono',    family: 'IBM Plex Mono' },
  { id: 'intel-one-mono',  name: 'Intel One Mono',   family: 'Intel One Mono' },
  { id: 'iosevka',         name: 'Iosevka',          family: 'Iosevka' },
  { id: 'commit-mono',     name: 'Commit Mono',      family: 'Commit Mono' },
  { id: 'source-code-pro', name: 'Source Code Pro',  family: 'Source Code Pro' },
  { id: 'inconsolata',     name: 'Inconsolata',      family: 'Inconsolata' },
  { id: 'hack',            name: 'Hack',             family: 'Hack' },
]

interface SettingsPanelProps {
  settings: SettingsType
  onSettingsChange: (settings: SettingsType) => void
  onAddCategory: (name: string) => void
}

type TabType = 'appearance' | 'preferences' | 'ascii' | 'widgets' | 'aliases' | 'integrations' | 'backup' | 'advanced';
function GoogleCalendarSettings({ 
  showGoogleCalendar, 
  lookahead,
  onChange,
  onLookaheadChange 
}: { 
  showGoogleCalendar: boolean, 
  lookahead: number,
  onChange: (val: boolean) => void,
  onLookaheadChange: (val: number) => void
}) {
  const { isConnected, connect, disconnect, error } = useGoogleCalendar(false);
  const isExtension = typeof chrome !== 'undefined' && !!chrome.identity;

  return (
    <div className='saas-card'>
      <label className='saas-label'>Google Calendar</label>

      {!isExtension && (
        <div className='saas-hint' style={{ color: '#ffb300', marginBottom: 16, border: '1px solid rgba(255, 179, 0, 0.2)', padding: '8px', borderRadius: '4px' }}>
          Identity API not detected. Please make sure this is running as a loaded extension in Chrome.
        </div>
      )}

      <div className='saas-toggle-list' style={{ marginBottom: 12 }}>
        <div className="saas-toggle-row">
          <span className="saas-toggle-label">Show upcoming event on home page</span>
          <button 
            className={`saas-toggle-btn ${showGoogleCalendar ? 'active' : ''}`}
            onClick={() => onChange(!showGoogleCalendar)}
            disabled={!isConnected}
            style={{ opacity: !isConnected ? 0.5 : 1, cursor: !isConnected ? 'not-allowed' : 'pointer' }}
          >
            <div className="saas-toggle-thumb" />
          </button>
        </div>
        </div>

        {isConnected && (
        <div className='saas-flex-row' style={{ marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="saas-label" style={{ margin: 0 }}>Show events within:</span>
          <select 
            className='saas-input' 
            style={{ width: 'auto', padding: '4px 8px', height: '32px' }}
            value={lookahead}
            onChange={(e) => onLookaheadChange(Number(e.target.value))}
          >
            <option value={60}>1 hour</option>
            <option value={360}>6 hours</option>
            <option value={4320}>3 days</option>
            <option value={10080}>7 days</option>
            <option value={14400}>10 days</option>
          </select>
        </div>
        )}

        {!isConnected ? (        <div>
          <p className='saas-hint' style={{ marginBottom: 12 }}>Connect your Google account to see your next upcoming event.</p>
          <button className='saas-btn-primary' onClick={connect}>
            Connect Google Calendar
          </button>
        </div>
      ) : (
        <div>
          <p className='saas-hint' style={{ marginBottom: 12, color: 'var(--accent-color)' }}>✓ Connected to Google Calendar</p>
          <button className='saas-btn-secondary' onClick={disconnect}>
            Disconnect
          </button>
        </div>
      )}

      {error && (
        <p className='saas-hint' style={{ marginTop: 12, color: '#ff4444' }}>Error: {error}</p>
      )}
    </div>
  );
}

export function SettingsPanel({ settings, onSettingsChange, onAddCategory }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('appearance')
  const [localSettings, setLocalSettings] = useState<SettingsType>(settings)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isInverted, setIsInverted] = useState(false)
  const [bgImage, setBgImage] = useLocalStorage<string>('neko-bg-image', '')
  const [aliases, setAliases] = useLocalStorage<UrlAlias[]>('neko-aliases', [])
  const [aliasKey, setAliasKey] = useState('')
  const [aliasUrl, setAliasUrl] = useState('')

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
          setLocalSettings(prev => ({ ...prev, customAsciiArt: ascii }))
        })
        .catch(err => console.error('Failed to convert image', err))
    }
  }, [isInverted, uploadedFile])

  // Background settings write-through immediately so preview is live
  const BG_LIVE_KEYS = new Set<keyof SettingsType>(['bgDim', 'bgBlur'])

  const handleChange = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
    if (BG_LIVE_KEYS.has(key)) {
      onSettingsChange({ ...localSettings, [key]: value })
    }
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

  const handleResetData = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset ALL data? This will delete your bookmarks, notes, and settings. This cannot be undone.'
    )

    if (!confirmed) return

    localStorage.clear()

    const reload = () => window.location.reload()

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.clear(reload)
      return
    }

    reload()
  }

  const renderToggle = (label: string, checked: boolean, onChange: (val: boolean) => void) => (
    <div className="saas-toggle-row">
      <span className="saas-toggle-label">{label}</span>
      <button 
        className={`saas-toggle-btn ${checked ? 'active' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <div className="saas-toggle-thumb" />
      </button>
    </div>
  )

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
          <div className='saas-modal' onClick={e => e.stopPropagation()}>
            <button className='saas-close-btn top-right' onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
            {/* Sidebar Navigation */}
            <div className='saas-sidebar'>
              <div className='saas-sidebar-header'>
                <Settings size={18} />
                <span>Settings</span>
              </div>
              <nav className='saas-nav'>
                <button 
                  className={`saas-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('appearance')}
                >
                  <Palette size={16} /> Appearance
                </button>
                <button 
                  className={`saas-nav-item ${activeTab === 'preferences' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preferences')}
                >
                  <Monitor size={16} /> Preferences
                </button>
                <button 
                  className={`saas-nav-item ${activeTab === 'ascii' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ascii')}
                >
                  <Terminal size={16} /> ASCII Art
                </button>
                <button 
                  className={`saas-nav-item ${activeTab === 'widgets' ? 'active' : ''}`}
                  onClick={() => setActiveTab('widgets')}
                >
                  <LayoutGrid size={16} /> Widgets
                </button>
                <button
                  className={`saas-nav-item ${activeTab === 'aliases' ? 'active' : ''}`}
                  onClick={() => setActiveTab('aliases')}
                >
                  <Hash size={16} /> Aliases
                </button>
                <button
                  className={`saas-nav-item ${activeTab === 'integrations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('integrations')}
                >
                  <Plug size={16} /> Integrations
                </button>
                <button
                  className={`saas-nav-item ${activeTab === 'backup' ? 'active' : ''}`}
                  onClick={() => setActiveTab('backup')}
                >
                  <Download size={16} /> Export/Import
                </button>
                <button
                  className={`saas-nav-item ${activeTab === 'advanced' ? 'active' : ''}`}
                  onClick={() => setActiveTab('advanced')}
                >
                  <Cpu size={16} /> Advanced
                </button>
              </nav>
            </div>

            {/* Main Content Area */}
            <div className='saas-main'>
              <div className='saas-main-header'>
                <h3 className='saas-title'>
                  {activeTab === 'appearance' && 'Theme & Appearance'}
                  {activeTab === 'preferences' && 'System Preferences'}
                  {activeTab === 'ascii' && 'Custom ASCII Art'}
                  {activeTab === 'widgets' && 'Widgets & Background'}
                  {activeTab === 'aliases' && 'URL Aliases'}
                  {activeTab === 'integrations' && 'Integrations'}
                  {activeTab === 'backup' && 'Backup & Restore'}
                  {activeTab === 'advanced' && 'Advanced Settings'}
                </h3>
              </div>

              <div className='saas-content-scroll' key={activeTab}>
                {/* APPEARANCE TAB */}
                {activeTab === 'appearance' && (
                  <div className='saas-section'>
                    <div className='saas-section-group'>
                      <label className='saas-section-label'>COLOR THEMES</label>
                      <div className='saas-theme-grid'>
                        {THEMES.filter(t => t.category === 'color').map(theme => (
                          <div 
                            key={theme.id}
                            className={`saas-theme-card ${localSettings.theme === theme.id ? 'active' : ''}`}
                            onClick={() => handleChange('theme', theme.id)}
                          >
                            <div 
                              className='theme-preview'
                              style={{ 
                                backgroundColor: theme.bgColor,
                                borderColor: localSettings.theme === theme.id ? theme.accentColor : 'rgba(255,255,255,0.05)'
                              }}
                            >
                              <div className='theme-preview-lines'>
                                <div className='preview-line' style={{ backgroundColor: theme.accentColor, width: '60%' }}></div>
                                <div className='preview-line' style={{ backgroundColor: theme.textColor, width: '80%', opacity: 0.3 }}></div>
                              </div>
                              <div className='theme-preview-dot' style={{ backgroundColor: theme.accentColor }}></div>
                              {localSettings.theme === theme.id && (
                                <div className='theme-check' style={{ backgroundColor: theme.accentColor }}>
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              )}
                            </div>
                            <span className='theme-name'>{theme.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className='saas-section-group'>
                      <label className='saas-section-label'>ANIMATED THEMES</label>
                      <div className='saas-theme-grid'>
                        {THEMES.filter(t => t.category === 'animated').map(theme => (
                          <div 
                            key={theme.id}
                            className={`saas-theme-card ${localSettings.theme === theme.id ? 'active' : ''}`}
                            onClick={() => handleChange('theme', theme.id)}
                          >
                            <div 
                              className={`theme-preview theme-preview-animated ${theme.id}`}
                              style={{ 
                                backgroundColor: theme.bgColor,
                                borderColor: localSettings.theme === theme.id ? theme.accentColor : 'rgba(255,255,255,0.05)'
                              }}
                            >
                              <div className='theme-preview-lines'>
                                <div className='preview-line' style={{ backgroundColor: theme.accentColor, width: '60%' }}></div>
                                <div className='preview-line' style={{ backgroundColor: theme.textColor, width: '80%', opacity: 0.3 }}></div>
                              </div>
                              <div className='theme-preview-dot' style={{ backgroundColor: theme.accentColor }}></div>
                              {localSettings.theme === theme.id && (
                                <div className='theme-check' style={{ backgroundColor: theme.accentColor }}>
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              )}
                            </div>
                            <span className='theme-name'>{theme.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className='saas-section-group'>
                      <label className='saas-section-label'>SPECIAL EFFECTS</label>
                      <div className='saas-theme-grid'>
                        {THEMES.filter(t => t.category === 'special').map(theme => (
                          <div 
                            key={theme.id}
                            className={`saas-theme-card ${localSettings.theme === theme.id ? 'active' : ''}`}
                            onClick={() => handleChange('theme', theme.id)}
                          >
                            <div 
                              className={`theme-preview theme-preview-special ${theme.id}`}
                              style={{ 
                                backgroundColor: theme.bgColor,
                                borderColor: localSettings.theme === theme.id ? theme.accentColor : 'rgba(255,255,255,0.05)'
                              }}
                            >
                              <div className='theme-preview-lines'>
                                <div className='preview-line' style={{ backgroundColor: theme.accentColor, width: '60%' }}></div>
                                <div className='preview-line' style={{ backgroundColor: theme.textColor, width: '80%', opacity: 0.3 }}></div>
                              </div>
                              <div className='theme-preview-dot' style={{ backgroundColor: theme.accentColor }}></div>
                              {localSettings.theme === theme.id && (
                                <div className='theme-check' style={{ backgroundColor: theme.accentColor }}>
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              )}
                            </div>
                            <span className='theme-name'>{theme.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className='saas-section-group'>
                      <label className='saas-section-label'>FONT FAMILY</label>
                      <div className='saas-theme-grid'>
                        {(() => {
                          const currentTheme = THEMES.find(t => t.id === localSettings.theme) || THEMES[0];
                          return FONTS.map(font => {
                            const isFontActive = localSettings.font === font.family;
                            
                            return (
                              <div 
                                key={font.id}
                                className={`saas-theme-card ${isFontActive ? 'active' : ''}`}
                                onClick={() => handleChange('font', font.family)}
                              >
                                <div 
                                  className='theme-preview'
                                  style={{ 
                                    backgroundColor: currentTheme.bgColor,
                                    borderColor: isFontActive ? currentTheme.accentColor : 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontFamily: `'${font.family}', monospace`,
                                    fontSize: '20px',
                                    color: currentTheme.textColor,
                                    overflow: 'hidden'
                                  }}
                                >
                                  <div style={{ opacity: 0.9 }}>Abc</div>
                                  {isFontActive && (
                                    <div className='theme-check' style={{ backgroundColor: currentTheme.accentColor }}>
                                      <Check size={12} strokeWidth={3} />
                                    </div>
                                  )}
                                </div>
                                <span className='theme-name'>{font.name}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* PREFERENCES TAB */}
                {activeTab === 'preferences' && (
                  <div className='saas-section'>
                    <div className='saas-card'>
                      <label className='saas-label'>User Identifier</label>
                      <input
                        id='userName'
                        type='text'
                        value={localSettings.userName}
                        onChange={e => handleChange('userName', e.target.value)}
                        className='saas-input'
                        placeholder='Enter your display name'
                      />
                    </div>

                    <div className='saas-card'>
                      <label className='saas-label'>Display Options</label>
                      <div className='saas-toggle-list'>
                        {renderToggle('Show Status Bar', localSettings.showStatusBar, val => handleChange('showStatusBar', val))}
                        {localSettings.showStatusBar && renderToggle('Show Tab Counter', localSettings.showTabCounter ?? true, val => handleChange('showTabCounter', val))}
                        {renderToggle('Show Greeting', localSettings.showGreeting, val => handleChange('showGreeting', val))}
                        {renderToggle('Show Clock', localSettings.showClock, val => handleChange('showClock', val))}
                      </div>
                    </div>

                    <div className='saas-card'>
                      <label className='saas-label'>Clock Format</label>
                      <div className='saas-segmented-control'>
                        <button 
                          className={`saas-segment ${localSettings.clockFormat === '12h' ? 'active' : ''}`}
                          onClick={() => handleChange('clockFormat', '12h')}
                        >
                          12-Hour
                        </button>
                        <button 
                          className={`saas-segment ${localSettings.clockFormat === '24h' ? 'active' : ''}`}
                          onClick={() => handleChange('clockFormat', '24h')}
                        >
                          24-Hour
                        </button>
                      </div>
                    </div>

                    <div className='saas-card'>
                      <label className='saas-label'>Add New Category</label>
                      <div className='saas-flex-row'>
                        <input
                          type='text'
                          value={newCategoryName}
                          onChange={e => setNewCategoryName(e.target.value)}
                          placeholder='e.g., Development'
                          className='saas-input'
                        />
                        <button className='saas-btn-icon' onClick={handleAddCategory}>
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ASCII ART TAB */}
                {activeTab === 'ascii' && (
                  <div className='saas-section'>
                    <div className='saas-card'>
                      <label className='saas-label'>ASCII Art Source</label>
                      <div className='saas-segmented-control'>
                        <button 
                          className={`saas-segment ${localSettings.asciiArtSource === 'os' ? 'active' : ''}`}
                          onClick={() => handleChange('asciiArtSource', 'os')}
                        >
                          System OS
                        </button>
                        <button 
                          className={`saas-segment ${localSettings.asciiArtSource === 'cat' ? 'active' : ''}`}
                          onClick={() => handleChange('asciiArtSource', 'cat')}
                        >
                          Neko Cat
                        </button>
                        <button 
                          className={`saas-segment ${localSettings.asciiArtSource === 'custom' ? 'active' : ''}`}
                          onClick={() => handleChange('asciiArtSource', 'custom')}
                        >
                          Custom
                        </button>
                      </div>
                    </div>

                    {localSettings.asciiArtSource === 'os' && (
                      <div className='saas-card'>
                        <p className='saas-hint'>System OS ASCII art is selected (automatically matches your operating system).</p>
                      </div>
                    )}

                    {localSettings.asciiArtSource === 'custom' && (
                      <>
                        <div className='saas-card'>
                          <label className='saas-label'>Image to ASCII Converter</label>
                          <label className='saas-upload-area'>
                            <Upload size={24} className="saas-upload-icon" />
                            <span className="saas-upload-text">Click to upload image</span>
                            <input 
                              type='file' 
                              accept='image/*' 
                              onChange={handleImageUpload}
                              className='saas-hidden-file'
                            />
                          </label>
                          <div className='saas-upload-options'>
                            {renderToggle('Invert Colors', isInverted, setIsInverted)}
                          </div>
                        </div>

                        <div className='saas-card'>
                          <label className='saas-label'>Custom ASCII Input</label>
                          <textarea
                            className='saas-textarea'
                            value={localSettings.customAsciiArt ?? localSettings.asciiArt ?? ''}
                            onChange={e => handleChange('customAsciiArt', e.target.value)}
                            placeholder="Paste your custom ASCII art here..."
                            spellCheck={false}
                            rows={10}
                          />
                        </div>
                      </>
                    )}

                    {localSettings.asciiArtSource === 'cat' && (
                      <div className='saas-card'>
                        <p className='saas-hint'>The classic Neko Cat ASCII art is selected.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* WIDGETS TAB */}
                {activeTab === 'widgets' && (
                  <div className='saas-section'>
                    <div className='saas-card'>
                      <label className='saas-label'>Custom Background</label>
                      <label className='saas-upload-area'>
                        <Upload size={24} className="saas-upload-icon" />
                        <span className="saas-upload-text">
                          {bgImage ? 'Click to change background' : 'Click to upload background image'}
                        </span>
                        <input
                          type='file' accept='image/*' className='saas-hidden-file'
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const reader = new FileReader()
                            reader.onload = ev => setBgImage(ev.target?.result as string ?? '')
                            reader.readAsDataURL(file)
                          }}
                        />
                      </label>
                      {bgImage && (
                        <button className='saas-btn-secondary' style={{ marginTop: 8, fontSize: 12 }} onClick={() => setBgImage('')}>
                          Remove background
                        </button>
                      )}
                      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <label className='saas-label' style={{ marginBottom: 6 }}>Dim overlay — {localSettings.bgDim ?? 40}%</label>
                          <input type='range' min={0} max={90} step={5}
                            value={localSettings.bgDim ?? 40}
                            onChange={e => handleChange('bgDim', Number(e.target.value))}
                            className='saas-range' />
                        </div>
                        <div>
                          <label className='saas-label' style={{ marginBottom: 6 }}>Background blur — {localSettings.bgBlur ?? 0}px</label>
                          <input type='range' min={0} max={10} step={1}
                            value={localSettings.bgBlur ?? 0}
                            onChange={e => handleChange('bgBlur', Number(e.target.value))}
                            className='saas-range' />
                        </div>
                      </div>
                    </div>

                    <div className='saas-card'>
                      <label className='saas-label'>Daily Goal</label>
                      <div className='saas-toggle-list'>
                        {renderToggle('Show daily goal', localSettings.showDailyGoal ?? true, val => handleChange('showDailyGoal', val))}
                      </div>
                      <p className='saas-hint'>A single focus line below the clock. Resets at midnight.</p>
                    </div>

                    <div className='saas-card'>
                      <label className='saas-label'>GitHub Streak</label>
                      <div className='saas-toggle-list'>
                        {renderToggle('Show in status bar', localSettings.showGitHubStreak ?? false, val => handleChange('showGitHubStreak', val))}
                      </div>
                      <input type='text'
                        value={localSettings.githubUsername ?? ''}
                        onChange={e => handleChange('githubUsername', e.target.value)}
                        placeholder='GitHub username' className='saas-input' style={{ marginTop: 12 }} />
                      <p className='saas-hint'>Uses the public contributions API. No auth needed.</p>
                    </div>
                  </div>
                )}
                {/* ALIASES TAB */}
                {activeTab === 'aliases' && (
                  <div className='saas-section'>
                    <div className='saas-card'>
                      <label className='saas-label'>Add Alias</label>
                      <div className='saas-flex-row' style={{ gap: 8 }}>
                        <input type='text' className='saas-input alias-key-input'
                          value={aliasKey} onChange={e => setAliasKey(e.target.value.toLowerCase().replace(/\s/g, ''))}
                          placeholder='key  e.g. gh' maxLength={20} />
                        <input type='text' className='saas-input'
                          value={aliasUrl} onChange={e => setAliasUrl(e.target.value)}
                          placeholder='url  e.g. https://github.com/raj'
                          onKeyDown={e => {
                            if (e.key === 'Enter' && aliasKey && aliasUrl) {
                              setAliases(prev => [...prev.filter(a => a.key !== aliasKey), { key: aliasKey, url: aliasUrl }])
                              setAliasKey(''); setAliasUrl('')
                            }
                          }} />
                        <button className='saas-btn-icon' onClick={() => {
                          if (!aliasKey || !aliasUrl) return
                          setAliases(prev => [...prev.filter(a => a.key !== aliasKey), { key: aliasKey, url: aliasUrl }])
                          setAliasKey(''); setAliasUrl('')
                        }}><Plus size={18} /></button>
                      </div>
                      <p className='saas-hint'>Type the key in the search bar (Ctrl+K) to jump instantly. Also works as a shell alias in the search bar.</p>
                    </div>
                    {aliases.length > 0 && (
                      <div className='saas-card'>
                        <label className='saas-label'>Saved Aliases</label>
                        <div className='alias-list'>
                          {aliases.map(a => (
                            <div key={a.key} className='alias-row'>
                              <span className='alias-key'>{a.key}</span>
                              <span className='alias-arrow'>→</span>
                              <span className='alias-url'>{a.url}</span>
                              <button className='alias-delete' onClick={() => setAliases(prev => prev.filter(x => x.key !== a.key))}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* INTEGRATIONS TAB */}
                {activeTab === 'integrations' && (
                  <div className='saas-section'>
                    <GoogleCalendarSettings 
                      showGoogleCalendar={localSettings.showGoogleCalendar ?? false} 
                      lookahead={localSettings.googleCalendarLookahead ?? 4320}
                      onChange={(val) => handleChange('showGoogleCalendar', val)} 
                      onLookaheadChange={(val) => handleChange('googleCalendarLookahead', val)}
                    />
                  </div>
                )}

                {/* BACKUP TAB */}
                {activeTab === 'backup' && (
                  <div className='saas-section'>
                    <div className='saas-card'>
                      <label className='saas-label'>Export Settings</label>
                      <p className='saas-hint' style={{ marginBottom: 12 }}>
                        Download all your settings, bookmarks, and local data as a JSON file.
                      </p>
                      <button className='saas-btn-primary' onClick={() => import('../utils/backup').then(m => m.exportSettings())} style={{ width: '100%' }}>
                        <Download size={16} /> Export to JSON
                      </button>
                    </div>

                    <div className='saas-card'>
                      <label className='saas-label'>Import Settings</label>
                      <p className='saas-hint' style={{ marginBottom: 12 }}>
                        Upload a previously exported JSON file to restore your settings. 
                        <span style={{ color: '#ff4444', display: 'block', marginTop: 4 }}>
                          Warning: This will overwrite all your current data!
                        </span>
                      </p>
                      <label className='saas-upload-area'>
                        <Upload size={24} className="saas-upload-icon" />
                        <span className="saas-upload-text">Click to upload backup file</span>
                        <input 
                          type='file' 
                          accept='.json' 
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const reader = new FileReader()
                            reader.onload = async (ev) => {
                              const content = ev.target?.result as string
                              const { importSettings } = await import('../utils/backup')
                              if (importSettings(content)) {
                                // Success - page will reload
                              } else {
                                alert('Failed to import settings. Please make sure the file is a valid Neko-Tab backup.')
                              }
                            }
                            reader.readAsText(file)
                          }}
                          className='saas-hidden-file'
                        />
                      </label>
                    </div>
                  </div>
                )}
                {/* ADVANCED TAB */}
                {activeTab === 'advanced' && (
                  <div className='saas-section'>
                    <div className='saas-card'>
                      <label className='saas-label'>Home Page Settings</label>
                      <div className='saas-toggle-list'>
                        {renderToggle('Show "Open Chrome Tab" button.', localSettings.showChromeTab ?? true, val => handleChange('showChromeTab', val))}
                      </div>
                      <p className='saas-hint'>Keyboard shortcut "c" will always open a new Chrome tab regardless of this setting.
                      </p>
                    </div>                    <div className='saas-card' style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                      <label
                        className='saas-label'
                        style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        <AlertTriangle size={16} /> Danger Zone
                      </label>

                      <p className='saas-hint' style={{ marginBottom: 12 }}>
                        Resetting will permanently delete all your settings, bookmarks, aliases, and notes. This action cannot be undone.
                      </p>

                      <button
                        className='saas-btn-secondary'
                        onClick={handleResetData}
                        style={{ width: '100%', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      >
                        <Trash2 size={14} style={{ marginRight: 8 }} /> Reset All Data & Settings
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className='saas-footer'>
                <button className='saas-btn-secondary' onClick={() => setIsOpen(false)}>
                  Cancel
                </button>
                <button className='saas-btn-primary' onClick={handleSave}>
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
