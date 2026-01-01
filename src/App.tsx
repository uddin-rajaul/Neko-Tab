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
      
      <div className="main-container">
        <div className="left-column">
          <PixelArt asciiArt={settings.asciiArt} />
        </div>
        
        <div className="right-column">
          <div className="top-row">
            <SearchBar onSearch={handleSearch} />
            {settings.showClock && (
              <Clock 
                userName={settings.userName} 
                showGreeting={settings.showGreeting}
                format={settings.clockFormat}
              />
            )}
          </div>
          
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
      <ActivityWidget />
      <FocusMode />
    </div>
  )
}

export default App
