(function () {
  const R = 120, C = 2 * Math.PI * R;
  const KEY = "cadence-v1-static";
  const TOUR_KEY = "cadence-v1-tour-done";
  const CHANGELOG_SEEN_KEY = "cadence-changelog-seen";
  const CELEBRATE_KEY = "cadence-celebrated";
  const LOG_PAGE = 40;
  const MODE_LABEL = { focus: "Focus", short: "Short Break", long: "Long Break" };
  const THEME_COLORS = { graphite: "#15171b", linen: "#e9ebee", glacier: "#0d1420", espresso: "#1c1512", oled: "#000000", aurora: "#0a0e14" };

  const APP_VERSION = "1.3.2";
  const SCHEMA_VERSION = 2;
  const CHANGELOG = [
    {
      version: "1.3.2",
      date: "September 2026",
      title: "Cadence 1.3.2",
      blurb: "Tidying up after deleted tasks.",
      items: [
        { tag: "Fix", text: "Session history now remembers a task's name even after you delete it, instead of showing a bare \"Deleted task\" — both in the log itself and in the task filter dropdown." },
        { tag: "Improved", text: "Older sessions logged before this fix (with no name to recover) are grouped into a single \"Deleted tasks (name unavailable)\" filter entry instead of a wall of identical, indistinguishable rows." },
      ],
    },
    {
      version: "1.3.1",
      date: "September 2026",
      title: "Cadence 1.3.1",
      blurb: "Fix a typo after the fact.",
      items: [
        { tag: "New", text: "Tap any entry in Session history to edit its note — add one you skipped, fix a typo, or clear it out. Works for focus and break entries alike." },
      ],
    },
    {
      version: "1.3.0",
      date: "September 2026",
      title: "Cadence 1.3.0",
      blurb: "Ask, don't assume.",
      items: [
        { tag: "New", text: "Tapping Focus, Short Break, or Long Break now asks which task it's for — handy for tagging a break as lunch or an errand. Fully optional, one tap to skip." },
        { tag: "Improved", text: "That popup stays quiet once a task is already selected for Focus, or once you've already answered it for the current break." },
        { tag: "Fix", text: "If a session finished while the app was closed or backgrounded, the \"what did you work on\" note now shows when you come back instead of being silently skipped." },
      ],
    },
    {
      version: "1.2.0",
      date: "September 2026",
      title: "Cadence 1.2.0",
      blurb: "A real desktop layout.",
      items: [
        { tag: "Improved", text: "On wide screens, the timer and task list now sit side by side instead of stacking in one narrow centered column — the timer ring is bigger too." },
      ],
    },
    {
      version: "1.1.6",
      date: "August 2026",
      title: "Cadence 1.1.6",
      blurb: "Fewer accidental taps.",
      items: [
        { tag: "New", text: "Starting a focus session with no task selected now asks first, so you don't lose time to an untracked block by accident." },
        { tag: "New", text: "\"Clear completed\" now asks before clearing your done tasks." },
      ],
    },
    {
      version: "1.1.5",
      date: "August 2026",
      title: "Cadence 1.1.5",
      blurb: "Duplicate a task in one tap.",
      items: [
        { tag: "New", text: "Task menu (⋯) now has a Duplicate action — makes a fresh copy with the same title, duration, and list, ready to start again." },
      ],
    },
    {
      version: "1.0.4",
      date: "August 2026",
      title: "Cadence 1.0.4",
      blurb: "Cleaner task cards.",
      items: [
        { tag: "Improved", text: "Task cards are less cluttered — progress and focus length now sit as plain text, and the pause/delete icons are tucked into a single menu." },
        { tag: "Improved", text: "The Today/Later chip is hidden on the Today and Later tabs, since it's redundant there." },
      ],
    },
    {
      version: "1.0.3",
      date: "August 2026",
      title: "Cadence 1.0.3",
      blurb: "Two small polish fixes.",
      items: [
        { tag: "Fix", text: "Tapping a selected task now deselects it — the separate Unselect chip is gone." },
        { tag: "Fix", text: "Switching themes no longer leaves a stale dark strip on screen until you refresh." },
      ],
    },
    {
      version: "1.0.2",
      date: "August 2026",
      title: "Cadence 1.0.2",
      blurb: "Three production polish additions — tab status, zero-latency chime, and backup/restore.",
      items: [
        { tag: "New", text: "Dynamic browser tab title shows remaining time while focusing; tab flashes on session complete." },
        { tag: "New", text: "Built-in Web Audio API chime synthesizer — no external files needed for notifications." },
        { tag: "New", text: "Backup & Restore card in Settings — export a full localStorage snapshot as a date-stamped .json file and restore it on any device." },
      ],
    },
    {
      version: "1.0.1",
      date: "August 2026",
      title: "Cadence 1.0.1",
      blurb: "A small update with two quality-of-life additions.",
      items: [
        { tag: "New", text: "Clear completed button in the task toolbar — quickly clean up done tasks with an undo." },
        { tag: "New", text: "Shift + E quick export shortcut — saves a JSON backup in one keystroke." },
      ],
    },
    {
      version: "1.0.0",
      date: "August 2026",
      title: "Cadence 1.0",
      blurb: "Initial build — a calm, fully local pomodoro timer.",
      items: [
        { tag: "New", text: "Focus/short break/long break timer with tasks, streaks, reports, and badges." },
        { tag: "New", text: "Installable offline app with themes, zen mode, and haptics." },
        { tag: "New", text: "Everything stays on your device — export, import, and CSV backup built in." },
      ],
    },
  ];

  const settings = {
    focus: 25, short: 5, long: 15, interval: 4,
    dailyGoal: 8, weeklyGoal: 40, monthlyGoal: 160,
    autoStart: false, sound: true, notify: false, tickSound: true,
    vibrate: true, soundChoice: "chime", volume: 2, themeAuto: false,
    accent: "sage", compact: false, confirmSkip: true, muted: true,
  };
  const ACCENTS = {
    sage:   { work: "#8aab74", soft: "rgba(138,171,116,0.16)", ink: "#0d150a" },
    amber:  { work: "#e7b54a", soft: "rgba(231,181,74,0.16)", ink: "#171308" },
    coral:  { work: "#ff6b4a", soft: "rgba(255,107,74,0.16)", ink: "#1a0a06" },
    mint:   { work: "#3dcfb6", soft: "rgba(61,207,182,0.14)", ink: "#03140f" },
    violet: { work: "#8c7ae6", soft: "rgba(140,122,230,0.16)", ink: "#0f0c1e" },
    rose:   { work: "#ff5470", soft: "rgba(255,84,112,0.16)", ink: "#170307" },
    sky:    { work: "#4aa3ff", soft: "rgba(74,163,255,0.16)", ink: "#061018" },
  };
  const VOLUME_LABEL = { 1: "Quiet", 2: "Normal", 3: "Loud" };
  const BREAK_IDEAS = [
    "Stand up and stretch your shoulders",
    "Drink a glass of water",
    "Look 20 feet away for 20 seconds",
    "Take three slow breaths",
    "Walk to a window",
    "Roll your neck gently",
    "Shake out your hands",
    "Step outside if you can",
  ];
  const state = {
    theme: "graphite",
    mode: "focus",
    secondsLeft: 25 * 60,
    running: false,
    timerId: null,
    endsAt: null,
    focusCount: 0,
    tasks: [],
    activeTaskId: null,
    sessions: [],
    demo: false,
    page: "timer",
    logFilter: "all",
    logTaskFilter: "all",
    logSearch: "",
    logLimit: LOG_PAGE,
    taskView: "open",
    lastExportAt: 0,
    zen: false,
    pendingAutoStart: false,
    pendingNoteId: null,
    lastTickSecond: null,
    logDayFilter: null,
    lastReviewDay: null,
    auroraUnlocked: false,
    badgesUnlocked: [],
    schemaVersion: SCHEMA_VERSION,
    taskPromptAsked: false,
    breakTaskId: null,
    editingLogNoteId: null,
  };

  const $ = (id) => document.getElementById(id);
  const ringProgress = $("ringProgress");
  ringProgress.style.strokeDasharray = `${C} ${C}`;

  const ticksG = $("ticks");
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30) * Math.PI / 180;
    const cx = 140, cy = 140, rO = 134, rI = 126;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", cx + rO * Math.cos(angle));
    line.setAttribute("y1", cy + rO * Math.sin(angle));
    line.setAttribute("x2", cx + rI * Math.cos(angle));
    line.setAttribute("y2", cy + rI * Math.sin(angle));
    line.setAttribute("class", "tick");
    ticksG.appendChild(line);
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }
  function durationFor(mode) {
    if (mode === "focus") {
      const t = state.activeTaskId && state.tasks.find((x) => x.id === state.activeTaskId);
      if (t && t.focusMin >= 5) return t.focusMin * 60;
      return settings.focus * 60;
    }
    return (mode === "short" ? settings.short : settings.long) * 60;
  }
  function taskFocusDuration(t) {
    if (t && t.focusMin >= 5) return t.focusMin * 60;
    return settings.focus * 60;
  }
  /** Persist leftover focus seconds onto the current task (when paused / switching). */
  function saveTaskRemaining() {
    if (state.mode !== "focus" || state.running) return;
    if (!state.activeTaskId) return;
    const t = state.tasks.find((x) => x.id === state.activeTaskId);
    if (!t) return;
    const full = taskFocusDuration(t);
    if (state.secondsLeft > 0 && state.secondsLeft < full) {
      t.remainingSec = state.secondsLeft;
    } else {
      t.remainingSec = 0;
    }
  }
  /** Clear leftover on a task (after complete / reset). */
  function clearTaskRemaining(taskId) {
    const t = state.tasks.find((x) => x.id === (taskId || state.activeTaskId));
    if (t) t.remainingSec = 0;
  }
  function pad(n) { return String(n).padStart(2, "0"); }
  function fmtMs(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    if (h <= 0) return m + "m";
    return m ? h + "h " + m + "m" : h + "h";
  }
  function dayKey(ts) {
    const d = new Date(ts);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function startOfDay(ts) {
    const d = new Date(ts || Date.now()); d.setHours(0, 0, 0, 0); return d.getTime();
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => {
      if (c === "&") return "&" + "amp;";
      if (c === "<") return "&" + "lt;";
      if (c === ">") return "&" + "gt;";
      if (c === '"') return "&" + "quot;";
      return "&#39;";
    });
  }
  function nextModeAfter(mode, focusCount) {
    if (mode === "focus") return (focusCount + 1) % settings.interval === 0 ? "long" : "short";
    return "focus";
  }

  function snapshot() {
    // Persist endsAt so a running timer survives refresh / app kill
    let endsAt = state.endsAt;
    let secondsLeft = state.secondsLeft;
    let running = !!state.running;
    if (running && endsAt) {
      secondsLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    }
    return {
      schemaVersion: SCHEMA_VERSION,
      settings, theme: state.theme, mode: state.mode, secondsLeft,
      running, endsAt: running ? endsAt : null,
      focusCount: state.focusCount, tasks: state.tasks, activeTaskId: state.activeTaskId,
      sessions: state.sessions, demo: state.demo, lastExportAt: state.lastExportAt,
      lastReviewDay: state.lastReviewDay, auroraUnlocked: !!state.auroraUnlocked,
      badgesUnlocked: state.badgesUnlocked,
    };
  }
  let lastSavedSnapshot = null;
  function save() {
    const currentSnapshot = snapshot();
    const serialized = JSON.stringify(currentSnapshot);
    if (serialized === lastSavedSnapshot) return;
    localStorage.setItem(KEY, serialized);
    lastSavedSnapshot = serialized;
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return false;
      const d = JSON.parse(raw);
      Object.assign(settings, d.settings || {});
      if (!settings.weeklyGoal) settings.weeklyGoal = 40;
      if (!settings.monthlyGoal) settings.monthlyGoal = 160;
      if (settings.vibrate == null) settings.vibrate = true;
      if (!settings.soundChoice) settings.soundChoice = "chime";
      state.theme = d.theme || "graphite";
      state.mode = d.mode || "focus";
      state.secondsLeft = d.secondsLeft != null ? d.secondsLeft : durationFor(state.mode);
      state.focusCount = d.focusCount || 0;
      state.tasks = Array.isArray(d.tasks) ? d.tasks.map(normalizeTask) : [];
      state.activeTaskId = d.activeTaskId || null;
      state.sessions = Array.isArray(d.sessions) ? d.sessions : [];
      state.demo = !!d.demo;
      state.lastExportAt = d.lastExportAt || 0;
      state.lastReviewDay = d.lastReviewDay || null;
      state.auroraUnlocked = !!d.auroraUnlocked;
      state.badgesUnlocked = Array.isArray(d.badgesUnlocked) ? d.badgesUnlocked : [];
      state.schemaVersion = d.schemaVersion || 1;
      // Restore timer across refresh — actual resume in resumeTimerIfNeeded()
      state._restoreEndsAt = typeof d.endsAt === "number" ? d.endsAt : null;
      state._restoreRunning = !!d.running && !!d.endsAt;
      if (settings.volume == null) settings.volume = 2;
      if (settings.themeAuto == null) settings.themeAuto = false;
      if (!settings.accent) settings.accent = "sage";
      if (settings.compact == null) settings.compact = false;
      if (settings.confirmSkip == null) settings.confirmSkip = true;
      // Tick sound is always available; only the mute button (defaults to muted) controls it.
      settings.tickSound = true;
      if (settings.muted == null) settings.muted = true;
      return true;
    } catch { return false; }
  }
  function normalizeTask(t) {
    const focusMin = Number(t.focusMin) || 0;
    const rem = Number(t.remainingSec);
    return {
      id: t.id || uid(),
      title: String(t.title || "Untitled"),
      done: !!t.done,
      pomodoros: Number(t.pomodoros) || 0,
      target: Number(t.target) || 0,
      focusMin: focusMin >= 5 && focusMin <= 90 ? focusMin : 0,
      due: t.due === "today" || t.due === "later" ? t.due : null,
      archived: !!t.archived,
      remainingSec: rem > 0 && rem <= 90 * 60 ? Math.floor(rem) : 0,
      recurring: !!t.recurring,
      doneOnDay: t.doneOnDay || null,
    };
  }
  /** Recurring tasks marked done on a previous day pop back to not-done. Returns true if anything changed. */
  function resetRecurringTasks() {
    const today = dayKey(Date.now());
    let changed = false;
    state.tasks.forEach((t) => {
      if (t.recurring && t.done && t.doneOnDay && t.doneOnDay !== today) {
        t.done = false;
        t.pomodoros = 0;
        t.doneOnDay = null;
        if (t.id === state.activeTaskId) t.remainingSec = 0;
        changed = true;
      }
    });
    return changed;
  }
  function isValidSession(s) {
    return s && typeof s === "object"
      && typeof s.id === "string"
      && (s.mode === "focus" || s.mode === "short" || s.mode === "long")
      && typeof s.startedAt === "number"
      && typeof s.endedAt === "number"
      && typeof s.durationSec === "number"
      && typeof s.completed === "boolean";
  }
  function isValidTask(t) {
    return t && typeof t === "object" && typeof t.id === "string" && typeof t.title === "string";
  }

  /** Combine this device's sessions with an imported set — never drops existing data.
   *  Same id on both sides = same session (e.g. re-importing the same file), kept once.
   *  Same mode + exact same start/end on both sides = treated as the same real session
   *  even if it somehow got a different id, so it isn't double-counted. */
  function mergeSessions(existing, incoming) {
    const byId = new Map();
    const timeKey = (s) => s.mode + "|" + s.startedAt + "|" + s.endedAt;
    const seenTimeKeys = new Set();
    existing.forEach((s) => { byId.set(s.id, s); seenTimeKeys.add(timeKey(s)); });
    let added = 0;
    incoming.forEach((s) => {
      if (byId.has(s.id)) {
        const cur = byId.get(s.id);
        if (!cur.note && s.note) cur.note = s.note; // fill in a note recorded on the other device
        return;
      }
      if (seenTimeKeys.has(timeKey(s))) return; // same real session, different id — skip the duplicate
      byId.set(s.id, s);
      seenTimeKeys.add(timeKey(s));
      added++;
    });
    return { sessions: Array.from(byId.values()), added };
  }
  /** Combine task lists by id. On a collision, keep whichever copy has made more
   *  progress (done, then higher pomodoro count) so neither device's progress is lost. */
  function mergeTasks(existing, incoming) {
    const byId = new Map();
    existing.forEach((t) => byId.set(t.id, t));
    let added = 0;
    incoming.forEach((t) => {
      if (!byId.has(t.id)) { byId.set(t.id, t); added++; return; }
      const cur = byId.get(t.id);
      const curScore = (cur.done ? 1e6 : 0) + (cur.pomodoros || 0);
      const incScore = (t.done ? 1e6 : 0) + (t.pomodoros || 0);
      if (incScore > curScore) byId.set(t.id, t);
    });
    return { tasks: Array.from(byId.values()), added };
  }

  function mulberry32(a) {
    return function () {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function focusSessions() {
    return state.sessions.filter((s) => s.mode === "focus" && s.completed);
  }
  function allFocus() {
    return state.sessions.filter((s) => s.mode === "focus");
  }
  function sumRange(from, to) {
    return focusSessions().filter((s) => s.endedAt >= from && s.endedAt < to).reduce((a, s) => a + s.durationSec, 0);
  }
  function countRange(from, to) {
    return focusSessions().filter((s) => s.endedAt >= from && s.endedAt < to).length;
  }
  function streak() {
    const days = new Set(focusSessions().map((s) => dayKey(s.endedAt)));
    let n = 0, cursor = startOfDay();
    if (!days.has(dayKey(cursor))) cursor -= 86400000;
    while (days.has(dayKey(cursor))) { n++; cursor -= 86400000; }
    return n;
  }
  function longestStreak() {
    const days = [...new Set(focusSessions().map((s) => dayKey(s.endedAt)))].sort();
    if (!days.length) return 0;
    let best = 1, cur = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1] + "T00:00:00").getTime();
      const now = new Date(days[i] + "T00:00:00").getTime();
      if (now - prev === 86400000) { cur++; best = Math.max(best, cur); }
      else cur = 1;
    }
    return Math.max(best, streak());
  }
  function checkAuroraUnlock() {
    if (state.auroraUnlocked) return;
    if (streak() < 7) return;
    state.auroraUnlocked = true;
    const card = $("auroraCard");
    if (card) card.hidden = false;
    save();
    setTimeout(() => {
      vibrate("success");
      toast("7-day streak · Aurora theme unlocked", "View", () => { const b = $("themeBtn"); if (b) b.click(); });
    }, 600);
  }
  function totalFocusSec() {
    return focusSessions().reduce((a, s) => a + s.durationSec, 0);
  }
  const BADGES = [
    { id: "streak7", label: "7-day streak", group: "streak", check: () => longestStreak() >= 7 },
    { id: "streak30", label: "30-day streak", group: "streak", check: () => longestStreak() >= 30 },
    { id: "streak100", label: "100-day streak", group: "streak", check: () => longestStreak() >= 100 },
    { id: "hours10", label: "10 hours focused", group: "hours", check: () => totalFocusSec() >= 10 * 3600 },
    { id: "hours50", label: "50 hours focused", group: "hours", check: () => totalFocusSec() >= 50 * 3600 },
    { id: "hours100", label: "100 hours focused", group: "hours", check: () => totalFocusSec() >= 100 * 3600 },
  ];
  function renderBadges() {
    const wrap = $("badgesRow");
    if (!wrap) return;
    wrap.innerHTML = BADGES.map((b) => {
      const earned = state.badgesUnlocked.includes(b.id);
      return '<div class="badge-chip ' + b.group + (earned ? " earned" : "") + '" title="' + b.label + (earned ? "" : " · not yet earned") + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>' +
        "<span>" + b.label + "</span></div>";
    }).join("");
  }
  function checkBadgeUnlocks(silent) {
    const newly = BADGES.filter((b) => !state.badgesUnlocked.includes(b.id) && b.check());
    if (!newly.length) return;
    newly.forEach((b) => state.badgesUnlocked.push(b.id));
    save();
    renderBadges();
    if (silent) return;
    let i = 0;
    const showNext = () => {
      if (i >= newly.length) return;
      const b = newly[i++];
      vibrate("success");
      toast(b.label + " unlocked", "View", () => { showPage("reports"); });
      setTimeout(showNext, 2600);
    };
    setTimeout(showNext, 700);
  }
  function avgFocusSec() {
    const list = focusSessions();
    if (!list.length) return 0;
    return Math.round(list.reduce((a, s) => a + s.durationSec, 0) / list.length);
  }
  function completionRate() {
    const all = allFocus();
    if (!all.length) return null;
    return Math.round((focusSessions().length / all.length) * 100);
  }
  function bestDay() {
    const map = {};
    focusSessions().forEach((s) => {
      const k = dayKey(s.endedAt);
      map[k] = (map[k] || 0) + s.durationSec;
    });
    let best = null, max = 0;
    Object.keys(map).forEach((k) => { if (map[k] > max) { max = map[k]; best = k; } });
    return best ? { key: best, sec: max } : null;
  }
  function bestHour() {
    const hours = Array.from({ length: 24 }, () => 0);
    focusSessions().forEach((s) => { hours[new Date(s.startedAt).getHours()] += s.durationSec; });
    let h = 0, max = 0;
    hours.forEach((v, i) => { if (v > max) { max = v; h = i; } });
    return max ? { hour: h, sec: max } : null;
  }
  function fmtHour(h) {
    const suffix = h >= 12 ? "pm" : "am";
    const n = h % 12 || 12;
    return n + suffix;
  }

  let audioCtx = null;
  function ctx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }
  function volScale() {
    // Higher multipliers so Loud is actually audible on phones
    const v = settings.volume || 2;
    return v === 1 ? 0.7 : v === 3 ? 2.4 : 1.5;
  }
  function tone(ac, freq, start, dur, type, gain) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    const scaled = Math.min(0.95, gain * volScale());
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(scaled, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(start); o.stop(start + dur + 0.02);
  }
  function playSound(choice) {
    if (!settings.sound) return;
    try {
      const ac = ctx();
      const t0 = ac.currentTime;
      const kind = choice || settings.soundChoice || "chime";
      if (kind === "bell") {
        tone(ac, 523, t0, 0.55, "sine", 0.42);
        tone(ac, 784, t0 + 0.08, 0.7, "sine", 0.32);
        tone(ac, 1046, t0 + 0.18, 0.9, "sine", 0.26);
      } else if (kind === "wood") {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = "triangle"; o.frequency.setValueAtTime(180, t0);
        o.frequency.exponentialRampToValueAtTime(60, t0 + 0.12);
        const wv = 0.55 * volScale();
        g.gain.setValueAtTime(wv, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
        o.connect(g); g.connect(ac.destination);
        o.start(t0); o.stop(t0 + 0.16);
        tone(ac, 140, t0 + 0.16, 0.1, "triangle", 0.35);
      } else {
        [0, 0.16, 0.32].forEach((t, i) => tone(ac, i === 2 ? 880 : 660, t0 + t, 0.16, "sine", 0.45));
      }
    } catch (e) { /* ignore */ }
  }

  function playChimeSynth() {
    try {
      const ac = ctx();
      const t0 = ac.currentTime;
      const peak = 0.42 * volScale();
      const osc1 = ac.createOscillator();
      const gain1 = ac.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, t0);
      gain1.gain.setValueAtTime(0.0001, t0);
      gain1.gain.linearRampToValueAtTime(peak, t0 + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
      osc1.connect(gain1).connect(ac.destination);
      osc1.start(t0);
      osc1.stop(t0 + 0.75);

      const osc2 = ac.createOscillator();
      const gain2 = ac.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, t0 + 0.18);
      gain2.gain.setValueAtTime(0.0001, t0 + 0.18);
      gain2.gain.linearRampToValueAtTime(peak * 0.85, t0 + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.0);
      osc2.connect(gain2).connect(ac.destination);
      osc2.start(t0 + 0.18);
      osc2.stop(t0 + 1.05);
    } catch (e) { /* ignore */ }
  }

  function renderMuteBtn() {
    const btn = $("muteBtn");
    const icon = $("muteIcon");
    if (!btn || !icon) return;
    const muted = !!settings.muted;
    btn.classList.toggle("is-muted", muted);
    btn.classList.toggle("ring-mute", true);
    btn.setAttribute("aria-pressed", muted ? "true" : "false");
    btn.setAttribute("aria-label", muted ? "Unmute tick sound" : "Mute tick sound");
    btn.title = muted ? "Tick muted — tap to unmute" : "Mute tick";
    icon.innerHTML = muted
      ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>'
      : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>';
  }
  function playTick() {
    // Tick is off by default and only plays when the ring speaker button is unmuted.
    // There's no separate tick-volume control — it always plays at full volume.
    if (settings.muted || state.mode !== "focus") return;
    if (document.visibilityState === "hidden") return;
    try {
      const ac = ctx();
      const t0 = ac.currentTime;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "square";
      o.frequency.value = 880;
      const peak = 0.55;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.045);
      o.connect(g); g.connect(ac.destination);
      o.start(t0); o.stop(t0 + 0.05);
    } catch (e) { /* ignore */ }
  }
  /** Haptic patterns — light taps for UI, stronger for session boundaries */
  function vibrate(kind) {
    if (!settings.vibrate || !navigator.vibrate) return;
    const patterns = {
      light: 12,
      medium: 28,
      select: 18,
      start: [20, 30, 20],
      pause: 24,
      done: [40, 60, 40],
      success: [30, 40, 30, 40, 50],
      warn: [50, 40, 50],
    };
    const p = patterns[kind] != null ? patterns[kind] : patterns.done;
    try { navigator.vibrate(p); } catch (e) { /* ignore */ }
  }
  function bump(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    // reflow so animation can retrigger
    void el.offsetWidth;
    el.classList.add(cls);
    const clear = () => el.classList.remove(cls);
    el.addEventListener("animationend", clear, { once: true });
    setTimeout(clear, 500);
  }
  function notify(title, body) {
    if (!settings.notify || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try { new Notification(title, { body, silent: true }); } catch (e) { /* ignore */ }
  }

  function applyAccent() {
    const root = document.documentElement;
    const a = ACCENTS[settings.accent] || null;
    if (!a) {
      root.style.removeProperty("--work");
      root.style.removeProperty("--work-soft");
      root.style.removeProperty("--work-ink");
    } else {
      root.style.setProperty("--work", a.work);
      root.style.setProperty("--work-soft", a.soft);
      root.style.setProperty("--work-ink", a.ink);
    }
    // Refresh mode accent vars via body data-mode (CSS already maps --accent)
    document.body.setAttribute("data-mode", state.mode || "focus");
  }
  function syncThemeUI() {
    document.querySelectorAll(".theme-card").forEach((c) => {
      if (c.id === "themeAutoBtn") c.classList.toggle("on", !!settings.themeAuto);
      else c.classList.toggle("on", !settings.themeAuto && c.dataset.t === state.theme);
    });
    document.querySelectorAll(".accent-dot").forEach((d) => {
      d.classList.toggle("on", d.dataset.accent === (settings.accent || "sage"));
    });
    if ($("switchThemeAuto")) {
      $("switchThemeAuto").classList.toggle("on", !!settings.themeAuto);
      $("switchThemeAuto").setAttribute("aria-checked", settings.themeAuto ? "true" : "false");
    }
  }
  function setTheme(theme, fromAuto) {
    if (!fromAuto) settings.themeAuto = false;
    state.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    const color = THEME_COLORS[theme] || "#15171b";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", color);
    // Keep the <html> inline background (set at boot to avoid a flash-of-wrong-theme)
    // in sync, otherwise it stays stuck on the old color until the page reloads.
    document.documentElement.style.background = color;
    applyAccent();
    syncThemeUI();
  }
  function applyTheme() {
    if (settings.themeAuto) {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const auto = dark ? "graphite" : "linen";
      state.theme = auto;
      document.documentElement.setAttribute("data-theme", auto);
      const color = THEME_COLORS[auto] || "#15171b";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", color);
      document.documentElement.style.background = color;
    } else {
      document.documentElement.setAttribute("data-theme", state.theme);
      const color = THEME_COLORS[state.theme] || "#15171b";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", color);
      document.documentElement.style.background = color;
    }
    applyAccent();
    syncThemeUI();
    document.body.classList.toggle("compact", !!settings.compact);
  }

  function renderPips() {
    const n = settings.interval, filled = state.focusCount % n;
    $("pips").innerHTML = "";
    for (let i = 0; i < n; i++) {
      const d = document.createElement("div");
      d.className = "pip" + (i < filled ? " filled" : "");
      $("pips").appendChild(d);
    }
  }

  function visibleTasks() {
    const view = state.taskView;
    let list = state.tasks.filter((t) => {
      if (view === "paused") return t.archived;
      if (t.archived) return false;
      if (view === "today") return t.due === "today" && !t.done;
      if (view === "later") return t.due === "later" && !t.done;
      return true;
    });
    if (view === "open") list = [...list.filter((t) => !t.done), ...list.filter((t) => t.done)];
    return list;
  }

  function closeAllTaskMenus() {
    document.querySelectorAll(".task-menu").forEach((m) => { m.hidden = true; });
    document.querySelectorAll(".kebab").forEach((b) => b.setAttribute("aria-expanded", "false"));
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest && e.target.closest(".kebab-wrap")) return;
    closeAllTaskMenus();
  });

  function renderTasks() {
    const list = $("taskList");
    list.innerHTML = "";
    const open = state.tasks.filter((t) => !t.done && !t.archived).length;
    $("openCount").textContent = open ? open + " open" : "";
    const items = visibleTasks();
    if (!items.length) {
      const empty = {
        open: "Name what you are working on.",
        today: "Nothing marked for today.",
        later: "Nothing parked for later.",
        paused: "No paused tasks.",
      }[state.taskView] || "No tasks here.";
      list.innerHTML = '<p class="today-line" style="padding:16px;text-align:center;border:1px solid var(--border);border-radius:12px;background:var(--surface)">' + empty + "</p>";
      return;
    }
    items.forEach((t, idx) => {
      const row = document.createElement("div");
      row.className = "task" + (t.id === state.activeTaskId ? " active" : "") + (t.done ? " done" : "");
      row.draggable = true;
      const pct = t.target > 0 ? Math.min(100, Math.round((t.pomodoros / t.target) * 100)) : 0;
      const dueLabel = t.due === "today" ? "Today" : t.due === "later" ? "Later" : "Inbox";
      const progressLabel = t.target > 0
        ? (t.pomodoros + "/" + t.target)
        : (t.pomodoros ? t.pomodoros + " done" : "Set target");
      const lenLabel = (t.focusMin || settings.focus) + "m";
      const showDueChip = state.taskView !== "today" && state.taskView !== "later";
      row.innerHTML =
        '<button class="chk" aria-label="Mark done"></button>' +
        '<div class="body">' +
          '<button class="title">' + (t.recurring ? '<span class="recur-badge" title="Repeats daily">&#8635;</span> ' : "") + escapeHtml(t.title) + "</button>" +
          '<div class="meta">' +
            (t.target > 0 ? '<div class="pomo-bar" title="' + progressLabel + '"><span style="width:' + pct + '%"></span></div>' : "") +
            '<button type="button" class="meta-text progress pomo-hit">' + progressLabel + "</button>" +
            '<span class="meta-dot">&middot;</span>' +
            '<button type="button" class="meta-text len focus-len" title="Focus length">' + lenLabel + "</button>" +
            (showDueChip ? '<button class="due-chip' + (t.due === "today" ? " today" : "") + '" type="button">' + dueLabel + "</button>" : "") +
          "</div>" +
          (t.archived || t.done ? "" : '<button type="button" class="start-focus">Start focus</button>') +
        "</div>" +
        '<div class="actions">' +
          '<button class="iconish up" aria-label="Move up" title="Move up">↑</button>' +
          '<button class="iconish down" aria-label="Move down" title="Move down">↓</button>' +
          '<div class="kebab-wrap">' +
            '<button class="iconish kebab" aria-label="More actions" aria-haspopup="true" aria-expanded="false">' +
              '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>' +
            "</button>" +
            '<div class="task-menu" hidden>' +
              '<button type="button" class="menu-item recur">' + (t.recurring ? "Stop repeating" : "Repeat daily") + "</button>" +
              '<button type="button" class="menu-item archive">' + (t.archived ? "Resume" : "Pause") + "</button>" +
              '<button type="button" class="menu-item dup">Duplicate</button>' +
              '<button type="button" class="menu-item del">Delete</button>' +
            "</div>" +
          "</div>" +
        "</div>";
      function selectTask(start) {
        if (t.archived || t.done) return;
        // Keep paused progress on the previous task before switching
        if (state.activeTaskId && state.activeTaskId !== t.id) {
          saveTaskRemaining();
        }
        state.activeTaskId = t.id;
        if (!state.running) {
          if (state.mode !== "focus") state.mode = "focus";
          const full = durationFor("focus");
          if (t.remainingSec > 0 && t.remainingSec < full) {
            state.secondsLeft = t.remainingSec;
          } else {
            state.secondsLeft = full;
            t.remainingSec = 0;
          }
        }
        save(); renderTasks(); renderTimer();
        showPage("timer");
        if (start && !state.running) startTimer();
        else if (!start) {
          vibrate("select");
          toast("Selected · " + t.title);
        }
      }
      function unselectTask() {
        saveTaskRemaining();
        state.activeTaskId = null;
        save(); renderTasks(); renderTimer();
        toast("Unselected");
      }
      row.querySelector(".chk").onclick = (e) => {
        e.stopPropagation();
        t.done = !t.done;
        t.doneOnDay = t.done ? dayKey(Date.now()) : null;
        if (t.done && state.activeTaskId === t.id) state.activeTaskId = null;
        save(); renderTasks();
        vibrate(t.done ? "medium" : "light");
        if (t.done) bump(row, "task-pop");
      };
      row.querySelector(".title").onclick = () => {
        if (t.id === state.activeTaskId) unselectTask();
        else selectTask(false);
      };
      row.querySelector(".title").ondblclick = (e) => { e.preventDefault(); startEdit(row, t); };
      const startBtn = row.querySelector(".start-focus");
      if (startBtn) startBtn.onclick = (e) => { e.stopPropagation(); selectTask(true); };
      const dueChip = row.querySelector(".due-chip");
      if (dueChip) {
        dueChip.onclick = (e) => {
          e.stopPropagation();
          t.due = t.due === "today" ? "later" : t.due === "later" ? null : "today";
          save(); renderTasks();
        };
      }
      const pomoHit = row.querySelector(".pomo-hit");
      if (pomoHit) {
        pomoHit.onclick = (e) => {
          e.stopPropagation();
          t.target = t.target >= 12 ? 0 : (t.target || 0) + 1;
          save(); renderTasks();
        };
      }
      const focusLen = row.querySelector(".focus-len");
      if (focusLen) {
        focusLen.onclick = (e) => {
          e.stopPropagation();
          const cycle = [0, 15, 25, 45, 50, 90];
          const i = cycle.indexOf(t.focusMin || 0);
          t.focusMin = cycle[(i + 1) % cycle.length];
          t.remainingSec = 0; // length changed — start fresh next time
          if (t.id === state.activeTaskId && state.mode === "focus" && !state.running) {
            state.secondsLeft = durationFor("focus");
            renderTimer();
          }
          save(); renderTasks();
        };
      }
      row.querySelector(".up").onclick = (e) => { e.stopPropagation(); moveTask(t.id, -1); };
      row.querySelector(".down").onclick = (e) => { e.stopPropagation(); moveTask(t.id, 1); };
      const kebabBtn = row.querySelector(".kebab");
      const taskMenu = row.querySelector(".task-menu");
      kebabBtn.onclick = (e) => {
        e.stopPropagation();
        const willOpen = taskMenu.hidden;
        closeAllTaskMenus();
        if (willOpen) {
          taskMenu.hidden = false;
          kebabBtn.setAttribute("aria-expanded", "true");
        }
      };
      row.querySelector(".menu-item.recur").onclick = (e) => {
        e.stopPropagation();
        closeAllTaskMenus();
        t.recurring = !t.recurring;
        if (t.recurring && t.done) t.doneOnDay = dayKey(Date.now());
        save(); renderTasks();
        toast(t.recurring ? "Will repeat daily" : "No longer repeating");
      };
      row.querySelector(".menu-item.archive").onclick = (e) => {
        e.stopPropagation();
        closeAllTaskMenus();
        t.archived = !t.archived;
        if (t.archived && state.activeTaskId === t.id) state.activeTaskId = null;
        save(); renderTasks();
        toast(t.archived ? "Task paused" : "Task resumed");
      };
      row.querySelector(".menu-item.dup").onclick = (e) => {
        e.stopPropagation();
        closeAllTaskMenus();
        duplicateTask(t);
      };
      row.querySelector(".menu-item.del").onclick = (e) => {
        e.stopPropagation();
        closeAllTaskMenus();
        deleteTask(t);
      };
      row.ondragstart = () => { state.dragId = t.id; row.classList.add("dragging"); };
      row.ondragend = () => { state.dragId = null; row.classList.remove("dragging"); };
      row.ondragover = (e) => e.preventDefault();
      row.ondrop = (e) => {
        e.preventDefault();
        if (!state.dragId || state.dragId === t.id) return;
        const from = state.tasks.findIndex((x) => x.id === state.dragId);
        const to = state.tasks.findIndex((x) => x.id === t.id);
        if (from < 0 || to < 0) return;
        const [moved] = state.tasks.splice(from, 1);
        state.tasks.splice(to, 0, moved);
        save(); renderTasks();
      };
      if (idx === 0) row.querySelector(".up").disabled = true;
      if (idx === items.length - 1) row.querySelector(".down").disabled = true;
      list.appendChild(row);
    });
  }
  function startEdit(row, t) {
    const body = row.querySelector(".body");
    const input = document.createElement("input");
    input.className = "title-input";
    input.value = t.title;
    body.replaceChild(input, body.querySelector(".title"));
    input.focus();
    input.select();
    const commit = () => {
      const next = input.value.trim();
      if (next) t.title = next;
      save(); renderTasks();
    };
    input.onblur = commit;
    input.onkeydown = (e) => {
      if (e.key === "Enter") { e.preventDefault(); input.blur(); }
      if (e.key === "Escape") { input.value = t.title; input.blur(); }
    };
  }
  function moveTask(id, dir) {
    const items = visibleTasks();
    const vis = items.findIndex((t) => t.id === id);
    const swap = items[vis + dir];
    if (!swap) return;
    const a = state.tasks.findIndex((t) => t.id === id);
    const b = state.tasks.findIndex((t) => t.id === swap.id);
    const tmp = state.tasks[a];
    state.tasks[a] = state.tasks[b];
    state.tasks[b] = tmp;
    save(); renderTasks();
  }
  function deleteTask(t) {
    const idx = state.tasks.findIndex((x) => x.id === t.id);
    const copy = { ...t };
    state.tasks = state.tasks.filter((x) => x.id !== t.id);
    if (state.activeTaskId === t.id) state.activeTaskId = null;
    save(); renderTasks();
    toast("Task deleted", "Undo", () => {
      state.tasks.splice(Math.min(idx, state.tasks.length), 0, copy);
      save(); renderTasks();
    });
  }
  function duplicateTask(t) {
    const copy = normalizeTask({
      ...t,
      id: uid(),
      title: t.title + " (copy)",
      done: false,
      pomodoros: 0,
      doneOnDay: null,
      remainingSec: 0,
    });
    const idx = state.tasks.findIndex((x) => x.id === t.id);
    state.tasks.splice(idx + 1, 0, copy);
    save(); renderTasks();
    toast("Task duplicated");
  }

  function renderTimer() {
    const total = durationFor(state.mode) || 1;
    const mm = pad(Math.floor(state.secondsLeft / 60));
    const ss = pad(state.secondsLeft % 60);
    $("timeDisplay").textContent = mm + ":" + ss;
    $("stateLabel").textContent = state.running ? "In progress" : "Ready";
    const nxt = nextModeAfter(state.mode, state.focusCount);
    $("upNext").textContent = "Up next: " + MODE_LABEL[nxt];
    const today = countRange(startOfDay(), startOfDay() + 86400000);
    $("todayLine").textContent = today + " session" + (today === 1 ? "" : "s") + " today · goal " + settings.dailyGoal;
    const ms = $("miniStats");
    if (ms) {
      const st = streak();
      ms.innerHTML =
        '<span class="mini-stat"><strong>' + st + "d</strong> streak</span>" +
        '<span class="mini-stat"><strong>' + today + "/" + settings.dailyGoal + "</strong> today</span>";
    }
    document.body.setAttribute("data-mode", state.mode);
    applyTheme();
    ringProgress.style.strokeDashoffset = C * (1 - state.secondsLeft / total);
    $("playIcon").innerHTML = state.running
      ? '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>'
      : '<path d="M8 5v14l11-7z"/>';
    $("playBtn").setAttribute("aria-label", state.running ? "Pause" : "Start");
    $("ringStage").classList.toggle("breathing", state.running);
    const modeShort = MODE_LABEL[state.mode] || "Focus";
    const modeLabel = state.mode === "focus" ? "Focus" : "Break";
    if (state.running && !state.titleFlashInterval) {
      document.title = "(" + mm + ":" + ss + ") " + modeLabel + " — Cadence";
    } else if (!state.running && !state.titleFlashInterval) {
      document.title = "Cadence";
    }
    // Active task on ring
    const at = state.activeTaskId && state.tasks.find((t) => t.id === state.activeTaskId);
    const atl = $("activeTaskLabel");
    if (atl) {
      if (at && state.mode === "focus") {
        atl.hidden = false;
        atl.textContent = at.title + (at.focusMin ? " · " + at.focusMin + "m" : "");
      } else {
        atl.hidden = true;
      }
    }
    // Ends-at estimate
    const ea = $("endsAt");
    if (ea) {
      if (state.running && state.endsAt) {
        const d = new Date(state.endsAt);
        ea.hidden = false;
        ea.textContent = "Ends ~" + pad(d.getHours()) + ":" + pad(d.getMinutes());
      } else {
        ea.hidden = true;
      }
    }
    // Break suggestions
    const bs = $("breakSuggest");
    if (bs) {
      if (!state.running && (state.mode === "short" || state.mode === "long") && !state.zen) {
        bs.hidden = false;
        const idea = BREAK_IDEAS[state.focusCount % BREAK_IDEAS.length];
        $("breakText").textContent = idea;
      } else if (state.running && (state.mode === "short" || state.mode === "long")) {
        bs.hidden = false;
        const idea = BREAK_IDEAS[state.focusCount % BREAK_IDEAS.length];
        $("breakText").textContent = idea;
      } else {
        bs.hidden = true;
      }
    }
    document.querySelectorAll(".mode-switch button").forEach((b) => b.classList.toggle("on", b.dataset.mode === state.mode));
    renderPips();
  }

  function weekBounds(now) {
    const todayFrom = startOfDay(now);
    const d = new Date(todayFrom);
    const mondayOff = d.getDay() === 0 ? 6 : d.getDay() - 1;
    return { todayFrom, weekFrom: todayFrom - mondayOff * 86400000 };
  }

  function renderReports() {
    renderBadges();
    const now = Date.now();
    const { todayFrom, weekFrom } = weekBounds(now);
    const monthFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const todaySec = sumRange(todayFrom, todayFrom + 86400000);
    const weekSec = sumRange(weekFrom, weekFrom + 7 * 86400000);
    const lastWeek = sumRange(weekFrom - 7 * 86400000, weekFrom);
    const monthSec = sumRange(monthFrom, now + 86400000);
    const todayCount = countRange(todayFrom, todayFrom + 86400000);
    const weekCount = countRange(weekFrom, weekFrom + 7 * 86400000);
    const monthCount = countRange(monthFrom, now + 86400000);
    const delta = lastWeek === 0 ? null : Math.round(((weekSec - lastWeek) / lastWeek) * 100);
    $("statToday").textContent = fmtMs(todaySec);
    $("statTodayH").textContent = todayCount + " / " + settings.dailyGoal + " goal";
    $("statWeek").textContent = fmtMs(weekSec);
    $("statWeekH").textContent = weekCount + " / " + settings.weeklyGoal + " goal";
    $("statStreak").textContent = streak() + "d";
    $("statStreakH").textContent = "best " + longestStreak() + "d";
    $("statMonth").textContent = fmtMs(monthSec);
    $("statMonthH").textContent = monthCount + " / " + settings.monthlyGoal + " goal";
    $("statLongest").textContent = longestStreak() + "d";
    $("statAvg").textContent = fmtMs(avgFocusSec());
    const rate = completionRate();
    $("statRate").textContent = rate == null ? "no sessions yet" : rate + "% completed";
    $("reportLead").textContent = weekSec === 0
      ? "Complete a focus session and this page fills in."
      : "You focused " + fmtMs(weekSec) + " this week" + (delta == null ? "." : ", " + Math.abs(delta) + "% " + (delta >= 0 ? "above" : "below") + " last week.");
    const stale = state.lastExportAt && (Date.now() - state.lastExportAt > 14 * 86400000);
    const never = !state.lastExportAt && state.sessions.length > 5 && !state.demo;
    $("exportNudge").hidden = !(stale || never);

    const day = bestDay();
    const hour = bestHour();
    const bits = [];
    if (day) {
      const pretty = new Date(day.key + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      bits.push("Best day " + pretty + " · " + fmtMs(day.sec));
    }
    if (hour) bits.push("Most productive hour " + fmtHour(hour.hour));
    $("statCallout").textContent = bits.join("  ·  ");
    $("statCallout").style.display = bits.length ? "block" : "none";

    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const bars = $("weekBars");
    bars.innerHTML = "";
    let max = 1;
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const ts = todayFrom - i * 86400000;
      const m = Math.round(sumRange(ts, ts + 86400000) / 60);
      days.push({ label: names[new Date(ts).getDay()], m });
      max = Math.max(max, m);
    }
    days.forEach((d0, i) => {
      const col = document.createElement("div");
      col.className = "bar-col";
      const ts = todayFrom - (6 - i) * 86400000;
      const dk = dayKey(ts);
      const h = Math.max(4, Math.round((d0.m / max) * 130));
      col.innerHTML = '<div class="bar" style="height:' + h + 'px" title="' + d0.m + ' min — click for log"></div><span>' + d0.label + "</span>";
      col.onclick = () => {
        state.logDayFilter = dk;
        state.logFilter = "all";
        state.logLimit = LOG_PAGE;
        document.querySelectorAll("[data-filter]").forEach((x) => x.classList.remove("on"));
        showPage("log");
        toast("Showing " + dk);
      };
      bars.appendChild(col);
    });

    const heat = $("heatGrid");
    heat.innerHTML = "";
    const dows = $("heatDows");
    if (dows) {
      dows.innerHTML = "";
      ["M", "T", "W", "T", "F", "S", "S"].forEach((d) => {
        const s = document.createElement("span");
        s.textContent = d;
        dows.appendChild(s);
      });
    }
    const map = {};
    focusSessions().forEach((s) => {
      const k = dayKey(s.endedAt);
      map[k] = (map[k] || 0) + s.durationSec / 60;
    });
    // Align grid so each column is a week starting Monday
    const start = weekFrom - 15 * 7 * 86400000;
    for (let t = start; t < todayFrom + 86400000; t += 86400000) {
      const cell = document.createElement("div");
      const m = Math.round(map[dayKey(t)] || 0);
      let cls = "";
      if (m >= 100) cls = "h4"; else if (m >= 50) cls = "h3"; else if (m >= 25) cls = "h2"; else if (m > 0) cls = "h1";
      cell.className = "heat-cell " + cls;
      const dk = dayKey(t);
      cell.title = dk + ": " + m + "m — open log";
      cell.setAttribute("role", "button");
      cell.tabIndex = 0;
      cell.onclick = () => {
        state.logDayFilter = dk;
        state.logFilter = "all";
        state.logLimit = LOG_PAGE;
        document.querySelectorAll("[data-filter]").forEach((x) => x.classList.remove("on"));
        showPage("log");
        toast("Showing " + dk);
      };
      heat.appendChild(cell);
    }
    if (!Object.keys(map).length) {
      heat.innerHTML = '<div class="chart-empty" style="grid-column:1/-1">Complete focus sessions to fill the heatmap.</div>';
    }

    const hours = Array.from({ length: 17 }, (_, i) => ({ hour: i + 6, m: 0 }));
    focusSessions().forEach((s) => {
      if (s.endedAt < weekFrom) return;
      const h = new Date(s.startedAt).getHours();
      const b = hours.find((x) => x.hour === h);
      if (b) b.m += s.durationSec / 60;
    });
    const hourMax = Math.max(1, ...hours.map((h) => h.m));
    const hourBars = $("hourBars");
    hourBars.innerHTML = "";
    const anyHour = hours.some((h) => h.m > 0);
    if (!anyHour) {
      hourBars.innerHTML = '<div class="chart-empty">No hourly focus data this week yet.</div>';
    } else {
      hours.forEach((h) => {
        const col = document.createElement("div");
        const isPeak = h.m > 0 && h.m === hourMax;
        col.className = "bar-col" + (h.m === 0 ? " hour-quiet" : "") + (isPeak ? " hour-peak" : "");
        const ht = h.m > 0 ? Math.max(6, Math.round((h.m / hourMax) * 100)) : 3;
        const label = (h.hour % 12 || 12) + (h.hour >= 12 ? "p" : "a");
        col.innerHTML = '<div class="bar rest" style="height:' + ht + 'px" title="' + Math.round(h.m) + 'm"></div><span>' + label + "</span>";
        hourBars.appendChild(col);
      });
    }

    const byTask = {};
    focusSessions().forEach((s) => {
      const id = s.taskId || "_none";
      if (!byTask[id]) byTask[id] = { sec: 0, n: 0 };
      byTask[id].sec += s.durationSec;
      byTask[id].n += 1;
    });
    const rows = Object.keys(byTask).map((id) => {
      const task = state.tasks.find((t) => t.id === id);
      return { id, title: task ? task.title : id === "_none" ? "Untagged" : "Deleted task", ...byTask[id] };
    }).sort((a, b) => b.sec - a.sec);
    const box = $("taskBreakdown");
    box.innerHTML = "";
    if (!rows.length) {
      $("taskBreakdownCard").style.display = "none";
    } else {
      $("taskBreakdownCard").style.display = "block";
      const top = Math.max(1, rows[0].sec);
      rows.slice(0, 8).forEach((r) => {
        const el = document.createElement("div");
        el.className = "breakdown-row";
        el.innerHTML = "<div>" + escapeHtml(r.title) + '</div><div class="muted">' + fmtMs(r.sec) + " · " + r.n + '</div><div class="bar-line"><span style="width:' + Math.round((r.sec / top) * 100) + '%"></span></div>';
        box.appendChild(el);
      });
    }
  }

  function filteredLog() {
    const q = state.logSearch.trim().toLowerCase();
    const todayFrom = startOfDay();
    const { weekFrom } = weekBounds(Date.now());
    return state.sessions.filter((s) => {
      if (state.logDayFilter) {
        if (dayKey(s.endedAt) !== state.logDayFilter) return false;
      } else if (state.logFilter === "today") {
        if (s.endedAt < todayFrom) return false;
      } else if (state.logFilter === "week") {
        if (s.endedAt < weekFrom) return false;
      } else if (state.logFilter !== "all" && s.mode !== state.logFilter) {
        return false;
      }
      if (state.logTaskFilter !== "all") {
        if (state.logTaskFilter === "_none" && s.taskId) return false;
        if (state.logTaskFilter === "_deleted_unknown") {
          const isOrphanNoTitle = s.taskId && !state.tasks.some((t) => t.id === s.taskId) && !s.taskTitle;
          if (!isOrphanNoTitle) return false;
        } else if (state.logTaskFilter !== "_none" && s.taskId !== state.logTaskFilter) {
          return false;
        }
      }
      if (q) {
        const hay = sessionTaskTitle(s) + " " + (s.note || "") + " " + MODE_LABEL[s.mode];
        if (!hay.toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => b.endedAt - a.endedAt);
  }

  /** Best-available label for the task a session was logged against — falls
   *  back to a snapshot taken at logging time if the task was since deleted,
   *  so history and filters stay readable instead of showing raw "Deleted task". */
  function sessionTaskTitle(s) {
    if (!s.taskId) return "";
    const t = state.tasks.find((x) => x.id === s.taskId);
    if (t) return t.title;
    return s.taskTitle || "";
  }

  function renderLogFilters() {
    const sel = $("logTaskFilter");
    const current = state.logTaskFilter;
    const ids = new Set(state.sessions.map((s) => s.taskId).filter(Boolean));
    sel.innerHTML = '<option value="all">All tasks</option><option value="_none">Untagged</option>';
    state.tasks.forEach((t) => {
      if (!ids.has(t.id) && t.archived) return;
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.title;
      sel.appendChild(opt);
    });
    const deletedIds = Array.from(ids).filter((id) => !state.tasks.some((t) => t.id === id));
    const namedDeleted = deletedIds.filter((id) => state.sessions.some((s) => s.taskId === id && s.taskTitle));
    const unnamedCount = deletedIds.length - namedDeleted.length;
    if (namedDeleted.length || unnamedCount) {
      const group = document.createElement("optgroup");
      group.label = "Deleted tasks";
      namedDeleted.forEach((id) => {
        const sample = state.sessions.find((s) => s.taskId === id && s.taskTitle);
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = sample.taskTitle + " (deleted)";
        group.appendChild(opt);
      });
      if (unnamedCount) {
        // Older sessions logged before Cadence started remembering a task's
        // name — nothing to tell them apart by, so group them as one entry
        // instead of a wall of identical "Deleted task" rows.
        const opt = document.createElement("option");
        opt.value = "_deleted_unknown";
        opt.textContent = "Deleted tasks (name unavailable)";
        group.appendChild(opt);
      }
      sel.appendChild(group);
    }
    sel.value = current;
  }

  function renderLog() {
    const wrap = $("logList");
    wrap.innerHTML = "";
    const all = filteredLog();
    const rows = all.slice(0, state.logLimit);
    $("logMore").hidden = all.length <= rows.length;
    if (!rows.length) {
      wrap.innerHTML = '<div class="card"><p class="today-line">No sessions in this filter yet.</p></div>';
      return;
    }
    const groups = {};
    rows.forEach((s) => {
      const k = new Date(s.endedAt).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short", year: "numeric" });
      (groups[k] = groups[k] || []).push(s);
    });
    Object.keys(groups).forEach((day) => {
      const list = groups[day];
      const focus = list.filter((s) => s.mode === "focus" && s.completed).reduce((a, s) => a + s.durationSec, 0);
      const sec = document.createElement("section");
      sec.className = "log-day";
      sec.innerHTML = "<h3>" + day + '<span class="today-line">' + fmtMs(focus) + " focus</span></h3><div class=\"log-list\"></div>";
      const box = sec.querySelector(".log-list");
      list.forEach((s) => {
        const task = state.tasks.find((t) => t.id === s.taskId);
        const titleLabel = task ? task.title : (s.taskId ? (s.taskTitle ? s.taskTitle + " (deleted)" : "") : "");
        const row = document.createElement("div");
        row.className = "log-row";
        row.tabIndex = 0;
        row.setAttribute("role", "button");
        row.setAttribute("aria-label", "Edit note");
        const t0 = new Date(s.startedAt), t1 = new Date(s.endedAt);
        row.innerHTML =
          '<span class="dot ' + (s.mode === "focus" ? "focus" : "break") + '"></span>' +
          '<div style="flex:1"><div>' + MODE_LABEL[s.mode] + (titleLabel ? " · " + escapeHtml(titleLabel) : "") + "</div>" +
          '<div class="today-line">' + pad(t0.getHours()) + ":" + pad(t0.getMinutes()) + " – " + pad(t1.getHours()) + ":" + pad(t1.getMinutes()) + "</div>" +
          (s.note ? '<div class="log-note">' + escapeHtml(s.note) + "</div>" : '<div class="log-note log-note-empty">Add a note</div>') +
          '</div><div style="text-align:right"><div>' + Math.round(s.durationSec / 60) + "m</div>" +
          '<div class="today-line">' + (s.completed ? "Done" : "Skipped") + "</div></div>" +
          '<span class="log-edit-hint" aria-hidden="true">✎</span>';
        row.onclick = () => openLogNoteEditor(s.id);
        row.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLogNoteEditor(s.id); } };
        box.appendChild(row);
      });
      wrap.appendChild(sec);
    });
  }

  function showPage(name) {
    const changed = state.page !== name;
    state.page = name;
    if (name !== "timer") setZen(false);
    document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.dataset.page === name));
    document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === name));
    if (name === "reports") renderReports();
    if (name === "log") { renderLogFilters(); renderLog(); }
    try { location.hash = name === "timer" ? "" : name; } catch (e) { /* ignore */ }
    if (changed) {
      vibrate("light");
      document.querySelectorAll('[data-nav="' + name + '"]').forEach((a) => bump(a, "nav-bump"));
    }
  }

  function logSession(mode, elapsed, completed, tsOverride) {
    if (elapsed < 15 && !completed) return null;
    if (state.demo && completed && mode === "focus") {
      state.sessions = [];
      state.demo = false;
      toast("Sample history cleared — your real sessions start now");
    }
    const endedAt = tsOverride ? tsOverride.endedAt : Date.now();
    const startedAt = tsOverride ? tsOverride.startedAt : endedAt - elapsed * 1000;
    const entry = {
      id: uid(), mode, startedAt, endedAt: endedAt,
      durationSec: elapsed,
      taskId: mode === "focus" ? (state.activeTaskId || undefined) : (state.breakTaskId || undefined),
      completed,
    };
    // Snapshot the task's title at logging time so history still reads
    // sensibly if the task is renamed or deleted later.
    if (entry.taskId) {
      const t = state.tasks.find((x) => x.id === entry.taskId);
      if (t) entry.taskTitle = t.title;
    }
    state.sessions.push(entry);
    if (completed && mode === "focus") { checkAuroraUnlock(); checkBadgeUnlocks(); }
    if (completed && mode === "focus" && state.activeTaskId) {
      const t = state.tasks.find((x) => x.id === state.activeTaskId);
      if (t) {
        t.pomodoros += 1;
        t.remainingSec = 0; // finished block — no leftover
        if (t.target > 0 && t.pomodoros >= t.target && !t.done) {
          t.done = true;
          if (state.activeTaskId === t.id) state.activeTaskId = null;
          setTimeout(() => { vibrate("success"); toast("Target hit · " + t.title + " marked done"); }, 400);
        }
      }
    }
    return entry;
  }

  let zenShiftTimer = null;

  function zenShiftTarget() {
    return document.querySelector('.page[data-page="timer"]');
  }

  function clearZenShift() {
    if (zenShiftTimer) {
      clearInterval(zenShiftTimer);
      zenShiftTimer = null;
    }
    const el = zenShiftTarget();
    if (el) el.style.transform = "";
  }

  function applyZenPixelShift() {
    if (!state.zen) return;
    const el = zenShiftTarget();
    if (!el) return;
    // Random offset −2px … +2px on both axes (OLED burn-in mitigation)
    const x = Math.floor(Math.random() * 5) - 2;
    const y = Math.floor(Math.random() * 5) - 2;
    el.style.transform = "translate(" + x + "px, " + y + "px)";
  }

  function startZenPixelShift() {
    clearZenShift();
    applyZenPixelShift();
    zenShiftTimer = setInterval(applyZenPixelShift, 60000);
  }

  let zenHintTimer = null;

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  }

  function enterImmersive() {
    // Must run in a user-gesture stack on mobile Chrome
    try {
      if (isFullscreen()) return Promise.resolve();
      const root = document.documentElement;
      const opts = { navigationUI: "hide" };
      if (root.requestFullscreen) {
        return root.requestFullscreen(opts).catch(function () {
          return root.requestFullscreen().catch(function () { /* blocked */ });
        });
      }
      if (root.webkitRequestFullscreen) {
        root.webkitRequestFullscreen();
        return Promise.resolve();
      }
      if (root.msRequestFullscreen) {
        root.msRequestFullscreen();
        return Promise.resolve();
      }
    } catch (e) { /* ignore */ }
    return Promise.resolve();
  }

  function exitImmersive() {
    try {
      if (!isFullscreen()) return;
      if (document.exitFullscreen) document.exitFullscreen().catch(function () {});
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    } catch (e) { /* ignore */ }
  }

  function showZenHintBriefly() {
    const h = $("zenHint");
    if (!h) return;
    h.classList.add("zen-hint-visible");
    clearTimeout(zenHintTimer);
    zenHintTimer = setTimeout(function () {
      h.classList.remove("zen-hint-visible");
    }, 5000);
  }

  function setZen(on, showControls) {
    const wasZen = state.zen;
    state.zen = !!on;
    if (!state.zen) state.zenShowControls = false;
    else if (showControls != null) state.zenShowControls = !!showControls;
    else if (state.zenShowControls == null) state.zenShowControls = false;
    document.body.classList.toggle("zen", state.zen);
    document.body.classList.toggle("zen-controls", state.zen && !!state.zenShowControls);
    document.documentElement.classList.toggle("zen-lock", state.zen);
    if (state.zen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (!wasZen) {
        // Fullscreen only succeeds with a user gesture; callers also invoke enterImmersive()
        enterImmersive();
        startZenPixelShift();
        showZenHintBriefly();
      }
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      clearZenShift();
      clearTimeout(zenHintTimer);
      const h = $("zenHint");
      if (h) h.classList.remove("zen-hint-visible");
      if (wasZen) exitImmersive();
    }
  }
  function setZenControls(show) {
    if (!state.zen) return;
    state.zenShowControls = !!show;
    document.body.classList.toggle("zen-controls", state.zenShowControls);
  }
  // Block page scroll in zen mode (empty space no longer scrolls away)
  document.addEventListener("touchmove", (e) => {
    if (!state.zen) return;
    const t = e.target;
    if (t.closest && (t.closest(".controls") || t.closest(".ring-stage") || t.closest(".modal") || t.closest(".settings-sheet"))) return;
    e.preventDefault();
  }, { passive: false });


  let zenTimer = null;
  function scheduleZen() {
    clearTimeout(zenTimer);
    if (state.running && state.mode === "focus") {
      zenTimer = setTimeout(() => { if (state.running && state.mode === "focus") setZen(true, false); }, 1400);
    }
  }

  function advance(fromComplete) {
    if (state.mode === "focus") {
      state.focusCount++;
      state.mode = state.focusCount % settings.interval === 0 ? "long" : "short";
    } else state.mode = "focus";
    state.secondsLeft = durationFor(state.mode);
    state.running = false;
    state.endsAt = null;
    state.taskPromptAsked = false;
    state.breakTaskId = null;
    clearInterval(state.timerId);
    setZen(false);
    if (fromComplete && settings.autoStart && !state.pendingNoteId) startTimer();
    else renderTimer();
    save();
  }

  function celebrateIfNeeded(prevStreak, prevToday) {
    const today = countRange(startOfDay(), startOfDay() + 86400000);
    const s = streak();
    let celebrated = {};
    try { celebrated = JSON.parse(localStorage.getItem(CELEBRATE_KEY) || "{}"); } catch (e) { celebrated = {}; }
    const day = dayKey(Date.now());
    let fire = false;
    if (today >= settings.dailyGoal && prevToday < settings.dailyGoal && celebrated.goalDay !== day) {
      celebrated.goalDay = day;
      fire = true;
    }
    const longest = longestStreak();
    if (s > prevStreak && s >= longest && s > 1 && celebrated.streak !== s) {
      celebrated.streak = s;
      fire = true;
    }
    localStorage.setItem(CELEBRATE_KEY, JSON.stringify(celebrated));
    if (fire) { vibrate("success"); burstConfetti(); }
  }

  function completeAwayPhase(endsAt) {
    const wasFocus = state.mode === "focus";
    const durationSec = durationFor(state.mode);
    const startedAt = endsAt - durationSec * 1000;
    const entry = logSession(state.mode, durationSec, true, { startedAt, endedAt: endsAt });
    if (wasFocus && entry) {
      // It finished while the app was closed/backgrounded — don't silently skip the
      // note prompt, just surface it now that the person is back.
      state.pendingNoteId = entry.id;
      state.pendingAutoStart = false;
      advance(false);
      toast("Focus session logged — it finished while you were away");
      openNoteModal();
    } else {
      advance(false);
      toast("Break session logged — it finished while you were away");
    }
  }

  function completePhase() {
    const prevStreak = streak();
    const prevToday = countRange(startOfDay(), startOfDay() + 86400000);
    const wasFocus = state.mode === "focus";
    const entry = logSession(state.mode, durationFor(state.mode), true);
    playSound();
    flashTitleComplete();
    vibrate("done");
    bump($("ringStage"), "ring-complete");
    notify(MODE_LABEL[state.mode] + " complete", "Up next: " + MODE_LABEL[nextModeAfter(state.mode, state.focusCount)]);
    if (wasFocus) celebrateIfNeeded(prevStreak, prevToday);
    if (wasFocus && entry) {
      state.pendingNoteId = entry.id;
      state.pendingAutoStart = settings.autoStart;
      advance(false);
      openNoteModal();
    } else {
      advance(true);
    }
  }

  function stopTitleFlash() {
    if (state.titleFlashInterval) {
      clearInterval(state.titleFlashInterval);
      state.titleFlashInterval = null;
    }
    state._titleFlashOn = false;
  }
  function flashTitleComplete() {
    stopTitleFlash();
    state._titleFlashOn = true;
    const flash = () => {
      document.title = state._titleFlashOn ? "🔔 Session Complete! — Cadence" : "Cadence";
      state._titleFlashOn = !state._titleFlashOn;
    };
    flash();
    state.titleFlashInterval = setInterval(flash, 1000);
  }

  function tick() {
    if (!state.running || !state.endsAt) return;
    const rem = Math.ceil((state.endsAt - Date.now()) / 1000);
    if (rem <= 0) completePhase();
    else {
      if (state.lastTickSecond !== rem) {
        state.lastTickSecond = rem;
        playTick();
        // Persist about every 5 seconds while running
        if (rem % 5 === 0) save();
      }
      state.secondsLeft = rem;
      renderTimer();
    }
  }
  function startTimer() {
    if (settings.notify && typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission();
    }
    state.running = true;
    state.endsAt = Date.now() + state.secondsLeft * 1000;
    clearInterval(state.timerId);
    state.timerId = setInterval(tick, 200);
    renderTimer();
    scheduleZen();
    save();
    vibrate("start");
    bump($("playBtn"), "bump");
    bump($("ringStage"), "ring-pulse");
  }
  function stopTimer() {
    const wasRunning = state.running;
    if (state.running && state.endsAt) state.secondsLeft = Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
    state.running = false; state.endsAt = null;
    clearInterval(state.timerId);
    clearTimeout(zenTimer);
    setZen(false);
    if (wasRunning) saveTaskRemaining();
    renderTimer(); save();
    if (wasRunning) {
      vibrate("pause");
      bump($("playBtn"), "bump");
    }
  }

  function elapsedNow() {
    return durationFor(state.mode) - state.secondsLeft;
  }
  function meaningfullyElapsed() {
    return state.running && elapsedNow() >= 30;
  }
  function switchMode(mode) {
    const go = () => {
      stopTimer();
      if (state.mode === "focus" && mode !== "focus") clearTaskRemaining();
      const modeChanged = state.mode !== mode;
      state.mode = mode;
      state.secondsLeft = durationFor(mode);
      if (modeChanged) { state.taskPromptAsked = false; state.breakTaskId = null; }
      renderTimer(); save();
      maybePromptTask(mode);
    };
    if (meaningfullyElapsed()) {
      askConfirm({
        title: "Switch phase?",
        text: "This focus block is in progress. Switching will discard the current timer.",
        ok: "Switch",
      }).then((ok) => { if (ok) go(); });
    } else go();
  }

  /** Whether the "which task?" popup should appear before this mode starts.
   *  Focus is skipped once a task is already selected — Cadence already knows.
   *  Breaks ask once per break instance (cleared again on the next advance/switch). */
  function taskPromptNeeded(mode) {
    if (mode === "focus") return !state.activeTaskId;
    return !state.taskPromptAsked;
  }

  let taskPromptResolver = null;
  function openTaskPromptModal(mode) {
    return new Promise((resolve) => {
      const list = $("taskPromptList");
      const isFocus = mode === "focus";
      $("taskPromptTitle").textContent = isFocus ? "Which task?" : "Taking a break?";
      $("taskPromptText").textContent = isFocus
        ? "Pick a task for this focus block, or start without one."
        : "Tag it to a task if it helps — like lunch or an errand — or just continue.";
      const candidates = state.tasks.filter((t) => !t.done && !t.archived);
      list.innerHTML = "";
      if (!candidates.length) {
        list.innerHTML = '<p class="task-pick-empty">No open tasks yet.</p>';
      } else {
        candidates.forEach((t) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "task-pick-item";
          const progressLabel = t.target > 0 ? (t.pomodoros + "/" + t.target) : (t.pomodoros ? t.pomodoros + " done" : "");
          btn.innerHTML = "<span>" + escapeHtml(t.title) + "</span>" +
            (progressLabel ? '<span class="tpi-meta">' + progressLabel + "</span>" : "");
          btn.onclick = () => settle({ taskId: t.id });
          list.appendChild(btn);
        });
      }
      function settle(result) {
        $("taskPromptModal").classList.remove("open");
        taskPromptResolver = null;
        resolve(result);
      }
      taskPromptResolver = settle;
      $("taskPromptModal").classList.add("open");
    });
  }
  async function maybePromptTask(mode) {
    if (!taskPromptNeeded(mode)) return;
    if ($("taskPromptModal").classList.contains("open")) return;
    const result = await openTaskPromptModal(mode);
    state.taskPromptAsked = true;
    if (result && result.taskId) {
      if (mode === "focus") {
        const t = state.tasks.find((x) => x.id === result.taskId);
        if (t) {
          if (state.activeTaskId && state.activeTaskId !== t.id) saveTaskRemaining();
          state.activeTaskId = t.id;
          if (!state.running) {
            const full = taskFocusDuration(t);
            state.secondsLeft = (t.remainingSec > 0 && t.remainingSec < full) ? t.remainingSec : full;
          }
        }
      } else {
        state.breakTaskId = result.taskId;
      }
      save(); renderTasks(); renderTimer();
    }
  }

  if ($("muteBtn")) {
    $("muteBtn").onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      settings.muted = !settings.muted;
      save();
      renderMuteBtn();
      vibrate("light");
      bump($("muteBtn"), "bump");
      toast(settings.muted ? "Tick muted" : "Tick on");
    };
  }
  $("playBtn").onclick = async () => {
    if (state.running) { stopTimer(); return; }
    if (elapsedNow() === 0) {
      await maybePromptTask(state.mode);
    }
    // User gesture — required for fullscreen on Android Chrome, and the most
    // reliable moment to warm up the AudioContext so it isn't first touched
    // minutes later from a background timer callback with no active gesture.
    try { ctx(); } catch (e) { /* ignore */ }
    enterImmersive();
    startTimer();
  };
  $("resetBtn").onclick = () => {
    stopTimer();
    clearTaskRemaining();
    state.secondsLeft = durationFor(state.mode);
    renderTimer();
    save();
  };
  $("skipBtn").onclick = async () => {
    const go = () => {
      const elapsed = elapsedNow();
      logSession(state.mode, elapsed, false);
      if (state.mode === "focus") clearTaskRemaining();
      advance(false);
    };
    if (settings.confirmSkip && meaningfullyElapsed()) {
      const ok = await askConfirm({
        title: "Skip this phase?",
        text: "You have progress on this block. Skip and move on?",
        ok: "Skip",
      });
      if (ok) go();
    } else go();
  };
  document.querySelectorAll(".mode-switch button").forEach((b) => {
    b.onclick = () => switchMode(b.dataset.mode);
  });
  $("ringStage").onclick = (e) => {
    if (e.target.closest && e.target.closest("#muteBtn")) return;
    if (!state.running) return;
    // Always try fullscreen on ring tap (user gesture)
    enterImmersive();
    if (state.zen) {
      setZenControls(!state.zenShowControls);
    } else {
      setZen(true, false);
    }
  };
  $("ringStage").onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!state.running) return;
      enterImmersive();
      if (state.zen) setZenControls(!state.zenShowControls);
      else setZen(true, false);
    }
  };

  // Tap background in zen → leave zen, timer keeps running
  document.addEventListener("click", (e) => {
    if (!state.zen) return;
    const t = e.target;
    if (t.closest && (t.closest(".ring-stage") || t.closest(".controls") || t.closest(".modal") || t.closest(".settings-sheet") || t.closest("#drawer") || t.closest("#muteBtn"))) return;
    setZen(false); // exit zen only — do not pause
  });

  $("taskForm").onsubmit = (e) => {
    e.preventDefault();
    const title = $("taskInput").value.trim();
    if (!title) return;
    const t = { id: uid(), title, done: false, pomodoros: 0, target: 0, due: "today", archived: false, remainingSec: 0 };
    state.tasks.unshift(t);
    if (!state.activeTaskId) state.activeTaskId = t.id;
    $("taskInput").value = "";
    save(); renderTasks();
  };
  if ($("clearDoneTasksBtn")) {
    $("clearDoneTasksBtn").onclick = async () => {
      const done = state.tasks.filter((t) => t.done);
      if (!done.length) { toast("No completed tasks to clear"); return; }
      // Recurring tasks aren't deleted — clearing just resets them for their next occurrence.
      const toRemove = done.filter((t) => !t.recurring);
      const toReset = done.filter((t) => t.recurring);
      if (!toRemove.length && !toReset.length) { toast("No completed tasks to clear"); return; }
      const count = toRemove.length + toReset.length;
      const ok = await askConfirm({
        title: "Clear completed tasks?",
        text: "This clears " + count + " completed task" + (count === 1 ? "" : "s") + ". You can undo right after.",
        ok: "Clear",
      });
      if (!ok) return;
      const removedCopy = toRemove.map((t) => ({ ...t }));
      const resetCopy = toReset.map((t) => ({ ...t }));
      const removedIds = new Set(removedCopy.map((t) => t.id));
      state.tasks = state.tasks.filter((t) => !removedIds.has(t.id));
      toReset.forEach((t) => { t.done = false; t.doneOnDay = null; t.pomodoros = 0; });
      if (state.activeTaskId && removedIds.has(state.activeTaskId)) state.activeTaskId = null;
      save(); renderTasks();
      toast(count + " task" + (count === 1 ? "" : "s") + " cleared", "Undo", () => {
        state.tasks = removedCopy.concat(state.tasks);
        resetCopy.forEach((orig) => {
          const cur = state.tasks.find((t) => t.id === orig.id);
          if (cur) { cur.done = true; cur.doneOnDay = orig.doneOnDay; cur.pomodoros = orig.pomodoros; }
        });
        save(); renderTasks();
      });
    };
  }
  document.querySelectorAll("[data-task-view]").forEach((b) => {
    b.onclick = () => {
      state.taskView = b.dataset.taskView;
      document.querySelectorAll("[data-task-view]").forEach((x) => x.classList.toggle("on", x === b));
      renderTasks();
    };
  });

  document.querySelectorAll("[data-nav]").forEach((a) => {
    a.onclick = (e) => { e.preventDefault(); showPage(a.dataset.nav); };
  });
  $("wordmark").onclick = () => showPage("timer");

  const themeBtn = $("themeBtn"), themePopover = $("themePopover");
  themeBtn.onclick = (e) => { e.stopPropagation(); themePopover.classList.toggle("open"); };
  document.querySelectorAll(".theme-card[data-t]").forEach((c) => {
    c.onclick = (e) => {
      e.stopPropagation();
      settings.themeAuto = false;
      setTheme(c.dataset.t);
      save();
    };
  });
  if ($("themeAutoBtn")) {
    $("themeAutoBtn").onclick = (e) => {
      e.stopPropagation();
      settings.themeAuto = true;
      applyTheme();
      save();
      toast("Following system theme");
    };
  }
  document.querySelectorAll(".accent-dot").forEach((d) => {
    d.onclick = (e) => {
      e.stopPropagation();
      settings.accent = d.dataset.accent || "sage";
      applyAccent();
      syncThemeUI();
      save();
    };
  });
  if ($("themePanelClose")) {
    $("themePanelClose").onclick = (e) => { e.stopPropagation(); themePopover.classList.remove("open"); };
  }
  document.addEventListener("click", (e) => {
    if (themePopover && !themePopover.contains(e.target) && e.target !== themeBtn && !themeBtn.contains(e.target)) {
      themePopover.classList.remove("open");
    }
  });

  const drawer = $("drawer"), backdrop = $("backdrop");
  const settingsBody = $("settingsBody");
  const railItems = Array.from(document.querySelectorAll(".rail-item"));
  const settingsGroups = Array.from(document.querySelectorAll(".set-group"));
  function switchSettingsTab(groupName) {
    railItems.forEach((btn) => btn.classList.toggle("active", btn.dataset.group === groupName));
    settingsGroups.forEach((g) => g.classList.toggle("active", g.dataset.group === groupName));
    if (settingsBody) settingsBody.scrollTop = 0;
  }
  railItems.forEach((btn) => {
    btn.addEventListener("click", () => switchSettingsTab(btn.dataset.group));
  });
  function openDrawer() {
    drawer.classList.add("open");
    backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
    if (settingsBody) settingsBody.scrollTop = 0;
    switchSettingsTab("rhythm");
  }
  function shutDrawer() {
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
    document.body.style.overflow = "";
  }
  $("settingsBtn").addEventListener("click", openDrawer);
  $("closeDrawer").addEventListener("click", shutDrawer);
  if ($("closeDrawerBottom")) $("closeDrawerBottom").addEventListener("click", shutDrawer);
  backdrop.addEventListener("click", shutDrawer);

  function refreshStepper(el) {
    const key = el.dataset.key, min = +el.dataset.min, max = +el.dataset.max, suffix = el.dataset.suffix;
    const v = settings[key];
    if (key === "volume") $(el.dataset.val).textContent = VOLUME_LABEL[v] || "Normal";
    else $(el.dataset.val).textContent = v + " " + suffix;
    el.querySelector(".step-fill").style.width = (((v - min) / (max - min)) * 100) + "%";
    el.querySelectorAll(".step-btn").forEach((b) => {
      const dir = +b.dataset.dir;
      b.disabled = dir < 0 ? v <= min : v >= max;
    });
  }
  function stepperChange(el, dir) {
    const key = el.dataset.key, min = +el.dataset.min, max = +el.dataset.max, step = +el.dataset.step;
    settings[key] = Math.min(max, Math.max(min, settings[key] + dir * step));
    refreshStepper(el);
    if (!state.running) state.secondsLeft = durationFor(state.mode);
    renderTimer(); save();
    if (state.page === "reports") renderReports();
  }
  document.querySelectorAll(".stepper").forEach((el) => {
    refreshStepper(el);
    el.querySelectorAll(".step-btn").forEach((btn) => {
      const dir = +btn.dataset.dir;
      let holdTimeout = null, holdInterval = null;
      const fire = () => { if (!btn.disabled) stepperChange(el, dir); };
      const stopHold = () => { clearTimeout(holdTimeout); clearInterval(holdInterval); holdTimeout = holdInterval = null; };
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        fire();
        holdTimeout = setTimeout(() => { holdInterval = setInterval(fire, 90); }, 450);
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => btn.addEventListener(ev, stopHold));
    });
  });
  function refreshAllSteppers() { document.querySelectorAll(".stepper").forEach(refreshStepper); }

  function bindSwitch(id, key) {
    const el = $(id);
    el.classList.toggle("on", settings[key]);
    el.setAttribute("aria-checked", settings[key] ? "true" : "false");
    el.onclick = async () => {
      if (key === "notify" && !settings.notify) {
        if (typeof Notification !== "undefined") {
          const p = await Notification.requestPermission();
          if (p !== "granted") return;
        }
      }
      settings[key] = !settings[key];
      el.classList.toggle("on", settings[key]);
      el.setAttribute("aria-checked", settings[key] ? "true" : "false");
      vibrate("light");
      bump(el, "switch-bump");
      save();
    };
  }
  bindSwitch("switchAuto", "autoStart");
  bindSwitch("switchSound", "sound");
  bindSwitch("switchNotify", "notify");
  bindSwitch("switchVibrate", "vibrate");
  if ($("switchThemeAuto")) {
    const el = $("switchThemeAuto");
    el.classList.toggle("on", settings.themeAuto);
    el.setAttribute("aria-checked", settings.themeAuto ? "true" : "false");
    el.onclick = () => {
      settings.themeAuto = !settings.themeAuto;
      el.classList.toggle("on", settings.themeAuto);
      el.setAttribute("aria-checked", settings.themeAuto ? "true" : "false");
      applyTheme();
      save();
    };
  }
  function bindSimpleSwitch(id, key, onChange) {
    const el = $(id);
    if (!el) return;
    el.classList.toggle("on", !!settings[key]);
    el.setAttribute("aria-checked", settings[key] ? "true" : "false");
    el.onclick = () => {
      settings[key] = !settings[key];
      el.classList.toggle("on", settings[key]);
      el.setAttribute("aria-checked", settings[key] ? "true" : "false");
      vibrate("light");
      bump(el, "switch-bump");
      if (onChange) onChange();
      save();
    };
  }
  bindSimpleSwitch("switchCompact", "compact", () => {
    document.body.classList.toggle("compact", !!settings.compact);
  });
  bindSimpleSwitch("switchConfirmSkip", "confirmSkip");

  function renderSoundPicks() {
    document.querySelectorAll("[data-sound]").forEach((b) => {
      b.classList.toggle("on", b.dataset.sound === settings.soundChoice);
    });
  }
  document.querySelectorAll("[data-sound]").forEach((b) => {
    b.onclick = () => {
      settings.soundChoice = b.dataset.sound;
      renderSoundPicks();
      save();
      const prev = settings.sound;
      settings.sound = true;
      playSound(b.dataset.sound);
      settings.sound = prev;
    };
  });

  function markExported() {
    state.lastExportAt = Date.now();
    save();
    if (state.page === "reports") renderReports();
  }
  $("nudgeExport").onclick = () => $("backupExportBtn").click();

  $("backupExportBtn").onclick = () => {
    try {
      const dump = {};
      const prefix = "cadence-";
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (!k.startsWith(prefix) && k !== KEY) continue;
        const raw = localStorage.getItem(k);
        try { dump[k] = JSON.parse(raw); } catch (e) { dump[k] = raw; }
      }
      dump.__meta = {
        app: "cadence",
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
      };
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const filename = "cadence_backup_" + yyyy + "-" + mm + "-" + dd + ".json";
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      markExported();
      toast("Backup saved — " + filename);
    } catch (e) { toast("Could not save backup"); }
  };
  $("backupImportBtn").onclick = () => $("backupImportFile").click();
  $("backupImportFile").onchange = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== "object" || !data.__meta || data.__meta.app !== "cadence") {
        throw new Error("schema");
      }
      const ok = await askConfirm({
        title: "Restore from backup?",
        text: "This will overwrite the current data on this device. Continue?",
        ok: "Restore",
        danger: true,
      });
      if (!ok) return;
      let count = 0;
      Object.keys(data).forEach((k) => {
        if (k === "__meta") return;
        const v = data[k];
        const serialized = (typeof v === "string") ? v : JSON.stringify(v);
        localStorage.setItem(k, serialized);
        count++;
      });
      // Storage now has the restored data, but in-memory state/settings are still
      // the old values — stop any running timer, then reload from storage before
      // re-rendering, or the UI would keep showing the pre-restore data.
      clearInterval(state.timerId);
      state.running = false;
      state.endsAt = null;
      load();
      try { renderAll(); } catch (err) { /* ignore */ }
      resumeTimerIfNeeded();
      toast("Restored " + count + " entr" + (count === 1 ? "y" : "ies") + " from backup");
    } catch (err) {
      toast("Could not import — not a valid Cadence backup");
    }
  };

  $("clearBtn").onclick = async () => {
    const ok = await askConfirm({
      title: "Clear all data?",
      text: "This permanently deletes every session and task on this device. There is no undo.",
      ok: "Clear everything",
      danger: true,
    });
    if (!ok) return;
    state.sessions = []; state.tasks = []; state.focusCount = 0; state.demo = false; state.activeTaskId = null;
    renderAll(); save();
    toast("All data cleared");
  };

  function openHelp() { $("helpModal").classList.add("open"); }
  if ($("shortcutsBtn")) $("shortcutsBtn").onclick = () => { shutDrawer(); openHelp(); };
  $("helpModal").onclick = (e) => { if (e.target.id === "helpModal") $("helpModal").classList.remove("open"); };
  $("closeHelp").onclick = () => $("helpModal").classList.remove("open");

  document.querySelectorAll("[data-filter]").forEach((b) => {
    b.onclick = () => {
      state.logFilter = b.dataset.filter;
      state.logDayFilter = null;
      state.logLimit = LOG_PAGE;
      document.querySelectorAll("[data-filter]").forEach((x) => x.classList.toggle("on", x === b));
      renderLog();
    };
  });
  $("logSearch").oninput = () => {
    state.logSearch = $("logSearch").value;
    state.logLimit = LOG_PAGE;
    renderLog();
  };
  $("logTaskFilter").onchange = () => {
    state.logTaskFilter = $("logTaskFilter").value;
    state.logLimit = LOG_PAGE;
    renderLog();
  };
  $("logMore").onclick = () => { state.logLimit += LOG_PAGE; renderLog(); };

  function closeTopModal() {
    if (drawer.classList.contains("open")) { shutDrawer(); return true; }
    if ($("taskPromptModal").classList.contains("open")) {
      if (taskPromptResolver) taskPromptResolver(null);
      return true;
    }
    const open = document.querySelector(".modal.open");
    if (open && open.id !== "noteModal") { open.classList.remove("open"); return true; }
    return false;
  }

  window.addEventListener("keydown", (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    if (e.key === "Escape") { closeTopModal(); return; }
    if (typing) return;
    if (e.shiftKey && e.key === "E") { e.preventDefault(); $("backupExportBtn").click(); return; }
    if (e.code === "Space") { e.preventDefault(); $("playBtn").click(); }
    if (e.key === "?") { e.preventDefault(); $("shortcutsModal").classList.toggle("open"); }
    /* shortcuts also in Settings */
    if (e.key === ",") { e.preventDefault(); openDrawer(); }
    const k = e.key.toLowerCase();
    if (k === "r") $("resetBtn").click();
    if (k === "n" || k === "s") $("skipBtn").click();
    if (k === "t") { e.preventDefault(); showPage("timer"); $("taskInput").focus(); }
    if (k === "1") switchMode("focus");
    if (k === "2") switchMode("short");
    if (k === "3") switchMode("long");
  });
  $("shortcutsClose").addEventListener("click", () => $("shortcutsModal").classList.remove("open"));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      stopTitleFlash();
      tick();
      if (state.running) renderTimer();
      if (resetRecurringTasks()) { save(); renderTasks(); }
    }
  });
  window.addEventListener("pageshow", () => { stopTitleFlash(); if (state.running) tick(); });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (settings.themeAuto) { applyTheme(); save(); }
  });

  function renderAll() {
    applyTheme();
    if (state.auroraUnlocked && $("auroraCard")) $("auroraCard").hidden = false;
    renderMuteBtn();
    refreshAllSteppers();
    $("switchAuto").classList.toggle("on", settings.autoStart);
    $("switchSound").classList.toggle("on", settings.sound);
    $("switchNotify").classList.toggle("on", settings.notify);
    $("switchVibrate").classList.toggle("on", settings.vibrate);
    if ($("switchThemeAuto")) {
      $("switchThemeAuto").classList.toggle("on", settings.themeAuto);
      $("switchThemeAuto").setAttribute("aria-checked", settings.themeAuto ? "true" : "false");
    }
    if ($("switchCompact")) {
      $("switchCompact").classList.toggle("on", !!settings.compact);
      $("switchCompact").setAttribute("aria-checked", settings.compact ? "true" : "false");
    }
    if ($("switchConfirmSkip")) {
      $("switchConfirmSkip").classList.toggle("on", !!settings.confirmSkip);
      $("switchConfirmSkip").setAttribute("aria-checked", settings.confirmSkip ? "true" : "false");
    }
    document.body.classList.toggle("compact", !!settings.compact);
    renderSoundPicks();
    renderTimer(); renderTasks();
    if (state.page === "reports") renderReports();
    if (state.page === "log") { renderLogFilters(); renderLog(); }
  }

  let confirmResolver = null;
  function askConfirm({ title, text, ok, danger }) {
    $("confirmTitle").textContent = title || "Are you sure?";
    $("confirmText").textContent = text || "";
    $("confirmOk").textContent = ok || "Confirm";
    $("confirmOk").classList.toggle("danger", !!danger);
    $("confirmModal").classList.add("open");
    return new Promise((resolve) => { confirmResolver = resolve; });
  }
  function settleConfirm(val) {
    $("confirmModal").classList.remove("open");
    if (confirmResolver) confirmResolver(val);
    confirmResolver = null;
  }
  $("confirmOk").onclick = () => settleConfirm(true);
  $("confirmCancel").onclick = () => settleConfirm(false);
  $("confirmModal").onclick = (e) => { if (e.target.id === "confirmModal") settleConfirm(false); };

  $("taskPromptSkip").onclick = () => { if (taskPromptResolver) taskPromptResolver(null); };
  $("taskPromptModal").onclick = (e) => {
    if (e.target.id === "taskPromptModal" && taskPromptResolver) taskPromptResolver(null);
  };

  function setNoteModalCopy(editing) {
    $("noteModalTitle").textContent = editing ? "Edit note" : "Session complete";
    $("noteModalText").textContent = editing
      ? "Update the note for this session, or clear it and save to remove it."
      : "What did you work on? Skip anytime.";
    $("noteSkip").textContent = editing ? "Cancel" : "Skip";
    $("noteSave").textContent = editing ? "Save" : "Save note";
  }
  function openNoteModal() {
    setNoteModalCopy(false);
    $("noteInput").value = "";
    $("noteModal").classList.add("open");
    setTimeout(() => $("noteInput").focus(), 50);
  }
  function openLogNoteEditor(sessionId) {
    const s = state.sessions.find((x) => x.id === sessionId);
    if (!s) return;
    state.editingLogNoteId = sessionId;
    setNoteModalCopy(true);
    $("noteInput").value = s.note || "";
    $("noteModal").classList.add("open");
    setTimeout(() => { const el = $("noteInput"); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }, 50);
  }
  function closeNote(saveNote) {
    if (state.editingLogNoteId) {
      const s = state.sessions.find((x) => x.id === state.editingLogNoteId);
      if (saveNote && s) {
        const text = $("noteInput").value.trim();
        if (text) s.note = text; else delete s.note;
        save();
        renderLog();
      }
      state.editingLogNoteId = null;
      $("noteModal").classList.remove("open");
      setNoteModalCopy(false);
      return;
    }
    if (saveNote && state.pendingNoteId) {
      const s = state.sessions.find((x) => x.id === state.pendingNoteId);
      const text = $("noteInput").value.trim();
      if (s && text) s.note = text;
      save();
    }
    state.pendingNoteId = null;
    $("noteModal").classList.remove("open");
    const today = dayKey(Date.now());
    const todayCount = countRange(startOfDay(), startOfDay() + 86400000);
    const shouldReview = todayCount >= settings.dailyGoal && state.lastReviewDay !== today;
    if (shouldReview && $("reviewModal")) {
      openReviewModal();
      return;
    }
    if (state.pendingAutoStart) {
      state.pendingAutoStart = false;
      startTimer();
    }
  }
  $("noteSkip").onclick = () => closeNote(false);
  $("noteSave").onclick = () => closeNote(true);

  function openReviewModal() {
    $("reviewInput").value = "";
    $("reviewModal").classList.add("open");
    setTimeout(() => $("reviewInput").focus(), 50);
  }
  function closeReview(saveIt) {
    if (saveIt) {
      const text = $("reviewInput").value.trim();
      if (text) {
        state.sessions.push({
          id: uid(), mode: "focus", startedAt: Date.now(), endedAt: Date.now(),
          durationSec: 0, completed: true, note: "Review: " + text, taskId: undefined,
        });
      }
      state.lastReviewDay = dayKey(Date.now());
      save();
    } else {
      state.lastReviewDay = dayKey(Date.now());
      save();
    }
    $("reviewModal").classList.remove("open");
    if (state.pendingAutoStart) {
      state.pendingAutoStart = false;
      startTimer();
    }
  }
  if ($("reviewSkip")) $("reviewSkip").onclick = () => closeReview(false);
  if ($("reviewSave")) $("reviewSave").onclick = () => closeReview(true);

  let toastTimer = null;
  let toastUndo = null;
  function toast(msg, action, onAction) {
    $("toastMsg").textContent = msg;
    const btn = $("toastAction");
    toastUndo = onAction || null;
    btn.hidden = !onAction;
    btn.textContent = action || "Undo";
    $("toast").hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $("toast").hidden = true; toastUndo = null; }, 4200);
  }
  $("toastAction").onclick = () => {
    if (toastUndo) toastUndo();
    $("toast").hidden = true;
    toastUndo = null;
  };

  function burstConfetti() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { toast("Goal reached"); return; }
    const canvas = document.createElement("canvas");
    canvas.className = "confetti";
    document.body.appendChild(canvas);
    const ctx2 = canvas.getContext("2d");
    const w = canvas.width = window.innerWidth;
    const h = canvas.height = window.innerHeight;
    const cs = getComputedStyle(document.documentElement);
    const colors = [cs.getPropertyValue("--work").trim() || "#e7b54a", cs.getPropertyValue("--rest").trim() || "#5fa8a0", cs.getPropertyValue("--text").trim() || "#ecece5"];
    const bits = Array.from({ length: 70 }, () => ({
      x: w * 0.5 + (Math.random() - 0.5) * 80,
      y: h * 0.28,
      vx: (Math.random() - 0.5) * 7,
      vy: -3 - Math.random() * 5,
      g: 0.16 + Math.random() * 0.08,
      s: 3 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      diamond: Math.random() > 0.5,
    }));
    const t0 = performance.now();
    function frame(t) {
      const dt = Math.min(32, t - t0);
      ctx2.clearRect(0, 0, w, h);
      bits.forEach((p) => {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx2.save();
        ctx2.translate(p.x, p.y);
        ctx2.rotate(p.rot);
        ctx2.fillStyle = p.color;
        if (p.diamond) {
          ctx2.beginPath();
          ctx2.moveTo(0, -p.s);
          ctx2.lineTo(p.s, 0);
          ctx2.lineTo(0, p.s);
          ctx2.lineTo(-p.s, 0);
          ctx2.closePath();
          ctx2.fill();
        } else {
          ctx2.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        }
        ctx2.restore();
      });
      if (t - t0 < 1400) requestAnimationFrame(frame);
      else { canvas.remove(); }
    }
    requestAnimationFrame(frame);
  }

  const tourSteps = [
    { title: "Start here", text: "Press play under the ring. Focus, short break, long break — that is the whole cycle." },
    { title: "Tasks (optional)", text: "Type what you are working on below the timer. Tap a task to select it before you start." },
    { title: "While you focus", text: "Chrome tucks away so you can stay with the ring. Tap the clock for controls, or the background to leave zen. Pause only with the pause button." },
    { title: "Reports & Log", text: "Use the bottom tabs for your week, heatmap, and session history." },
    { title: "Make it yours", text: "Theme and accent at the top. Durations, sounds, and backup are in Settings." },
  ];
  let tourIndex = 0;
  let tourReplay = false;
  function renderTourStep() {
    const s = tourSteps[tourIndex];
    $("tourKicker").textContent = "Step " + (tourIndex + 1) + " of " + tourSteps.length;
    $("tourTitle").textContent = s.title;
    $("tourText").textContent = s.text;
    $("tourNext").textContent = tourIndex === tourSteps.length - 1 ? "Start" : "Next";
  }
  function finishTour() {
    localStorage.setItem(TOUR_KEY, "1");
    $("onboardModal").classList.remove("open");
    tourReplay = false;
  }
  function startTour(replay) {
    tourReplay = !!replay;
    tourIndex = 0;
    renderTourStep();
    $("onboardModal").classList.add("open");
  }
  $("tourNext").onclick = () => {
    if (tourIndex === tourSteps.length - 1) { finishTour(); return; }
    tourIndex++; renderTourStep();
  };
  $("tourSkip").onclick = finishTour;
  $("tourReplay").addEventListener("click", () => { shutDrawer(); startTour(true); });

  function unseenChangelog() {
    const seen = localStorage.getItem(CHANGELOG_SEEN_KEY);
    if (!seen) return CHANGELOG;
    const idx = CHANGELOG.findIndex((c) => c.version === seen);
    if (idx === 0) return [];
    if (idx === -1) return CHANGELOG;
    return CHANGELOG.slice(0, idx);
  }
  function renderChangelog(entries) {
    const list = entries && entries.length ? entries : CHANGELOG;
    $("changeTitle").textContent = list[0].title;
    $("changeBlurb").textContent = list[0].blurb + (list[0].date ? " · " + list[0].date : "");
    const box = $("changeList");
    box.innerHTML = "";
    list.forEach((ver, i) => {
      const wrap = document.createElement("div");
      wrap.className = "change-ver";
      if (i > 0) {
        const h = document.createElement("h4");
        h.textContent = ver.title + (ver.date ? " · " + ver.date : "");
        wrap.appendChild(h);
      }
      ver.items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "change-item";
        row.innerHTML = '<span class="change-tag">' + escapeHtml(item.tag) + "</span><span>" + escapeHtml(item.text) + "</span>";
        wrap.appendChild(row);
      });
      box.appendChild(wrap);
    });
  }
  function openChangelog(force) {
    const entries = force ? CHANGELOG : unseenChangelog();
    if (!entries.length) return;
    renderChangelog(entries);
    $("changelogModal").classList.add("open");
  }
  function dismissChangelog() {
    localStorage.setItem(CHANGELOG_SEEN_KEY, APP_VERSION);
    $("changelogModal").classList.remove("open");
  }
  $("changeOk").addEventListener("click", dismissChangelog);
  if ($("changeCloseX")) $("changeCloseX").addEventListener("click", dismissChangelog);
  $("whatsNewBtn").addEventListener("click", () => { shutDrawer(); openChangelog(true); });
  if ($("footerUpdated")) {
    $("footerUpdated").addEventListener("click", () => openChangelog(true));
  }

  $("pngBtn").addEventListener("click", () => exportReportPng());

  function exportReportPng() {
    const canvas = document.createElement("canvas");
    const W = 1080, H = 1350;
    canvas.width = W; canvas.height = H;
    const g = canvas.getContext("2d");
    const cs = getComputedStyle(document.documentElement);
    const bg = cs.getPropertyValue("--bg").trim() || "#15171b";
    const surface = cs.getPropertyValue("--surface").trim() || "#1d2025";
    const text = cs.getPropertyValue("--text").trim() || "#ecece5";
    const dim = cs.getPropertyValue("--text-dim").trim() || "#9a9da3";
    const work = cs.getPropertyValue("--work").trim() || "#e7b54a";
    const border = cs.getPropertyValue("--border").trim() || "#2c2f36";
    const now = Date.now();
    const { todayFrom, weekFrom } = weekBounds(now);
    const weekSec = sumRange(weekFrom, weekFrom + 7 * 86400000);
    const todayCount = countRange(todayFrom, todayFrom + 86400000);
    const weekCount = countRange(weekFrom, weekFrom + 7 * 86400000);
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    g.fillStyle = work;
    g.beginPath(); g.arc(88, 92, 10, 0, Math.PI * 2); g.fill();
    g.fillStyle = text;
    g.font = "700 42px 'Space Grotesk', sans-serif";
    g.fillText("Cadence", 112, 106);
    g.fillStyle = dim;
    g.font = "500 22px Inter, sans-serif";
    g.fillText("This week", 72, 180);
    g.fillStyle = text;
    g.font = "600 96px 'JetBrains Mono', monospace";
    g.fillText(fmtMs(weekSec), 72, 280);
    g.fillStyle = dim;
    g.font = "400 22px Inter, sans-serif";
    g.fillText(weekCount + " focus sessions  ·  streak " + streak() + "d  ·  best " + longestStreak() + "d", 72, 330);

    const names = ["S", "M", "T", "W", "T", "F", "S"];
    let max = 1;
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const ts = todayFrom - i * 86400000;
      const m = Math.round(sumRange(ts, ts + 86400000) / 60);
      days.push({ label: names[new Date(ts).getDay()], m });
      max = Math.max(max, m);
    }
    const chartY = 420, chartH = 280, gap = 24, barW = 88;
    const chartX = 72;
    days.forEach((d0, i) => {
      const x = chartX + i * (barW + gap);
      const h = Math.max(8, Math.round((d0.m / max) * chartH));
      g.fillStyle = surface;
      g.fillRect(x, chartY, barW, chartH);
      g.fillStyle = work;
      g.fillRect(x, chartY + chartH - h, barW, h);
      g.fillStyle = dim;
      g.font = "500 20px 'JetBrains Mono', monospace";
      g.textAlign = "center";
      g.fillText(d0.label, x + barW / 2, chartY + chartH + 36);
      g.textAlign = "left";
    });

    const cards = [
      { l: "Today", v: todayCount + " / " + settings.dailyGoal },
      { l: "Week goal", v: weekCount + " / " + settings.weeklyGoal },
      { l: "Avg focus", v: fmtMs(avgFocusSec()) },
      { l: "Completion", v: (completionRate() == null ? "—" : completionRate() + "%") },
    ];
    cards.forEach((c, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 72 + col * 484, y = 800 + row * 180;
      g.fillStyle = surface;
      g.strokeStyle = border;
      g.lineWidth = 2;
      roundRect(g, x, y, 452, 156, 24);
      g.fill(); g.stroke();
      g.fillStyle = dim;
      g.font = "500 16px Inter, sans-serif";
      g.fillText(c.l.toUpperCase(), x + 28, y + 48);
      g.fillStyle = text;
      g.font = "600 40px 'JetBrains Mono', monospace";
      g.fillText(c.v, x + 28, y + 108);
    });

    g.fillStyle = dim;
    g.font = "400 18px Inter, sans-serif";
    g.fillText("cadence  ·  local only  ·  " + new Date().toLocaleDateString(), 72, 1288);

    canvas.toBlob((blob) => {
      if (!blob) { toast("Could not create image"); return; }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "cadence-report.png";
      a.click();
      toast("Report image saved");
    }, "image/png");
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  if ("serviceWorker" in navigator) {
    const scripts = document.getElementsByTagName("script");
    const me = scripts[scripts.length - 1];
    const swUrl = me && me.src ? new URL("../sw.js", me.src).href : "./sw.js";
    navigator.serviceWorker.register(swUrl + "?v=" + APP_VERSION).then((reg) => {
      // Force check for updates on each load
      try { reg.update(); } catch (e) { /* ignore */ }
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) {
            // New build ready — activate immediately
            nw.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        location.reload();
      });
    }).catch(() => { /* ignore */ });
  }

  function resumeTimerIfNeeded() {
    const endsAt = state._restoreEndsAt;
    const wasRunning = state._restoreRunning;
    state._restoreEndsAt = null;
    state._restoreRunning = false;
    if (!wasRunning || !endsAt) return;
    const rem = Math.ceil((endsAt - Date.now()) / 1000);
    if (rem <= 0) {
      // Timer finished while away — log it with the real start/end times, not now
      state.running = false;
      state.endsAt = null;
      state.secondsLeft = 0;
      try { completeAwayPhase(endsAt); } catch (e) { state.secondsLeft = durationFor(state.mode); save(); }
      return;
    }
    state.endsAt = endsAt;
    state.secondsLeft = rem;
    state.running = true;
    clearInterval(state.timerId);
    state.timerId = setInterval(tick, 200);
    renderTimer();
    scheduleZen();
    save();
  }

  // Flush timer state when tab/app is backgrounded or closed
  window.addEventListener("pagehide", () => { try { save(); } catch (e) { /* ignore */ } });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      try { save(); } catch (e) { /* ignore */ }
    }
  });

  const hadData = load();
  if (resetRecurringTasks()) save();
  checkBadgeUnlocks(true);
  const hash = (location.hash || "").replace("#", "");
  try { renderAll(); } catch (e) { console.error(e); toast("Something went wrong rendering. Try Settings → Clear, or import a backup."); }
  resumeTimerIfNeeded();
  if (hash === "reports" || hash === "log") showPage(hash);

  if (!localStorage.getItem(TOUR_KEY)) {
    localStorage.setItem(CHANGELOG_SEEN_KEY, APP_VERSION);
    startTour(false);
  } else if (hadData) {
    openChangelog(false);
  } else {
    localStorage.setItem(CHANGELOG_SEEN_KEY, APP_VERSION);
  }
})();
