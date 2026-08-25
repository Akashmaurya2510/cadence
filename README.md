# Cadence

A calm pomodoro timer you can host from a phone, a laptop, or any static server.

## Features

- Focus / short break / long break ring timer
- Five themes: Graphite, Linen, Moss, Dusk, **OLED**
- Daily goal, cycle pips, streak
- Task list with pomodoro counts
- Reports: weekly bars, activity heatmap, hourly focus
- Session log
- Sound, optional tick, notifications
- Export / import JSON
- Keyboard shortcuts (`?` to view)

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

## Shortcuts

| Key | Action |
| --- | --- |
| Space | Start / pause |
| R | Reset |
| N or S | Skip |
| 1 / 2 / 3 | Focus / short / long |
| , | Settings |
| ? | Shortcut list |

## Backup

Settings → **Export report JSON**. Keep that file. Import it later on another device.
