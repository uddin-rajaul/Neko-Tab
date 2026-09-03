<p align="center">
  <img src="public/icon128.png" alt="Neko-Tab" width="96" height="96">
</p>

<h1 align="center">Neko-Tab</h1>

<p align="center">
  A terminal-style new tab for keyboard-first humans.<br>
  React · TypeScript · Vite · Chrome Extension
</p>

<p align="center">
  <a href="https://github.com/uddin-rajaul/Neko-Tab/releases/latest">Download</a> · 
  <a href="https://github.com/uddin-rajaul/Neko-Tab">Source</a> · 
  <a href="https://discord.gg/QGSnUUAP">Discord</a>
</p>

---

![Screenshot](screenshots/demo.png)

---

## What It Does

Replaces your new tab with a keyboard-driven workspace. No search bar, no shortcuts grid — just a command palette that does everything.

## Features

### Command Palette

`Ctrl+K` or `/` — the only input you need.

| Prefix | What it does |
|--------|-------------|
| `>` | Search open tabs |
| `!` | AI commands |
| `/` | Slash commands |
| `= 1920/2` | Calculator |
| `gh` | URL aliases |
| *(anything else)* | Web search |

Smart routing: type a URL and it navigates, type a keyword and it fuzzy-searches bookmarks, type anything else and it searches the web.

### AI Mode

Type `!` in the palette. Powered by OpenAI, Anthropic, Gemini, or any custom API.

- **Natural language navigation** — `! open slack and discord`
- **History Q&A** — `! what did I do yesterday`
- **AI Memory** — learns your URLs, suggests new ones

### Theming

22+ themes across three categories:

- **Color** — Carbon, Paper, Nord, Solarized, Dracula, Catppuccin, Tokyo Night, Rosé Pine, and more
- **Animated** — Cyberpunk, Aurora, Synthwave, Vaporwave
- **Special** — Retro CRT, Sunset, Ocean, Midnight

Custom background images with dim/blur overlay.

![Settings](screenshots/settings.png)

### Focus Mode

`Ctrl+F` — Pomodoro timer with site blocking.

- Duration presets: 15, 25, 45, 90 min or custom
- Block any site (Facebook, Instagram, TikTok, Reddit, YouTube, etc.)
- Dashboard with streaks, stats, and session history

### Scratchpad

`Ctrl+\`` — slide-in drawer with three tabs:

- **Notes** — freeform text with line/char counter
- **Checklist** — keyboard-driven task list
- **Journal** — daily log keyed by date

### Bookmarks

Quick-links panel below the palette. Add, edit, delete — fully managed from the new tab.

### Google Integrations

- **Calendar** — upcoming events below the clock
- **Gmail** — unread count + latest emails, optional AI digest

Both are opt-in. No permissions requested until you connect.

### Typing Test

Built-in typing test with words/time modes, best scores, streaks, and daily goals.

![Typing Test](screenshots/typing.png)

### Status Bar

Live telemetry at the bottom: memory usage, ping, GitHub streak, focus streak, tab counter, work timer.

### More

- **Startup Sites** — open your daily sites on first tab
- **Font Chooser** — 12 curated monospace fonts
- **ASCII Art** — custom artwork or OS-specific defaults
- **Export/Import** — backup and restore all settings

## Keyboard Shortcuts

Press `?` anywhere for the full cheatsheet.

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Command palette |
| `Ctrl+\`` | Scratchpad |
| `Ctrl+F` | Focus Mode |
| `Ctrl+Shift+T` | Work timer |
| `Ctrl+Shift+R` | New Chrome tab |
| `c` | New Chrome tab (when not in input) |
| `Escape` | Close any panel |

## Installation

### From Release

1. Enable Developer mode in `chrome://extensions`
2. Download the [latest release](https://github.com/uddin-rajaul/Neko-Tab/releases/latest)
3. Drag the zip onto the extensions page

### From Source

```bash
git clone https://github.com/uddin-rajaul/Neko-Tab
cd Neko-Tab
npm install
npm run build
```

Then **Extensions → Load unpacked → select `dist/`**.

### Optional: Google Integrations

```bash
cp .env.local.example .env.local
# Add your Google OAuth credentials
npm run build
```

Without credentials, everything works — just no Calendar or Gmail.

## Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Settings, bookmarks, scratchpad, aliases |
| `history` | Search browser history from palette |
| `tabs` | Search open tabs, manage startup sites |
| `notifications` | Focus Mode completion alerts |
| `declarativeNetRequest` | Site blocking during Focus Mode |
| `identity` | Google OAuth (only if configured) |

## Privacy

Zero data leaves your browser. Everything stored locally via `chrome.storage`. No analytics, no tracking, no external servers.

## Tech Stack

- React 19 + TypeScript
- Vite
- Lucide React
- JetBrains Mono (default), 11 more via lazy loading

## Support

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/uddinrajaul)

## License

MIT
