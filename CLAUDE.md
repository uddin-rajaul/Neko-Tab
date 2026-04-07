## Core Principles
When working with this codebase, prioritize readability over cleverness. Ask clarifying questions before making architectural changes.

## Branch & PR Workflow

**Always work in a feature branch. Never commit directly to `main`.**

```bash
git checkout main && git pull origin main
git checkout -b <type>/<short-description>
# do the work
git push origin <branch-name>
# open PR on GitHub — review and merge is up to Raj
```

Branch naming:
- `feat/` — new feature
- `fix/` — bug fix
- `chore/` — cleanup, refactoring, non-functional changes
- `docs/` — documentation only

**CLAUDE.md is the only file that can be updated directly on `main`.**

PR descriptions should clearly state:
- What changed and why
- Any side effects or things to watch out for
- If it closes an issue, mention it (`Closes #N`)

---

## 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked
- No abstractions for single-use code
- No "flexibility" or "configurability" that wasn't requested
- No error handling for impossible scenarios
- If you write 200 lines and it could be 50, rewrite it

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting
- Don't refactor things that aren't broken
- Match existing style, even if you'd do it differently
- If you notice unrelated dead code, mention it — don't delete it without asking

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused
- Don't remove pre-existing dead code unless explicitly asked

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

## Workflow Patterns

### Research → Plan → Code → Commit → PR
1. **Research**: Read relevant files, understand context
2. **Plan**: State approach before coding
3. **Code**: Implement on a feature branch
4. **Build**: Run `./node_modules/.bin/vite build` to verify no errors
5. **Commit**: Clear commit messages describing the change
6. **PR**: Push branch and open a PR — Raj reviews and merges

## Code Standards

- Use clear, descriptive variable and function names
- Write self-documenting code with minimal comments
- Comments should explain "why", not "what"
- Keep functions small and focused on single responsibility
- Prefer composition over inheritance
- Follow existing patterns in the codebase
- Always run a build before pushing — zero TypeScript errors required


## Project Structure

```
src/
  components/   # React components, one per file
  hooks/        # useLocalStorage, useSettings, useBookmarks, useTime, useGoogleCalendar
  utils/        # imageToAscii
  types.ts      # Shared TypeScript interfaces
  styles/       # Split CSS files, imported via index.css manifest
  index.css     # Pure @import manifest — do not add styles here directly
  App.tsx       # Root layout
public/
  manifest.json # Chrome Extension MV3 — placeholders injected at build time
  background.js # Service worker (focus mode blocking)
  dist.pem      # Extension private key — DO NOT regenerate, DO NOT commit changes
screenshots/    # Only image.png and terminal.png are used in README
```

## Build System & Manifest Injection

`vite.config.ts` runs a `closeBundle` plugin that post-processes `dist/manifest.json`:
- Replaces `__GOOGLE_CLIENT_ID__` with `GOOGLE_CLIENT_ID` from `.env.local`
- Replaces `__GOOGLE_EXTENSION_KEY__` with `GOOGLE_EXTENSION_KEY` from `.env.local`
- If `GOOGLE_EXTENSION_KEY` is missing or invalid base64, the `key` field is stripped entirely (safe for local dev without OAuth)

`.env.local` holds both values and is gitignored. Never hardcode client IDs in source.

## Chrome Extension — MV3 Rules

These are hard constraints. Violating them causes silent failures and extension instability:

**CSP (Content Security Policy)**
- `manifest.json` must declare `content_security_policy.extension_pages` explicitly
- Inline `<style>` blocks in `index.html` require their SHA-256 hash in the CSP `style-src`
- When adding or changing the inline style block, get the hash from the Chrome extension error console and add it: `'sha256-XXXX='`
- Current required hash: `sha256-9h6cMlG+wehv5PIl9iqaQcU8WSqE0ANpgmuDQF5LX6I=` (matches the instant-background `<style>` in `index.html`)
- External font loading (`fonts.googleapis.com`, `fonts.gstatic.com`, `cdn.jsdelivr.net`) must be in `style-src` / `font-src`
- Do NOT add `<link rel="preconnect">` or `<link rel="dns-prefetch">` to `index.html` for external domains — MV3 CSP blocks them on extension pages and Chrome logs violations that accumulate and destabilize the extension

**Google Identity / OAuth**
- The OAuth client in Google Cloud Console must be type **"Chrome extension"**, not "Web application"
- For Chrome extension type clients, Google handles the redirect URI automatically — do NOT manually add `chromiumapp.org` URIs
- The `Item ID` field in the Cloud Console must match the unpacked extension ID (derived from `dist.pem`)
- Extension ID is stable as long as the `key` field is present in `manifest.json`
- `dist.pem` is the private key that determines the extension ID — never regenerate it

