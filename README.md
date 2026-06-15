# Neko-Tab

<p align="center">
  <img src="public/icon128.png" alt="Neko-Tab icon" width="128" height="128">
</p>

A minimalist, terminal-style new tab page for your browser. Built with React, TypeScript, and Vite.
Designed around keyboard-first navigation, a command palette, and a clean aesthetic with zero clutter.

![Demo](screenshots/demo.gif)

---

## Features

### Command Palette

Press `Ctrl+K` or `/` to open the unified command palette. It replaces the traditional search bar entirely. Type `>` to search open tabs, `!` for AI commands, or `/` for slash commands.

- **Smart routing** — type a URL (`github.com/raj`) and it navigates directly; type a keyword and it fuzzy-searches your bookmarks and aliases; type anything else and it falls through to web search
- **URL aliases** — define short keys like `gh → https://github.com/raj` that appear first in results
- **Browser history autocomplete** — typing `instagram` also searches browser history, shows matching previously visited pages with a `◷` icon, and dedupes them against aliases and bookmarks already shown
- **Built-in calculator** — type `= 1920/2` to instantly evaluate numeric expressions with support for `+`, `-`, `*`, `/`, `%`, `()`, and `^`; press `Enter` to copy the result
- **Tab search** — type `> reddit` to search all open browser tabs across windows; fuzzy matches by title and URL; select to focus that tab
- **Slash commands** — type `/clock` to toggle clock maximized mode, `/chrome-tab` to open a Chrome tab
- **Engine switcher** — switch between Google, DuckDuckGo, GitHub, and YouTube inside the palette
- **Fuzzy search** — matches bookmarks by title, URL, or category

### AI Command Interpreter

Type `!` in the command palette to trigger AI mode. Powered by your choice of provider (OpenAI, Anthropic, Gemini, or custom API).

- **Natural language navigation** — `! open slack and discord` opens both in new tabs
- **Smart URL resolution** — prefers your most-visited URLs from browser history
- **AI Memory** — automatically learns which URLs you use for each service; suggests new mappings as you use the palette
- **Browsing History Q&A** — ask `! what did I do yesterday` or `! summarize last week` — the AI fetches your Chrome history for that period and returns a concise summary with clickable link chips
- **Save to journal** — each AI summary includes a **Save to journal** button that writes it to the scratchpad journal with the correct date stamp
- **Supported date queries** — `today`, `yesterday`, `last week`, `this month`, specific dates (`May 30`, `june 1`), and day names (`Monday`)
- **View and manage** learned mappings in **Settings → AI → AI Memory**

### AI Memory

The AI learns from your browsing patterns over time:

- **History scan** — on first use, scans your Chrome history to build a map of frequently visited destinations
- **Auto-learning** — every time the AI successfully opens a service, it remembers the exact URL you use
- **AI suggestions** — the AI can propose new memory mappings when it opens unfamiliar services
- **Settings UI** — view, edit, search, and delete learned memories in **Settings → AI**

### Theming

22+ professionally crafted themes across three categories:

- **Color**: Carbon, Paper, Nord, Solarized, Matrix, Dracula, Monokai, Gruvbox, Tokyo Night, Catppuccin, One Dark, Rosé Pine, Everforest, ChatGPT, Claude
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
- **Dashboard** — today's blocks, current streak, best streak, weekly consistency chart, tabs used per session
- **Distraction logging** — each blocked site visit is logged with domain and timestamp per session
- **Session log** — view all completed sessions for the day
- **Notifications** — desktop notification + sound on completion
- **Identity reinforcement** — motivational messages based on your streak

### Google Calendar Integration

See your next upcoming event directly on the new tab page, right below the clock.

- Connect your Google account from **Settings → Integrations → Google Calendar**
- Configure how far ahead to show events (1 hour to 10 days)
- Click the event to open it in Google Calendar
- Disconnect anytime from the same settings panel
- Chrome only — requires the `identity` API

### Daily Goal

A single focus line between the clock and command palette. Click to edit, resets at midnight.

### Startup Sites

On the first new tab of each day, a greeting card appears: *"Good morning — open your startup sites?"* with an "Open all" button. Configure up to 10 URLs in **Settings → Startup Sites**. Already-open tabs are focused instead of duplicated. `Alt+Shift+S` to trigger from anywhere.

