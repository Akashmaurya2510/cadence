# Changelog

Cadence shows a “what’s new” popup to returning visitors whenever `APP_VERSION` in `js/app.js` is newer than the version they last dismissed.

Edit **both** `APP_VERSION` and the `CHANGELOG` array in `js/app.js` — this markdown file is only a human-readable copy.

## 2.1.0 — August 2026

Cadence 2.1. Live title, active task on the ring, break ideas, CSV export, and calmer polish — still fully local.

- **New** Live tab title with mode and estimated end time.
- **New** Active task shown on the ring; custom focus length per task.
- **New** Break suggestions, daily review prompt, and sound volume.
- **New** Heatmap and week bars open the matching log filter.
- **New** CSV export, system theme auto, Today/This-week log chips.
- **Polish** Stronger background resync, aria-live timer, focus-visible, system fonts offline.
- **Polish** Sample history auto-clears on your first real completed focus.

## 2.0.0 — August 2026

Cadence 2.0. A quieter timer, richer reports, and a home-screen app — still fully local.

- **New** Install Cadence as a standalone app, with offline support.
- **New** Zen mode hides chrome while you focus. Tap the timer to bring it back.
- **New** Session notes, vibration, and three completion sounds.
- **New** Edit, reorder, pause, and set pomodoro targets on tasks.
- **New** Longest streak, completion rate, time-by-task, and weekly/monthly goals.
- **New** Search the log, export a report image, and copy a JSON backup.
- **Fix** Settings drawer and tab bar hold up on mobile zoom and gesture bars.
- **Fix** Clear-all-data now asks first. Mode switches warn if a session is in progress.
- **Fix** Import validates session/task shape and rolls back on failure.
- **Fix** Task list is no longer silently capped at six items. Log paginates instead of stopping at 80.