**`chrome.identity` usage**
- `getAuthToken({ interactive: false })` on mount will fail silently at browser startup (cold token cache)
- Do NOT write `CALENDAR_CONNECTED=false` to localStorage on `lastError` — this causes Chrome to re-validate OAuth on every new tab and destabilizes the extension
- Only set `CALENDAR_CONNECTED=false` on explicit user disconnect, not on transient errors


## Extension Persistence (Unpacked / Dev)

Chrome and Brave do NOT persist unpacked extensions across restarts if the extension registration is stale or corrupt. Symptoms:
- Extension disappears from `chrome://extensions` after browser restart
- `chrome://extensions` shows `newtab` override as `[]` (empty)
- Extension ID is not present in `~/.config/google-chrome/Default/Extensions/`

**Root causes and fixes:**

1. **Missing `key` in built manifest** — without `key`, Chrome assigns a random ID each install. The `key` must be the base64 public key derived from `dist.pem`. The Vite build pipeline handles this automatically from `.env.local`.

2. **CSP violations on extension page load** — inline styles or external preconnect links that violate the CSP cause Chrome to log errors on every new tab. Accumulation of these errors causes Chrome to drop the extension after restart. Fix: ensure CSP includes the correct SHA-256 hash for inline styles and remove all external preconnect/dns-prefetch links from `index.html`.

3. **Stale/duplicate extension entry in browser Preferences** — if the extension was loaded before the `key` was set, a stale entry with a different ID may conflict. Fix: remove the stale entry from `~/.config/google-chrome/Default/Preferences` or `~/.config/BraveSoftware/Brave-Browser/Default/Preferences` using the Python cleanup script below, then reload unpacked.

**Cleanup script for stale Preferences entries:**
```python
import json, shutil

# Use the correct path for your browser:
# Chrome:  ~/.config/google-chrome/Default/Preferences
# Brave:   ~/.config/BraveSoftware/Brave-Browser/Default/Preferences
path = "/home/rajauluddin/.config/BraveSoftware/Brave-Browser/Default/Preferences"
shutil.copy(path, path + ".bak")

with open(path) as f:
    prefs = json.load(f)

ext_id = "bjmcgcoepohfafggeieneebblajgijcb"
settings = prefs["extensions"]["settings"]
if ext_id in settings:
    del settings[ext_id]

for section in ["settings", "settings_encrypted_hash"]:
    macs = prefs.get("protection", {}).get("macs", {}).get("extensions", {}).get(section, {})
    if ext_id in macs:
        del macs[ext_id]

with open(path, "w") as f:
    json.dump(prefs, f, separators=(',', ':'))
```
Run with browser fully closed. Then reopen and Load unpacked → `dist/`.

**Extension ID:** `bjmcgcoepohfafggeieneebblajgijcb` (stable, derived from `dist.pem`)


## localStorage Keys

| Key | Contents |
|---|---|
| `startpage-settings` | Main Settings object |
| `neko-bookmarks` | BookmarkCategory[] |
| `neko-bg-image` | base64 background image |
| `neko-scratchpad` | notes text |
| `neko-checklist` | CheckItem[] |
| `neko-journal` | Record<YYYY-MM-DD, string> |
| `neko-daily-goal` | { text, date } |
| `neko-aliases` | UrlAlias[] |
| `neko-recent` | RecentItem[] (last 10 launches) |
| `neko-timer-start` | timestamp or null |
| `neko-font` | selected font family string |
| `neko-gh-streak-{user}` | cached GitHub streak data |
| `neko-calendar-connected` | `'true'` or `'false'` string |
| `neko-calendar-last-event` | JSON CalendarEvent or absent |

## Google Calendar Integration Notes

- Hook: `src/hooks/useGoogleCalendar.ts`
- Component: `src/components/UpcomingEvent.tsx`
- OAuth client ID injected at build time from `.env.local` → `GOOGLE_CLIENT_ID`
- Extension key injected at build time from `.env.local` → `GOOGLE_EXTENSION_KEY`
- Calendar permission scope: `https://www.googleapis.com/auth/calendar.events.readonly`
- Token is fetched non-interactively on mount; interactive only on explicit user connect
- `CALENDAR_CONNECTED` localStorage key is used to pre-reserve UI space before token is confirmed — do not reset it on transient startup errors

## PR Review Checklist for Contributors

When reviewing PRs that touch the extension manifest or OAuth:
- [ ] No hardcoded client IDs or API keys in source files
- [ ] `.env.local` values accessed via `import.meta.env.VITE_*` or Vite build injection only
- [ ] No `<link rel="preconnect">` to external domains added to `index.html`
- [ ] If inline styles are added/changed in `index.html`, the CSP hash must be updated
- [ ] `chrome.identity` error handlers do not write negative state to localStorage on transient failures
- [ ] Extension key (`dist.pem`) not regenerated or modified
