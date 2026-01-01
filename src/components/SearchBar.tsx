import { useState, useRef, useEffect } from 'react'
import { Search, Command } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string, engine: string) => void
}

const SEARCH_ENGINES = {
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
  youtube: 'https://www.youtube.com/results?search_query=',
  github: 'https://github.com/search?q=',
}

type EngineKey = keyof typeof SEARCH_ENGINES

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [engine] = useState<EngineKey>('google')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      const url = SEARCH_ENGINES[engine] + encodeURIComponent(query)
      window.open(url, '_blank')
      onSearch(query, engine)
      setQuery('')
    }
  }

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-form">
        <Search className="search-icon" size={20} />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Press 'Ctrl + i' to search"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="search-shortcut">
          <Command size={14} />
          <span>I</span>
        </div>
      </form>
    </div>
  )
}
