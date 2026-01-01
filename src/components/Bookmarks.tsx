import { useState, useRef, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import type { BookmarkCategory, Bookmark } from '../types'

interface BookmarksProps {
  categories: BookmarkCategory[]
  onAddCategory: (name: string) => void
  onDeleteCategory: (id: string) => void
  onRenameCategory: (id: string, name: string) => void
  onAddBookmark: (categoryId: string, title: string, url: string) => void
  onDeleteBookmark: (categoryId: string, bookmarkId: string) => void
  onEditBookmark: (categoryId: string, bookmarkId: string, title: string, url: string) => void
}

interface EditingState {
  type: 'category' | 'bookmark' | 'new-bookmark' | 'new-category' | null
  categoryId?: string
  bookmarkId?: string
  value?: string
  url?: string
}

export function Bookmarks({
  categories,
  onAddCategory,
  onDeleteCategory,
  onRenameCategory,
  onAddBookmark,
  onDeleteBookmark,
  onEditBookmark,
}: BookmarksProps) {
  const [editing, setEditing] = useState<EditingState>({ type: null })
  const [isEditMode, setIsEditMode] = useState(false)
  const [topSites, setTopSites] = useState<{ title: string; url: string }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.topSites) {
      chrome.topSites.get((sites) => {
        setTopSites(sites.slice(0, 4)) // Limit to 4 items
      })
    }
  }, [])

  useEffect(() => {
    if (editing.type && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing.type, editing.categoryId, editing.bookmarkId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditing({ type: null })
    }
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  const handleSave = () => {
    if (!editing.value?.trim()) {
      setEditing({ type: null })
      return
    }

    switch (editing.type) {
      case 'category':
        if (editing.categoryId) {
          onRenameCategory(editing.categoryId, editing.value)
        }
        break
      case 'new-category':
        onAddCategory(editing.value)
        break
      case 'new-bookmark':
        if (editing.categoryId && editing.url) {
          onAddBookmark(editing.categoryId, editing.value, editing.url)
        }
        break
      case 'bookmark':
        if (editing.categoryId && editing.bookmarkId && editing.url) {
          onEditBookmark(editing.categoryId, editing.bookmarkId, editing.value, editing.url)
        }
        break
    }
    setEditing({ type: null })
  }

  const startEditCategory = (e: React.MouseEvent, cat: BookmarkCategory) => {
    e.stopPropagation()
    setEditing({ type: 'category', categoryId: cat.id, value: cat.name })
  }

  const startNewBookmark = (e: React.MouseEvent, categoryId: string) => {
    e.stopPropagation()
    setEditing({ type: 'new-bookmark', categoryId, value: '', url: 'https://' })
  }

  const startEditBookmark = (e: React.MouseEvent, categoryId: string, bookmark: Bookmark) => {
    e.preventDefault()
    e.stopPropagation()
    setEditing({ type: 'bookmark', categoryId, bookmarkId: bookmark.id, value: bookmark.title, url: bookmark.url })
  }

  const handleDeleteCategory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    onDeleteCategory(id)
  }

  const handleDeleteBookmark = (e: React.MouseEvent, categoryId: string, bookmarkId: string) => {
    e.preventDefault()
    e.stopPropagation()
    onDeleteBookmark(categoryId, bookmarkId)
  }

  return (
    <div className="bookmarks-container">
      <div className="bookmarks-header">
        <h3 className="quick-links-title">QUICK LINKS</h3>
        <button 
          className="action-btn-mini"
          style={{ opacity: isEditMode ? 1 : 0.5 }}
          onClick={() => setIsEditMode(!isEditMode)}
          title={isEditMode ? "Done editing" : "Edit bookmarks"}
        >
          {isEditMode ? <Check size={14} /> : <Pencil size={14} />}
        </button>
      </div>

      <div className="categories-grid">
        {topSites.length > 0 && (
          <div className="category-column">
            <div className="category-header">
              <span className="category-name">Frequently Visited</span>
            </div>
            <div className="bookmarks-list">
              {topSites.map((site, index) => (
                <div key={index} className="bookmark-item">
                  <a href={site.url} className="bookmark-link" title={site.title}>
                    {(() => {
                      try {
                        const url = new URL(site.url);
                        const hostname = url.hostname.replace(/^www\./, '');
                        return hostname.split('.')[0];
                      } catch (e) {
                        return site.title.length > 15 ? site.title.slice(0, 15) + '...' : site.title;
                      }
                    })()}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
        {categories.map(cat => (
          <div 
            key={cat.id} 
            className="category-column"
          >
            <div className="category-header">
              {editing.type === 'category' && editing.categoryId === cat.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  className="inline-input"
                  value={editing.value}
                  onChange={e => setEditing({ ...editing, value: e.target.value })}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSave}
                />
              ) : (
                <span className="category-name">{cat.name}</span>
              )}
              
              {isEditMode && editing.type !== 'category' && (
                <div className="category-actions">
                  <button 
                    className="action-btn-mini"
                    onClick={(e) => startNewBookmark(e, cat.id)}
                    title="Add bookmark"
                  >
                    <Plus size={12} />
                  </button>
                  <button 
                    className="action-btn-mini"
                    onClick={(e) => startEditCategory(e, cat)}
                    title="Edit category"
                  >
                    <Pencil size={12} />
                  </button>
                  <button 
                    className="action-btn-mini action-btn-danger"
                    onClick={(e) => handleDeleteCategory(e, cat.id)}
                    title="Delete category"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="bookmarks-list">
              {cat.bookmarks.slice(0, 4).map(bookmark => (
                <div 
                  key={bookmark.id} 
                  className="bookmark-item"
                >
                  {editing.type === 'bookmark' && editing.bookmarkId === bookmark.id ? (
                    <div className="bookmark-edit-form">
                      <input
                        ref={inputRef}
                        type="text"
                        className="inline-input"
                        placeholder="Title"
                        value={editing.value}
                        onChange={e => setEditing({ ...editing, value: e.target.value })}
                        onKeyDown={handleKeyDown}
                      />
                      <input
                        type="text"
                        className="inline-input"
                        placeholder="URL"
                        value={editing.url}
                        onChange={e => setEditing({ ...editing, url: e.target.value })}
                        onKeyDown={handleKeyDown}
                      />
                      <div className="edit-actions">
                        <button className="action-btn-mini" onClick={handleSave}>
                          <Check size={12} />
                        </button>
                        <button className="action-btn-mini" onClick={() => setEditing({ type: null })}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <a 
                        href={bookmark.url} 
                        className="bookmark-link"
                      >
                        {bookmark.title}
                      </a>
                      {isEditMode && (
                        <div className="bookmark-actions">
                          <button 
                            className="action-btn-mini"
                            onClick={(e) => startEditBookmark(e, cat.id, bookmark)}
                          >
                            <Pencil size={10} />
                          </button>
                          <button 
                            className="action-btn-mini action-btn-danger"
                            onClick={(e) => handleDeleteBookmark(e, cat.id, bookmark.id)}
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              
              {editing.type === 'new-bookmark' && editing.categoryId === cat.id && (
                <div className="bookmark-edit-form">
                  <input
                    ref={inputRef}
                    type="text"
                    className="inline-input"
                    placeholder="Title"
                    value={editing.value}
                    onChange={e => setEditing({ ...editing, value: e.target.value })}
                    onKeyDown={handleKeyDown}
                  />
                  <input
                    type="text"
                    className="inline-input"
                    placeholder="URL"
                    value={editing.url}
                    onChange={e => setEditing({ ...editing, url: e.target.value })}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="edit-actions">
                    <button className="action-btn-mini" onClick={handleSave}>
                      <Check size={12} />
                    </button>
                    <button className="action-btn-mini" onClick={() => setEditing({ type: null })}>
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
