# Changelog

## 1.0.5 — August 2026

Recurring daily tasks.

- **New**: Tasks can be marked "Repeat daily" from the "⋯" menu — a small ↻ badge shows on the title. Marking one done resets it automatically the next day instead of piling up as permanently completed.
- **Fix**: "Clear completed" no longer deletes recurring tasks — it resets them (unchecks + zeroes progress) for their next occurrence instead of removing them.

## 1.0.4 — August 2026

Cleaner task cards.

- **Improved**: Progress and focus length are now plain text instead of bordered chips, and pause/delete are tucked into a single "⋯" menu.
- **Improved**: The Today/Later chip is hidden on the Today and Later tabs since it's redundant there.

## 1.0.3 — August 2026

Two small polish fixes.

- **Fix**: Tapping an already-selected task now deselects it in place — removed the separate "Unselect" chip and cleaned up the task action buttons.
- **Fix**: Switching themes no longer leaves a stale dark strip on screen until you refresh the page.

## 1.1.0 — August 2026

Advanced focus features and performance polish.

- **Keyboard Shortcut Modal**: Press `?` to view all shortcuts.
- **Advanced Haptics**: Enhanced tactile feedback for session boundaries.
- **Web Notifications**: Automatic browser notifications for session completion.
- **Accessibility**: Added ARIA labels for improved screen reader support.
- **Performance**: Upgraded Service Worker to Stale-While-Revalidate caching.

## 1.0.0 — August 2026

Initial build — a calm, fully local pomodoro timer.

- Focus / short break / long break timer with tasks, streaks, reports, and badges.
- Installable offline app (PWA) with themes, zen mode, and haptics.
- Everything stays on your device — export, import, and CSV backup built in.
