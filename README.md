# Cadence

A calm pomodoro timer you can host from a phone, a laptop, or any static server.

Vanilla HTML, CSS, and JavaScript. No build step, no accounts, nothing uploaded.

## Features

- Focus / short break / long break ring timer, with an “up next” preview
- Zen mode while a focus session is running — tap the timer to bring chrome back
- Five themes: Graphite, Linen, Moss, Dusk, **OLED**
- Daily, weekly, and monthly goals
- Tasks: edit, reorder, today/later, pause, pomodoro targets, undo delete
- Optional session notes after a completed focus block
- Reports: weekly bars, heatmap, hourly focus, time-by-task, longest streak, completion rate
- Session log with search, task filter, and pagination
- Sound (chime / bell / wood), optional tick, vibration, notifications
- Export JSON, copy JSON to clipboard, import with validation, report PNG
- Installable PWA with offline cache
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
js/app.js
favicon.svg
manifest.json
sw.js
icons/icon-192.png
icons/icon-512.png
icons/icon-192-maskable.png
icons/icon-512-maskable.png
icons/apple-touch-icon.png
```
