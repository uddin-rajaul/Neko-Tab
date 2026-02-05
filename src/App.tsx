import { useEffect, useRef } from 'react'
import { useBookmarks, useSettings } from './hooks/useLocalStorage'
import { Bookmarks } from './components/Bookmarks'
import { SearchBar } from './components/SearchBar'
import { Clock } from './components/Clock'
import { PixelArt } from './components/PixelArt'
import { SettingsPanel } from './components/SettingsPanel'
import { ActivityWidget } from './components/ActivityWidget'
import { FocusMode } from './components/FocusMode'

function App() {
  const [settings, setSettings] = useSettings()
  const {
    categories,
    addCategory,
    deleteCategory,
    renameCategory,
    addBookmark,
    deleteBookmark,
    editBookmark,
  } = useBookmarks()

  const handleSearch = () => {
  }

  const appRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Attempt to steal focus from the address bar
    const stealFocus = () => {
      window.focus()
      if (document.activeElement === document.body) {
        appRef.current?.focus()
      }
    }

    // Try immediately and after a short delay
    stealFocus()
    const timer = setTimeout(stealFocus, 50)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <div 
      ref={appRef} 
      className={`app ${settings.theme}`} 
      tabIndex={-1} 
      style={{ outline: 'none' }}
    >
      <SettingsPanel 
        settings={settings} 
        onSettingsChange={setSettings} 
        onAddCategory={addCategory}
      />
      
      {/* Center Section - Clock and Search */}
      <div className="center-section">
        {settings.showClock && (
          <Clock 
            userName={settings.userName} 
            showGreeting={settings.showGreeting}
            format={settings.clockFormat}
          />
        )}
        
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Content Section - ASCII Art and Quick Links side by side */}
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
  )
}

export default App
