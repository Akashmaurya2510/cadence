# Cadence

A calm pomodoro timer you can host from a phone, a laptop, or any static server.

Vanilla HTML, CSS, and JavaScript. No build step, no accounts, nothing uploaded.

## Features

- Focus / short break / long break ring timer, with an “up next” preview and estimated end time
- Live tab title while the timer runs
- Active task shown on the ring; custom focus length per task (15 / 25 / 45 / 50 / 90)
- Tap a task to select it; **Start focus** runs the timer; auto-strike when target is met
- Zen mode while a focus session is running — tap the timer to bring chrome back
- Five themes + **Auto** (follows system light/dark): Graphite, Linen, Moss, Dusk, **OLED**
- Break suggestions on short/long breaks
- Daily review prompt when you hit your daily goal
- Daily, weekly, and monthly goals
- Tasks: edit, reorder, today/later, pause, pomodoro targets, undo delete
- Optional session notes after a completed focus block
- Reports: weekly bars, heatmap, hourly focus, time-by-task, longest streak, completion rate
- Click a heatmap cell or week bar to open that day in the Log
- Heatmap weekday labels; cleaner mobile hour chart
- Session log with search, task filter, Today / This week chips, and pagination
- Sound (chime / bell / wood), volume, optional tick, vibration, notifications
- Export JSON / CSV, copy JSON to clipboard, import with validation, report PNG
- Installable PWA with offline cache (system fonts keep it sharp offline)
- Keyboard shortcuts (`?` to view, `T` to add a task)
- Changelog popup when you ship a new version

All data stays in the browser (`localStorage`). Nothing is uploaded.

## Run on Termux

```bash
pkg update
pkg install python
cd cadence
python -m http.server 8080
```

Open `http://127.0.0.1:8080` in your phone browser.

If Python is missing:

```bash
pkg install nodejs-lts
npx --yes serve -l 8080
```

## Host it

Copy this folder to any static host:

- GitHub Pages
- Netlify Drop
- Cloudflare Pages
- nginx / caddy / apache
- A VPS: `python -m http.server 80` or `npx serve`

No build step. `index.html` is the app.

For GitHub Pages, enable Pages on the branch that contains `index.html` at the repo root (or `/docs`).

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
| Esc | Close drawer / modal |

## Backup

Settings → **Export report JSON** or **Copy data to clipboard**. Keep that file. Import it later on another device.

Cadence will nudge you if it has been a couple of weeks since the last export.

## Changelog popup

When you ship a new version, add an entry at the top of `CHANGELOG` in `js/app.js` and bump `APP_VERSION`. Returning visitors see a “what’s new” popup once. First-time visitors get the welcome tour instead.

```js
const APP_VERSION = "2.1.0";
const CHANGELOG = [
  {
    version: "2.1.0",
    date: "September 2026",
    title: "Cadence 2.1",
    blurb: "A short line about this release.",
    items: [
      { tag: "New", text: "The thing you added." },
      { tag: "Fix", text: "The thing you fixed." },
    ],
  },
  // keep older versions below
];
```

Replay the tour or the changelog anytime from Settings.

## Files

```
index.html
css/styles.css
js/01-core.js       # namespace, settings, state, helpers
js/02-storage.js    # save / load / snapshot / import shape
js/03-stats.js      # streaks, demo seed, aggregations
js/04-audio.js      # sounds, vibrate, notify
js/05-theme.js      # themes + accents
js/06-tasks.js      # task list UI
js/07-reports.js    # reports + session log
js/08-timer-ui.js   # ring display
js/09-timer-core.js # tick, start/stop, phases
js/10-ui.js         # settings sheet, modals, export
js/11-boot.js       # resume timer, tour, service worker
favicon.svg
manifest.json
sw.js
icons/icon-192.png
icons/icon-512.png
icons/icon-192-maskable.png
icons/icon-512-maskable.png
icons/apple-touch-icon.png
```