### Bookmarks

A two-column quick-links panel below the command palette. Fully editable without leaving the tab:

- Add/delete/rename categories
- Add, edit, and delete individual links per category
- All data stored locally — no sync, no account

### Chrome Tab Button

Toggle with `Ctrl+Shift+R`, press `c` (when not in an input), or click the tab icon (top-right). Opens a new Chrome tab with the same new tab page.

### Clock Maximization

Click the clock to enter a fullscreen mode — the clock fills the entire view. Click again or press `Escape`/`Ctrl+K` to exit.

### Status Bar

- **HEAP** — JS heap memory usage with a live bar (Chrome only)
- **PING** — real latency via `1.1.1.1` (not just `navigator.onLine`)
- **GitHub Streak** — contribution streak with 14-day sparkline (optional, no auth needed)
- **Focus Streak** — days with at least one completed Pomodoro session, with 7-day sparkline
- **TABS TODAY** — counter of navigations away from the new tab page (bookmarks, URLs, searches)
- **Work Timer** — simple elapsed time tracker, `Ctrl+Shift+T` to toggle

### Keyboard Shortcuts

Press `?` anywhere to show the full shortcut cheatsheet.

| Shortcut | Action |
|---|---|
| `Ctrl+K` or `/` | Open command palette |
| `Ctrl+\`` | Toggle scratchpad |
| `Ctrl+Shift+T` | Start / stop work timer |
| `Ctrl+F` | Open / close Focus Mode |
| `Ctrl+Shift+S` | Save scratchpad (auto-saves anyway) |
| `Ctrl+Shift+R` | Open Chrome tab |
| `Alt+Shift+S` | Trigger startup sites card |
| `?` | Show shortcut help |
| `c` | Open Chrome tab (when not in input) |
| `Escape` | Close any open panel |
| `↑ / ↓` or `Ctrl+P / Ctrl+N` | Navigate palette results |
| `Enter` | Open selected result |
| `Enter / Escape` | Confirm / cancel daily goal edit |
| `Enter` | New checklist item (scratchpad) |
| `Backspace` | Delete empty checklist item |

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

### Optional: Google Calendar Integration

The extension works fully without any setup. To enable Google Calendar events on your new tab page:

1. Copy `.env.local.example` to `.env.local`
2. Follow the instructions in `.env.local.example` to add your Google OAuth credentials
3. Rebuild with `npm run build`

Without credentials, the extension runs normally — just without Calendar support. No unnecessary permissions are requested.

---

## Settings

Open the gear icon (top-right) to access:

- **Appearance** — theme picker with live preview, font chooser (12 curated monospace fonts)
- **Preferences** — name, clock format (12/24h), display toggles (clock, greeting, status bar, tab counter, etc.)
- **ASCII Art** — image-to-ASCII converter, custom art editor, or OS-specific art (Windows/Mac/Linux)
- **Widgets** — background image with dim/blur controls, daily goal, GitHub streak (set username)
- **Startup Sites** — configure up to 10 URLs to open on the first new tab of each day
- **Aliases** — define short URL aliases for the command palette
- **Integrations** — connect Google Calendar to show upcoming events on the home page
- **AI** — configure AI providers (OpenAI, Anthropic, Gemini, custom API), manage learned URL memories
- **Focus Mode** — configure default duration and blocked sites
- **Export/Import** — download all settings as JSON or restore from a backup
- **Advanced** — reset all user data and wipe stored settings cleanly

---

## Permissions

| Permission | Why |
|---|---|
| `storage` | Persist settings, bookmarks, scratchpad, aliases, timer state |
| `history` | Search browser history from the command palette and surface matching recently visited pages |
| `tabs` | Search open browser tabs, open startup sites, manage tab focus |
| `topSites` | Surface most visited URLs for smarter command palette results |
| `notifications` | Desktop notifications for Focus Mode session completion |
| `webRequest` | Track tab navigation for the tab usage counter |
| `declarativeNetRequest` | Block sites during Focus Mode sessions |
| `host_permissions: <all_urls>` | Required for site blocking to apply on any domain |
| `identity` | OAuth flow for Google Calendar integration (Chrome only) — only included in the built extension if credentials are configured |

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

Neko-Tab is free and open source. If it saves you time, consider buying me a coffee.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/uddinrajaul)


---

## License

MIT
