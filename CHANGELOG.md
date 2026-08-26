# Changelog

## 2.6.1 — August 2026

- **Fix** A session that finished while the app was closed (e.g. started at night, reopened next morning) was logged with the reopen time instead of when it actually happened. Now logged with the real start/end times, quietly, with no sound or notification firing after the fact.

## 2.6.0 — August 2026

- **New** Badges on Reports: 7/30/100-day streaks, 10/50/100 hours focused — a fixed set, no open-ended achievement grind.
- **New** Already-earned badges from your existing history are recognized immediately (quietly, no toast pile-up on first load); new ones unlock live with a toast.

## 2.5.5 — August 2026

- **Fix** Switching tasks no longer resets a paused focus timer. Remaining time is stored per task (e.g. pause Tarun Sir at 52/60, do Nimisha Mam, come back — leftover minutes are still there).

## 2.5.0 — August 2026

- **New** Two new themes, Glacier (cool slate/ice) and Espresso (warm copper/sage), replacing Moss and Dusk.
- **New** Aurora — a hidden theme that unlocks as a surprise reward at a 7-day streak.
- **Polish** Frosted-glass treatment on the theme popover and all modals (blur, saturation, subtle top-edge sheen).
- **Polish** Add-task button now uses a proper icon instead of a plain "+".
- **Fix** Removed a leftover dead reference from the earlier sample-history removal.

## 2.4.6 — August 2026

- **Polish** Zen mode: scroll locked, chrome removed from layout, timer centered (no empty scroll).
- **Polish** Haptics and micro-interactions on start, pause, complete, select, tabs, and toggles.
- **Polish** Lucide-style icons on tab bar and header; sample history loader removed.

## 2.4.0 — August 2026

- **New** Full-screen settings sheet (not a side drawer).
- **New** Site footer with last-updated → What’s new; changelog close (X).
- **Fix** Task select / unselect; shortcuts live in Settings.
- **Fix** PWA network-first shell so refresh picks up new builds.
- **Fix** Running timer persists across refresh and app close.

## 2.3.0 — August 2026

Theme + accent picker, mini stats, compact mode, confirm-before-skip.

## 2.2.0 — August 2026

Theme, tasks, and reports polished for mobile; click task to focus; auto-strike on target.

## 2.1.0 — August 2026

Live title, active task on ring, break ideas, CSV export, Auto theme.

## 2.0.0 — August 2026

Quieter timer, richer reports, home-screen PWA — fully local.
