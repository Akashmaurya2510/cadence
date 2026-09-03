# Dev notes

Internal map of how Cadence is put together — for future-me (or anyone else
poking at this repo) so a change doesn't need to be re-derived from scratch
by reading all ~3,400 lines of `js/app.js` every time.

This is not user-facing documentation. See `README.md` for that.

## Files

- `index.html` — all markup, including every modal (they're just `<div class="modal">`
  elements toggled via an `open` class, not created/destroyed dynamically).
- `css/styles.css` — one stylesheet, theming via CSS custom properties (`--bg`,
  `--surface`, `--text`, `--accent`, etc.) redefined per theme under `data-theme`.
- `js/app.js` — the whole app. One IIFE, no build step, no modules. Organized
  into labeled sections (search for `// ====` banners) — see "Section map" below.
- `sw.js` — service worker. `CACHE` name must be bumped every release or
  installed PWAs won't pick up new files. `APP_VERSION` in app.js and the
  cache name should move together (they don't have to match exactly, but
  both need to change on every release, or updates silently don't ship).

## Why one big file, no build step

Intentional, not an oversight: this is a PWA with zero build tooling — no
bundler, no npm install step, nothing but static files served as-is. That
keeps deploy trivial (Termux → git push → GitHub Pages) but means:

- No ES modules with real `import`/`export` (would need a bundler or careful
  `<script type="module">` wiring across files, which adds real risk without
  a bundler to catch mistakes).
- Splitting `app.js` into multiple plain `<script>` files is possible but
  fragile: everything currently lives in one closure, so cross-file globals
  would need explicit thought about load order and naming collisions.

**Given that, the current approach to keeping this maintainable is:**
section banners for navigability, this file for the "map," and a startup
self-check (see below) as a safety net — rather than a risky structural
refactor. If a real build step ever gets added (e.g. esbuild/vite), revisit
this and actually split the file — it'd be low-risk at that point.

## Section map (in `js/app.js`, top to bottom)

1. Version/changelog data, settings defaults, accents, break-idea copy
2. **Core utilities** — pure helpers (`uid`, `fmtMs`, `dayKey`, `escapeHtml`, ...)
3. **Persistence** — `snapshot`/`save`/`load`, `normalizeTask`, schema migrations,
   `mergeSessions`/`mergeTasks` (used by import)
4. **Stats & streaks**
5. **Badges**
6. **Audio** — tick sound, chime synth
7. **Haptics, theme & visual feedback**
8. **Tasks** — CRUD, recurring schedule, soft-delete, list rendering
9. **Timer display** — the ring/pips/labels (not the engine — see #11)
10. **Reports** — weekly chart, task breakdown, trend badge, heatmap, hour chart
11. **Session log** — filter/search, task-filter dropdown, log rendering
12. **Timer engine** — `logSession`, `advance`, `tick`, zen mode, away-catch-up.
    This is the part most other things depend on; touch carefully.
13. **Settings drawer** — steppers, switches, sound picker
14. **Modals** — confirm dialog, note editor (create/edit/delete a session's note)
15. **Celebrations, tour & changelog**
16. **Report image export** — canvas-drawn PNG
17. Init tail — `load()`, migrations, `runStartupSelfCheck()`, `renderAll()`

## Data model

### Task (`state.tasks[]`, normalized by `normalizeTask`)

| field | type | notes |
|---|---|---|
| `id` | string | stable, never reused |
| `title` | string | |
| `done` | bool | manually checked, or auto-set when `pomodoros >= target` |
| `pomodoros` | number | completed focus sessions counted toward this task |
| `target` | number | 0 = no target |
| `focusMin` | number | 0 = use `settings.focus`; else 15–180, step 15 |
| `due` | `"today" \| "later" \| null` | |
| `archived` | bool | "Paused" tab |
| `remainingSec` | number | leftover time when a custom-length session is interrupted |
| `recurring` | bool | |
| `recurDays` | `number[] \| null` | day-of-week (0=Sun..6=Sat); `null`/empty = every day |
| `doneOnDay` | string (dayKey) | used by `resetRecurringTasks` to know when to un-check |
| `deleted` | bool | soft-delete — task stays in the array, hidden from normal views |
| `deletedAt` | number (ms) \| null | drives the 30-day auto-purge and the countdown label |

Deleting a task never removes it outright — see `deleteTask` (soft) vs
`purgeTask`/`purgeExpiredTrash` (hard). This exists specifically so Session
History can keep showing a real task name after deletion (see below).

### Session (`state.sessions[]`, appended by `logSession`)

| field | type | notes |
|---|---|---|
| `id` | string | |
| `mode` | `"focus" \| "short" \| "long"` | |
| `startedAt` / `endedAt` | number (ms) | |
| `durationSec` | number | |
| `taskId` | string \| undefined | set from `activeTaskId` (focus) or `breakTaskId` (break) |
| `taskTitle` | string \| undefined | **snapshot** of the task's title at logging time |
| `completed` | bool | false = skipped |
| `note` | string \| undefined | editable after the fact via `openLogNoteEditor` |

**Why `taskTitle` exists:** sessions reference tasks by id, but tasks can be
deleted (soft or hard) or renamed later. Snapshotting the title at logging
time means history stays readable — `sessionTaskTitle(s)` prefers the live
task title if the task still exists, falls back to the snapshot with a
"(deleted)" suffix if not, and only shows a bare "Deleted task" for sessions
logged before this snapshot existed (pre-1.7 data, unrecoverable, and grouped
together in the Log filter / Time-by-task breakdown rather than shown as
individual indistinguishable rows).

### Settings (`settings`, flat object, not nested)

Durations in minutes: `focus` (15–180, step 15), `short`, `long`. `interval`
= sessions before a long break. `dailyGoal`/`weeklyGoal`/`monthlyGoal` in
session counts. See the object literal near the top of `app.js` for the
full field list and defaults — deliberately not duplicated here since it's
one glance away and this doc would just go stale.

## Conventions to keep following

- **Every release**: bump `APP_VERSION`, add a `CHANGELOG` entry (top of the
  array = newest), mirror it into `CHANGELOG.md`, and bump the `CACHE` name
  in `sw.js`. Skipping the cache bump means installed PWAs silently keep
  running old code.
- **New task/session fields**: add to `normalizeTask` (or the session-building
  code in `logSession`) with a sane default, so old localStorage data
  loads cleanly. Look at how `recurDays` or `deleted`/`deletedAt` were added
  for the pattern — clamp/validate on load, never trust stored data blindly.
- **Anything that changes a stepper's grid** (like the focus-length range
  change in 1.8.0): add a one-time snap-to-nearest-valid-value migration in
  `load()`, the same way `settings.focus` is handled. Otherwise existing
  users get stuck with an off-grid value the UI can no longer produce.
- **Modals that resolve a Promise** (`taskPromptModal`, `askConfirm`): if you
  add another one, make sure `closeTopModal()` (Escape key / backdrop) either
  resolves the promise or is explicitly excluded — a modal that's dismissed
  without resolving its promise will hang whatever was awaiting it.
- **Run `node -c js/app.js` after every edit.** It's caught real mistakes
  (duplicate `const` names, mismatched quotes) multiple times in this
  project's history — cheap insurance, no reason to skip it.

## Diagnostics

`runStartupSelfCheck()` runs once on load (wrapped in try/catch, never
touches the UI) and `console.warn`s about things like duplicate ids,
sessions with corrupted timestamps, or an `activeTaskId` pointing nowhere.
It's a safety net for catching data issues early — check the console
(remote-debug the PWA via `chrome://inspect` from a desktop Chrome, or just
open it in a desktop browser tab against the same localStorage) if something
seems off after a merge/import or a manual localStorage edit.
