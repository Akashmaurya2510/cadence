# Changelog

Cadence shows a “what’s new” popup to returning visitors whenever `APP_VERSION` in `js/app.js` is newer than the version they last dismissed.

Edit **both** `APP_VERSION` and the `CHANGELOG` array in `js/app.js` — this markdown file is only a human-readable copy.

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
