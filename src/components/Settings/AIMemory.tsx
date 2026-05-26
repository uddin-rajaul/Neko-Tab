import { useState } from 'react'
import { useAIMemory } from '../../hooks/useAIMemory'
import type { AIMemory } from '../../types'
import { Trash2, Search, Book } from 'lucide-react'

export function AIMemorySettings() {
  const { memories, deleteMemory, updateMemory, clearAll } = useAIMemory()
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editKeyword, setEditKeyword] = useState('')
  const [editUrl, setEditUrl] = useState('')

  const filtered = filter
    ? memories.filter(m =>
        m.keyword.toLowerCase().includes(filter.toLowerCase()) ||
        m.url.toLowerCase().includes(filter.toLowerCase())
      )
    : memories

  const startEdit = (m: AIMemory) => {
    setEditing(m.keyword)
    setEditKeyword(m.keyword)
    setEditUrl(m.url)
  }

  const saveEdit = async () => {
    if (!editing || !editKeyword.trim() || !editUrl.trim()) return
    await updateMemory(editing, { keyword: editKeyword.trim(), url: editUrl.trim() })
    setEditing(null)
  }

  const sourceLabel = (s: AIMemory['source']) => {
    switch (s) {
      case 'history': return 'History'
      case 'ai': return 'AI'
      case 'manual': return 'Manual'
    }
  }

  return (
    <div className="saas-card">
      <div className="saas-flex-row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <label className="saas-label" style={{ margin: 0 }}>
          <Book size={16} style={{ marginRight: 8 }} />
          AI Memory ({memories.length})
        </label>
        {memories.length > 0 && (
          <button className="saas-btn-secondary" onClick={clearAll} style={{ fontSize: 12, color: '#ef4444' }}>
            Clear All
          </button>
        )}
      </div>

      <div className="saas-input-wrapper" style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
        <input
          className="saas-input"
          style={{ paddingLeft: 28 }}
          placeholder="Search memories..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      {memories.length === 0 ? (
        <p className="saas-hint">
          No memories yet. Use <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>!</code> commands in the palette and the AI will learn your frequently visited URLs over time.
        </p>
      ) : filtered.length === 0 ? (
        <p className="saas-hint">No memories match your search.</p>
      ) : (
        <div className="provider-list">
          <div style={{ display: 'flex', fontSize: 11, opacity: 0.5, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ width: '30%' }}>Keyword</span>
            <span style={{ flex: 1 }}>URL</span>
            <span style={{ width: 60, textAlign: 'center' }}>Used</span>
            <span style={{ width: 60, textAlign: 'center' }}>Source</span>
            <span style={{ width: 40 }} />
          </div>
          {filtered.map(m => (
            <div key={m.keyword} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {editing === m.keyword ? (
                <>
                  <input
                    className="saas-input"
                    style={{ width: '28%', fontSize: 12, padding: '3px 6px' }}
                    value={editKeyword}
                    onChange={e => setEditKeyword(e.target.value)}
                  />
                  <input
                    className="saas-input"
                    style={{ flex: 1, fontSize: 12, padding: '3px 6px' }}
                    value={editUrl}
                    onChange={e => setEditUrl(e.target.value)}
                  />
                  <button className="saas-btn-primary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={saveEdit}>Save</button>
                  <button className="saas-btn-secondary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setEditing(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <span
                    style={{ width: '30%', fontWeight: 500, fontSize: 13, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    onClick={() => startEdit(m)}
                    title={m.keyword}
                  >
                    {m.keyword}
                  </span>
                  <span
                    style={{ flex: 1, fontSize: 12, opacity: 0.7, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    onClick={() => startEdit(m)}
                    title={m.url}
                  >
                    {m.url}
                  </span>
                  <span style={{ width: 60, textAlign: 'center', fontSize: 11, opacity: 0.5 }}>{m.usageCount}</span>
                  <span style={{ width: 60, textAlign: 'center', fontSize: 11, opacity: 0.5 }}>{sourceLabel(m.source)}</span>
                  <button className="saas-btn-icon" onClick={() => deleteMemory(m.keyword)}>
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
