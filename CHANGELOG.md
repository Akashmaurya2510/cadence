# Changelog

## 1.3.2 — September 2026

Tidying up after deleted tasks.

- **Fix**: Session history now remembers a task's name even after you delete it, instead of showing a bare "Deleted task" — both in the log itself and in the task filter dropdown.
- **Improved**: Older sessions logged before this fix (with no name to recover) are grouped into a single "Deleted tasks (name unavailable)" filter entry instead of a wall of identical, indistinguishable rows.

## 1.3.1 — September 2026

Fix a typo after the fact.

- **New**: Tap any entry in Session history to edit its note — add one you skipped, fix a typo, or clear it out. Works for focus and break entries alike.

## 1.3.0 — September 2026

Ask, don't assume.

- **New**: Tapping Focus, Short Break, or Long Break now asks which task it's for — handy for tagging a break as lunch or an errand. Fully optional, one tap to skip.
- **Improved**: That popup stays quiet once a task is already selected for Focus, or once you've already answered it for the current break.
- **Fix**: If a session finished while the app was closed or backgrounded, the "what did you work on" note now shows when you come back instead of being silently skipped.

## 1.2.0 — September 2026

A real desktop layout.

- **Improved**: On wide screens (≥1024px), the timer and task list now sit side by side instead of stacking in one narrow centered column — the timer ring is bigger too.

## 1.1.6 — August 2026

Fewer accidental taps.

- **New**: Starting a focus session with no task selected now asks first, so you don't lose time to an untracked block by accident.
- **New**: "Clear completed" now asks before clearing your done tasks.

## 1.1.5 — August 2026

Duplicate task.

- **New**: Task menu (⋯) now has a "Duplicate" action — makes a fresh copy with the same title, duration, and list, ready to start again.

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
