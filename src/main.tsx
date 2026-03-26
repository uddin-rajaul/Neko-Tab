import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Type for our pre-warmed state
declare global {
  interface Window {
    __NEKO_SETTINGS__?: any;
  }
}

// Apply theme and capture settings as early as possible
(function() {
  try {
    const stored = localStorage.getItem('startpage-settings');
    const settings = stored ? JSON.parse(stored) : {};
    window.__NEKO_SETTINGS__ = settings;
    
    const theme = settings.theme || 'carbon';
    const themes: Record<string, string> = {
      'carbon': '#222526', 'paper': '#F5F5F5', 'nord': '#2E3440',
      'solarized': '#002B36', 'matrix': '#0D0D0D', 'dracula': '#282A36',
      'monokai': '#272822', 'gruvbox': '#282828', 'tokyo-night': '#1A1B26',
      'catppuccin': '#1E1E2E', 'one-dark': '#282C34', 'rose-pine': '#191724',
      'everforest': '#2D353B', 'cyberpunk': '#0a0a0f', 'aurora': '#0f0c29',
      'synthwave': '#1a1a2e', 'vaporwave': '#1a0a2e', 'retro-terminal': '#0a0a0a',
      'sunset': '#1a1423', 'ocean': '#0c1821', 'midnight': '#020617'
    };
    
    const bgColor = themes[theme] || '#222526';
    document.documentElement.style.backgroundColor = bgColor;
    
    if (theme === 'paper' || theme === 'light') {
      document.documentElement.style.colorScheme = 'light';
    }

    // Apply font variable immediately to prevent FOUT
    const font = settings.font || 'JetBrains Mono';
    const fontValue = font.includes(' ') ? `'${font}'` : font;
    document.documentElement.style.setProperty('--font-mono', fontValue);
    
  } catch (e) {
    console.error('Failed to apply early theme', e);
  }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
