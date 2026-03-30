# Neko-Tab

A minimalist, terminal-style new tab page for your browser. Built with React, TypeScript, and Vite.
Designed around keyboard-first navigation, a command palette, and a clean aesthetic with zero clutter.

![Demo](screenshots/demo.gif)

---

## Features

### Command Palette

Press `Ctrl+K` or `/` to open the unified command palette. It replaces the traditional search bar entirely.

- **Smart routing** — type a URL (`github.com/raj`) and it navigates directly; type a keyword and it fuzzy-searches your bookmarks and aliases; type anything else and it falls through to web search
- **URL aliases** — define short keys like `gh → https://github.com/raj` that appear first in results
- **Engine switcher** — switch between Google, DuckDuckGo, GitHub, and YouTube inside the palette
- **Fuzzy search** — matches bookmarks by title, URL, or category

### Theming

20+ professionally crafted themes across three categories:

- **Color**: Carbon, Paper, Nord, Solarized, Matrix, Dracula, Monokai, Gruvbox, Tokyo Night, Catppuccin, One Dark, Rosé Pine, Everforest
- **Animated**: Cyberpunk, Aurora, Synthwave, Vaporwave
- **Special Effects**: Retro CRT, Sunset, Ocean, Midnight

Custom background image support with adjustable dim and blur overlay.

### Custom ASCII Art
Add your own text-based artwork to the main screen, configure the ASCII source (OS-specific, custom, or completely hidden), and manage it perfectly without layout breaks natively from the Settings menu.

### Scratchpad

Open with `Ctrl+\`` — a slide-in drawer with three tabs:

- **Notes** — freeform textarea with line/char counter
- **Checklist** — keyboard-driven task list (`Enter` for new item, `Backspace` on empty deletes); checked items auto-clear on close
- **Journal** — daily log keyed by date; past days accessible via nav buttons

### Font Chooser

Pick from 12 curated monospace fonts in Settings → Appearance. Fonts load lazily — only the selected font is fetched, not all of them upfront.

- **Modern**: Geist Mono, Commit Mono, Intel One Mono
- **Popular**: JetBrains Mono (default), Fira Code, Cascadia Code
- **Character**: Space Mono, Iosevka, IBM Plex Mono, Inconsolata, Source Code Pro, Hack

### Recent History in Command Palette

When you open `Ctrl+K` with an empty query, the last 10 visited URLs and searches appear instantly. Deduped by URL, newest first. Clear history button in the hint row.

### Focus Mode (Pomodoro)

`Ctrl+F` or the crosshair icon to open. A full-featured Pomodoro timer with website blocking:

- **Duration presets** — 15, 25, 45, 90 minutes, or custom
- **Task tracking** — set an intention for each session
- **Site blocking** — block Facebook, Instagram, TikTok, Twitter/X, LinkedIn, Reddit, YouTube, Netflix, Twitch, or add custom domains
- **Dashboard** — today's blocks, current streak, best streak, weekly consistency chart
- **Session log** — view all completed sessions for the day
- **Distraction log** — silently logs attempted visits to blocked sites and displays a summary after the session
- **Notifications** — desktop notification + sound on completion
- **Identity reinforcement** — motivational messages based on your streak

### Daily Goal

A single focus line between the clock and command palette. Click to edit, resets at midnight.

### Bookmarks

A two-column quick-links panel below the command palette. Fully editable without leaving the tab:

- Add/delete/rename categories
- Add, edit, and delete individual links per category
- All data stored locally — no sync, no account

### Chrome Tab Button

Toggle with `Ctrl+Shift+R` or the tab icon in the top-right. Opens a new Chrome tab with the same new tab page.

### Status Bar

- **HEAP** — JS heap memory usage with a live bar (Chrome only)
- **PING** — real latency via `1.1.1.1` (not just `navigator.onLine`)
- **GitHub Streak** — contribution streak with 14-day sparkline (optional, no auth needed)
- **Focus Streak** — days with at least one completed Pomodoro session, with 7-day sparkline
- **Work Timer** — simple elapsed time tracker, `Ctrl+Shift+T` to toggle
- **Idle Tab Counter** — a subtle, daily new tab counter that increments on every new tab opened to combat habitual tab opening

### Keyboard Shortcuts

Press `?` anywhere to show the full shortcut cheatsheet.

| Shortcut | Action |
|---|---|
| `Ctrl+K` or `/` | Open command palette |
| `Ctrl+\`` | Toggle scratchpad |
| `Ctrl+Shift+T` | Start / stop work timer |
| `Ctrl+F` | Open / close Focus Mode |
| `Ctrl+Shift+S` | Save scratchpad (auto-saves anyway) |
| `?` | Show shortcut help |
| `Escape` | Close any open panel |
| `↑ / ↓` or `Ctrl+P / Ctrl+N` | Navigate palette results |
| `Enter` | Open selected result |
| `Enter / Escape` | Confirm / cancel daily goal edit |
| `Enter` | New checklist item (scratchpad) |
| `Backspace` | Delete empty checklist item |
| `Tab` | Navigate focus mode inputs |

---


## Installation

### Pre-built package

1. Enable Developer mode in Chrome's extensions page.
2. Download the [latest release](https://github.com/uddin-rajaul/Neko-Tab/releases/latest).
3. Drag-and-drop the zip file in the Chrome's extensions page.


### Development

```bash
git clone https://github.com/uddin-rajaul/Neko-Tab
cd neko-tab
npm install
npm run dev
```

### Load as a browser extension

```bash
npm run build
```

Then in Chrome/Edge: **Extensions → Load unpacked → select the `dist/` folder**.

---

## Settings

Open the gear icon (top-right) to access:

- **Appearance** — theme picker with live preview, font chooser (12 curated monospace fonts)
- **Preferences** — name, clock format (12/24h), display toggles (clock, greeting, status bar, etc.)
- **ASCII Art** — image-to-ASCII converter, custom art editor, or OS-specific art (Windows/Mac/Linux)
- **Widgets** — background image with dim/blur controls, daily goal, GitHub streak (set username)
- **Aliases** — define short URL aliases for the command palette
- **Focus Mode** — configure default duration and blocked sites
- **Advanced** — reset all user data and wipe stored settings cleanly

---

## Permissions

| Permission | Why |
|---|---|
| `storage` | Persist settings, bookmarks, scratchpad, aliases, timer state |
| `declarativeNetRequest` | Block sites during Focus Mode sessions |
| `host_permissions: <all_urls>` | Required for site blocking to apply on any domain |

---

## Privacy

No data leaves your browser. Everything is stored locally via the browser `storage` API.
No analytics, no tracking, no external servers — except searches you explicitly initiate.

---

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)
- JetBrains Mono (default font), 11 more via lazy Google Fonts loading

---

## Join Community
- Discord: [Join](https://discord.gg/QGSnUUAP)

## Support

If Neko-Tab saves you time or you just like what it does, a small contribution goes a long way.

**eSewa (Nepal):** `9823211188`

No pressure, the project is and will always be free and open source.

---

## License

MIT
