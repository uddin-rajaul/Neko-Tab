import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const SHORTCUTS = [
  { keys: 'Ctrl+K',         desc: 'Command palette — search bookmarks & aliases' },
  { keys: '/command',        desc: 'Slash commands — /theme, /font, /goal, /note' },
  { keys: 'Ctrl+`',         desc: 'Toggle scratchpad / notes drawer' },
  { keys: 'Ctrl+Shift+T',   desc: 'Start / stop work timer' },
  { keys: 'Alt+Shift+S',    desc: 'Open startup sites instantly' },
  { keys: 'c',              desc: 'Open Chrome new tab page' },
  { keys: '?',              desc: 'Show this shortcut help' },
  { keys: 'Escape',         desc: 'Close any open panel' },
  { keys: '↑ / ↓',         desc: 'Navigate command palette results' },
  { keys: 'Enter',          desc: 'Open selected result in command palette' },
  { keys: 'Enter / Escape', desc: 'Confirm / cancel daily goal edit' },
  { keys: 'Enter',          desc: 'New checklist item (in scratchpad)' },
  { keys: 'Backspace',      desc: 'Delete empty checklist item' },
]

export function ShortcutHelp() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === '?') { e.preventDefault(); setIsOpen(o => !o) }
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!isOpen) return null

  return (
    <div className="sh-overlay" onClick={() => setIsOpen(false)}>
      <div className="sh-panel" onClick={e => e.stopPropagation()}>
        <div className="sh-header">
          <span className="sh-title">~ keyboard shortcuts</span>
          <button className="sh-close" onClick={() => setIsOpen(false)}><X size={15} /></button>
        </div>
        <div className="sh-list">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="sh-row">
              <kbd className="sh-kbd">{s.keys}</kbd>
              <span className="sh-desc">{s.desc}</span>
            </div>
          ))}
        </div>
        <div className="sh-footer">press <kbd className="sh-kbd">?</kbd> or <kbd className="sh-kbd">esc</kbd> to close</div>
      </div>
    </div>
  )
}
