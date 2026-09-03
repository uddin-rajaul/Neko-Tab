import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { CommandPalette } from './components/CommandPalette'
import paletteStyles from './styles/command-palette.css?inline'

console.log('[Neko Content] Content script loaded on', window.location.href)

let root: Root | null = null
let container: HTMLDivElement | null = null
let isOpen = false

function mount() {
  if (container) {
    destroy()
  }

  container = document.createElement('div')
  container.id = 'neko-palette-root'
  // Host element must cover viewport for fixed-position children inside shadow DOM
  container.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;'

  const shadow = container.attachShadow({ mode: 'open' })

  // Inject CSS into shadow root
  const style = document.createElement('style')
  style.textContent = paletteStyles
  shadow.appendChild(style)

  // Mount point for React portals
  const mountPoint = document.createElement('div')
  mountPoint.id = 'neko-palette-mount'
  shadow.appendChild(mountPoint)

  document.body.appendChild(container)

  root = createRoot(mountPoint)
  root.render(
    <StrictMode>
      <CommandPalette
        context="content"
        portalContainer={mountPoint}
        initialOpen
        onClose={() => { destroy() }}
      />
    </StrictMode>
  )

  isOpen = true

  // Auto-open the palette input after mount
  setTimeout(() => {
    const input = shadow?.querySelector('.cp-input') as HTMLInputElement | null
    if (input) {
      input.focus()
    }
  }, 50)
}

function destroy() {
  if (root) {
    root.unmount()
    root = null
  }
  if (container) {
    container.remove()
    container = null
  }
  isOpen = false
}

// Listen for open/close messages from background (chrome.commands handler)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'neko-open-palette') {
    console.log('[Neko Content] Received neko-open-palette', { isOpen, url: window.location.href })
    if (isOpen) {
      destroy()
    } else {
      try {
        mount()
        console.log('[Neko Content] Palette mounted successfully')
      } catch (err) {
        console.error('[Neko Content] mount() failed:', err)
      }
    }
    sendResponse({ ok: true })
    return true
  }
})
