# Changelog

## 1.0.4 — August 2026

- Fix: the "Theme default" accent dot was mirroring whatever accent override you selected (e.g. turning into a second Coral dot after picking Coral), because it read the live `--work` variable that overrides rewrite. It now always shows the current theme's real native color.

## 1.0.3 — August 2026

- Fix: the completion sound is now warmed up on Start (a real tap) instead of first touched minutes later from a background timer — more reliable after a long screen-lock.
- Polish: fonts now load via a proper `<link>` instead of a render-blocking CSS `@import`.

## 1.0.2 — August 2026

- Fix: the "Okay" button's footer in the What's new popup no longer shows a mismatched solid-white box against the frosted-glass background — most visible on light themes like Linen.

## 1.0.1 — August 2026

- Polish: the "Theme default" accent dot now shows a ✦ mark, making clear it's meant to shift with your theme rather than looking like a color glitch.

## 1.0.0 — August 2026

Initial build — a calm, fully local pomodoro timer.

- Focus / short break / long break timer with tasks, streaks, reports, and badges.
- Installable offline app (PWA) with themes, zen mode, and haptics.
- Everything stays on your device — export, import, and CSV backup built in.
