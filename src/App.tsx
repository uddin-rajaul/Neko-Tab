import { useEffect, useRef, type CSSProperties } from 'react'
import { useBookmarks, useSettings, useLocalStorage } from './hooks/useLocalStorage'
import { Bookmarks } from './components/Bookmarks'
import { Clock } from './components/Clock'
import { PixelArt } from './components/PixelArt'
import { SettingsPanel } from './components/SettingsPanel'
import { ActivityWidget } from './components/ActivityWidget'
import { FocusMode } from './components/FocusMode'
import { DailyGoal } from './components/DailyGoal'
import { Scratchpad } from './components/Scratchpad'
import { CommandPalette } from './components/CommandPalette'
import { ShortcutHelp } from './components/ShortcutHelp'

function CustomBackground() {
  const [settings] = useSettings()
  const [bgImage] = useLocalStorage<string>('neko-bg-image', '')

  if (!bgImage) return null

  return (
    <>
      {/* The actual image layer */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -2,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: settings.bgBlur > 0 ? `blur(${settings.bgBlur * 2}px)` : undefined,
        transform: settings.bgBlur > 0 ? 'scale(1.08)' : undefined,
      }} />
      {/* Dim overlay on top of image */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        background: `rgba(0,0,0,${(settings.bgDim ?? 40) / 100})`,
      }} />
    </>
  )
}

function App() {
  const [settings, setSettings] = useSettings()
  const [bgImage] = useLocalStorage<string>('neko-bg-image', '')
  const {
    categories,
    addCategory,
    deleteCategory,
    renameCategory,
    addBookmark,
    deleteBookmark,
    editBookmark,
  } = useBookmarks()

  const appRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = document.documentElement
    const fontValue = (settings.font || 'JetBrains Mono').includes(' ')
      ? `'${settings.font || 'JetBrains Mono'}'`
      : (settings.font || 'JetBrains Mono')
    root.style.setProperty('--font-mono', fontValue)
  }, [settings.font])

  useEffect(() => {
    const stealFocus = () => {
      window.focus()
      if (document.activeElement === document.body) {
        appRef.current?.focus()
      }
    }
    stealFocus()
    const timer = setTimeout(stealFocus, 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* Background rendered outside .app so it's never clipped by the theme bg-color */}
      <CustomBackground />

      <div
        ref={appRef}
        className={`app ${settings.theme}${bgImage ? ' has-bg' : ''}`}
        tabIndex={-1}
        style={{
          outline: 'none',
          ...(bgImage ? { backgroundColor: 'transparent', background: 'none' } : {}),
        } as CSSProperties}
      >
        <SettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          onAddCategory={addCategory}
        />
        <Scratchpad />
        <ShortcutHelp />

        {/* Center Section */}
        <div className="center-section">
          {settings.showClock && (
            <Clock
              userName={settings.userName}
              showGreeting={settings.showGreeting}
              format={settings.clockFormat}
            />
          )}
          {settings.showDailyGoal && <DailyGoal />}
          <CommandPalette />
        </div>

        {/* Content Section */}
        <div className="content-section">
          <div className="ascii-column">
            <PixelArt asciiArt={settings.asciiArt} />
          </div>
          <div className="links-column">
            <Bookmarks
              categories={categories}
              onAddCategory={addCategory}
              onDeleteCategory={deleteCategory}
              onRenameCategory={renameCategory}
              onAddBookmark={addBookmark}
              onDeleteBookmark={deleteBookmark}
              onEditBookmark={editBookmark}
            />
          </div>
        </div>

        {settings.showStatusBar && <ActivityWidget />}
        <FocusMode />
      </div>
    </>
  )
}

export default App
