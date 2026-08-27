# Cadence

A calm pomodoro timer you can host from a phone, a laptop, or any static server.

Vanilla HTML, CSS, and JavaScript. **No build step**, no accounts, nothing uploaded. All data stays in the browser (`localStorage`).

## Features

### Timer
- Focus / short break / long break ring with “up next” and estimated end time
- Live tab title while the timer runs
- Timer **survives refresh and app close** (resumes from `endsAt`)
- **Zen mode** while focusing: chrome hidden, scroll locked, timer centered — tap the ring to exit
- Active task label on the ring; custom focus length per task (15 / 25 / 45 / 50 / 90)
- Break suggestions on short/long breaks
- Haptics and light micro-interactions on start, pause, complete, and key UI actions

### Tasks
- Tap to select · tap again to unselect · **Start focus** to run the timer
- Auto-strike when a pomodoro target is met (manual complete still works)
- Edit, reorder, today/later, pause, undo delete

### Look & feel
- Themes: Graphite, Linen, Moss, Dusk, OLED + **System** (follows light/dark)
- Independent **accent** colors (amber, coral, mint, violet, rose, sky)
- Lucide-style icons on the tab bar and header
- Compact layout toggle; optional confirm-before-skip

### Reports & log
- Daily / weekly / monthly goals and mini stats under the timer
- Weekly bars, heatmap (weekday labels), hourly focus, time-by-task
- Click heatmap or week bar → that day in the Log
- Session log with search, task filter, Today / This week, pagination
- Optional note after a completed focus block
- Daily review prompt when you hit your goal

### Data & PWA
- Export JSON / sessions CSV / tasks CSV · copy JSON · import with validation · report PNG
- Installable PWA with offline cache; network-first shell so refreshes pick up new builds
- Keyboard shortcuts (`?` or Settings → Keyboard shortcuts)
- Footer: **Built with ❤️ by Akash Maurya** · last updated opens What’s new

## Run on Termux

```bash
pkg update
pkg install python
cd cadence
python -m http.server 8080
```

Open `http://127.0.0.1:8080` in your phone browser.

Alternative:

```bash
pkg install nodejs-lts
npx --yes serve -l 8080
```

## Host it

Copy this folder to any static host (GitHub Pages, Netlify Drop, Cloudflare Pages, nginx, etc.). No build step — `index.html` is the app.

For GitHub Pages, enable Pages on the branch that has `index.html` at the repo root.

## Shortcuts

| Key | Action |
| --- | --- |
| Space | Start / pause |
| R | Reset |
| N or S | Skip |
| 1 / 2 / 3 | Focus / short / long |
| T | Focus the task input |
| , | Settings |
| ? | Shortcut list |
| Esc | Close settings / modal |

## Backup

Settings → **Export report JSON**, **Export sessions CSV**, **Export tasks CSV**, or **Copy data to clipboard**. Import JSON to restore. Cadence nudges you if you have history and have not exported in a while.

## Shipping a new version

Only do this for a genuinely notable change — not every small fix needs a version bump or a changelog entry.

1. Bump `APP_VERSION` in `js/app.js`
2. Add an entry at the top of the in-app `CHANGELOG` array **with a matching `version` string** — if this is skipped, `unseenChangelog()` can't find the current version in the list and falls back to showing the *entire* history to every returning user
3. Bump the cache name in `sw.js` to match (e.g. `cadence-v1.1.0`) — otherwise installed PWAs never see the update at all
4. Update the footer date in `index.html` if you want

Returning visitors see What's new once. First-time visitors get the welcome tour.

```js
const APP_VERSION = "1.1.0";
const CHANGELOG = [
  {
    version: "1.1.0",
    date: "August 2026",
    title: "Cadence 1.1",
    blurb: "A short line about this release.",
    items: [
      { tag: "New", text: "The thing you added." },
      { tag: "Fix", text: "The thing you fixed." },
    ],
  },
  // keep older versions below
];
```

## Files

```
index.html
css/styles.css
js/app.js
favicon.svg
manifest.json
sw.js
icons/icon-192.png
icons/icon-512.png
icons/icon-192-maskable.png
icons/icon-512-maskable.png
icons/apple-touch-icon.png
CHANGELOG.md
README.md
```
