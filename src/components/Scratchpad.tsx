import { useState, useEffect, useRef, useCallback } from 'react'
import { PenLine, X, List, BookOpen } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'

interface CheckItem { id: string; text: string; done: boolean }
type Mode = 'notes' | 'checklist' | 'journal'

function newItem(text = ''): CheckItem {
  return { id: crypto.randomUUID(), text, done: false }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

function formatJournalDate(key: string): string {
  return new Date(key + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  })
}

export function Scratchpad() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('notes')
  const [text, setText] = useLocalStorage<string>('neko-scratchpad', '')
  const [items, setItems] = useLocalStorage<CheckItem[]>('neko-checklist', [newItem()])
  // Journal: map of YYYY-MM-DD -> text
  const [journal, setJournal] = useLocalStorage<Record<string, string>>('neko-journal', {})
  const [journalDay, setJournalDay] = useState(todayKey())
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const journalRef  = useRef<HTMLTextAreaElement>(null)
  const itemRefs    = useRef<Map<string, HTMLInputElement>>(new Map())

  const handleClose = useCallback(() => {
    setItems(prev => prev.filter(i => !i.done))
    setIsOpen(false)
  }, [setItems])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault()
        setIsOpen(o => { if (o) setItems(prev => prev.filter(i => !i.done)); return !o })
      }
      if (e.key === 'Escape' && isOpen) handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, handleClose])

  useEffect(() => {
    if (!isOpen) return
    if (mode === 'notes')   setTimeout(() => textareaRef.current?.focus(), 50)
    if (mode === 'journal') setTimeout(() => journalRef.current?.focus(), 50)
  }, [isOpen, mode])

  useEffect(() => {
    if (isOpen && mode === 'checklist') {
      const last = items[items.length - 1]
      if (last) setTimeout(() => itemRefs.current.get(last.id)?.focus(), 50)
    }
  }, [mode])

  const updateItem = (id: string, t: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, text: t } : i))
  const toggleItem = (id: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i))

  const handleItemKeyDown = (e: React.KeyboardEvent, id: string, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const fresh = newItem()
      setItems(prev => { const n = [...prev]; n.splice(idx + 1, 0, fresh); return n })
      setTimeout(() => itemRefs.current.get(fresh.id)?.focus(), 20)
    }
    if (e.key === 'Backspace' && items[idx].text === '') {
      e.preventDefault()
      if (items.length === 1) return
      setItems(prev => prev.filter(i => i.id !== id))
      const prev2 = items[idx - 1] ?? items[idx + 1]
      if (prev2) setTimeout(() => itemRefs.current.get(prev2.id)?.focus(), 20)
    }
  }

  const journalDays = Object.keys(journal).sort((a, b) => b.localeCompare(a))
  const lineCount = text ? text.split('\n').length : 0
  const charCount = text.length
  const doneCount = items.filter(i => i.done).length
  const totalCount = items.length
  const journalText = journal[journalDay] ?? ''

  return (
    <>
      <button className="scratchpad-toggle" onClick={() => setIsOpen(o => !o)} title="Scratchpad (Ctrl+`)">
        <PenLine size={20} />
      </button>

      {isOpen && (
        <div className="scratchpad-overlay" onClick={handleClose}>
          <div className="scratchpad-panel" onClick={e => e.stopPropagation()}>
            <div className="scratchpad-header">
              <div className="scratchpad-tabs">
                <button className={`sp-tab ${mode === 'notes' ? 'active' : ''}`} onClick={() => setMode('notes')}>
                  <PenLine size={12} /> notes
                </button>
                <button className={`sp-tab ${mode === 'checklist' ? 'active' : ''}`} onClick={() => setMode('checklist')}>
                  <List size={12} /> checklist
                </button>
                <button className={`sp-tab ${mode === 'journal' ? 'active' : ''}`} onClick={() => setMode('journal')}>
                  <BookOpen size={12} /> journal
                </button>
              </div>
              <div className="scratchpad-meta">
                {mode === 'notes'     && <span>{lineCount}L {charCount}C</span>}
                {mode === 'checklist' && <span>{doneCount}/{totalCount}</span>}
                {mode === 'journal'   && <span>{journalText.length}C</span>}
                <button className="scratchpad-close" onClick={handleClose}><X size={16} /></button>
              </div>
            </div>

            {mode === 'notes' && (
              <textarea ref={textareaRef} className="scratchpad-textarea" value={text}
                onChange={e => setText(e.target.value)}
                placeholder="// notes, thoughts, snippets..." spellCheck={false} />
            )}

            {mode === 'checklist' && (
              <div className="sp-checklist">
                {items.map((item, idx) => (
                  <div key={item.id} className={`sp-item ${item.done ? 'done' : ''}`}>
                    <button className="sp-checkbox" onClick={() => toggleItem(item.id)} tabIndex={-1}>
                      {item.done ? '▪' : '▫'}
                    </button>
                    <input
                      ref={el => { if (el) itemRefs.current.set(item.id, el); else itemRefs.current.delete(item.id) }}
                      className="sp-item-input" value={item.text}
                      onChange={e => updateItem(item.id, e.target.value)}
                      onKeyDown={e => handleItemKeyDown(e, item.id, idx)}
                      placeholder={idx === 0 && items.length === 1 ? 'add a task...' : ''}
                      spellCheck={false} />
                  </div>
                ))}
                <button className="sp-add-btn" onClick={() => {
                  const fresh = newItem()
                  setItems(prev => [...prev, fresh])
                  setTimeout(() => itemRefs.current.get(fresh.id)?.focus(), 20)
                }}>+ add item</button>
              </div>
            )}

            {mode === 'journal' && (
              <div className="sp-journal">
                <div className="sp-journal-nav">
                  <div className="sp-journal-days">
                    {[todayKey(), ...journalDays.filter(d => d !== todayKey())].map(d => (
                      <button key={d} className={`sp-day-btn ${d === journalDay ? 'active' : ''}`}
                        onClick={() => setJournalDay(d)}>
                        {d === todayKey() ? 'today' : d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sp-journal-date">{formatJournalDate(journalDay)}</div>
                <textarea
                  ref={journalRef}
                  className="scratchpad-textarea"
                  value={journalText}
                  onChange={e => setJournal(prev => ({ ...prev, [journalDay]: e.target.value }))}
                  placeholder={`// what did you work on today?`}
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
