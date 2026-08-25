/* Cadence core — shared namespace */
window.Cadence = window.Cadence || {};
(function (Cadence) {
"use strict";

  Cadence.R = 120;
  Cadence.CIRC = 2 * Math.PI * Cadence.R;
  Cadence.KEY = "cadence-v1-static";
  Cadence.TOUR_KEY = "cadence-v1-tour-done";
  Cadence.CHANGELOG_SEEN_KEY = "cadence-changelog-seen";
  Cadence.CELEBRATE_KEY = "cadence-celebrated";
  Cadence.LOG_PAGE = 40;
  Cadence.MODE_LABEL = { focus: "Focus", short: "Short Break", long: "Long Break" };
  Cadence.THEME_COLORS = { graphite: "#15171b", linen: "#e9ebee", moss: "#121a16", dusk: "#17151f", oled: "#000000" };

  Cadence.APP_VERSION = "2.4.0";
  Cadence.SCHEMA_VERSION = 2;
  Cadence.CHANGELOG = [
    {
      version: "2.4.0",
      date: "August 2026",
      title: "Cadence 2.4",
      blurb: "Full-screen Cadence.settings, footer, PWA updates that stick, and task select that stays selected.",
      items: [
        { tag: "New", text: "Settings open as a full-screen sheet instead of a side drawer." },
        { tag: "New", text: "Site footer with last-updated → What's new; changelog close (X)." },
        { tag: "Fix", text: "Tapping a task always selects it (no accidental unselect)." },
        { tag: "Fix", text: "Shortcuts live in Settings; PWA refresh picks up new builds." },
      ],
    },
    {
      version: "2.3.0",
      date: "August 2026",
      title: "Cadence 2.3",
      blurb: "Theme + accent picker, mini stats, compact mode, and calmer skip confirms.",
      items: [
        { tag: "New", text: "Theme panel with named cards and independent accent colors." },
        { tag: "New", text: "Mini stats under the timer (Cadence.streak · today goal progress)." },
        { tag: "New", text: "Compact layout toggle and confirm-before-skip." },
        { tag: "Polish", text: "Accent tints the ring, chips, and theme icon across all themes." },
      ],
    },
    {
      version: "2.2.0",
      date: "August 2026",
      title: "Cadence 2.2",
      blurb: "Theme, tasks, and reports polished for mobile — click a task to focus, auto-strike when the target is met.",
      items: [
        { tag: "Polish", text: "Theme swatches match each palette; theme icon uses the accent color." },
        { tag: "Polish", text: "Larger heatmap with weekday labels; cleaner hour chart on phones." },
        { tag: "New", text: "Tap a task to make it active; Start focus button; auto-strike when target is hit." },
        { tag: "Polish", text: "Task rows tighter: progress, length, and due chips cleaned up." },
        { tag: "New", text: "Empty-Cadence.state hints on sparse charts; peak-hour highlight." },
      ],
    },
    {
      version: "2.1.0",
      date: "August 2026",
      title: "Cadence 2.1",
      blurb: "Live title, active task on the ring, break ideas, CSV export, and calmer polish — still fully local.",
      items: [
        { tag: "New", text: "Live tab title with mode and estimated end time." },
        { tag: "New", text: "Active task shown on the ring; custom focus length per task." },
        { tag: "New", text: "Break suggestions, daily review prompt, and sound volume." },
        { tag: "New", text: "Heatmap and week bars open the matching log filter." },
        { tag: "New", text: "CSV export, system theme auto, Today/This-week log chips." },
        { tag: "Polish", text: "Stronger background resync, aria-live timer, focus-visible, system fonts offline." },
      ],
    },
    {
      version: "2.0.0",
      date: "August 2026",
      title: "Cadence 2.0",
      blurb: "A quieter timer, richer reports, and a home-screen app — still fully local.",
      items: [
        { tag: "New", text: "Install Cadence as a standalone app, with offline support." },
        { tag: "New", text: "Zen mode hides chrome while you focus. Tap the timer to bring it back." },
        { tag: "New", text: "Session notes, vibration, and three completion sounds." },
        { tag: "New", text: "Edit, reorder, pause, and set pomodoro targets on tasks." },
        { tag: "New", text: "Longest Cadence.streak, completion rate, time-by-task, and weekly/monthly goals." },
        { tag: "New", text: "Search the log, export a report image, and copy a JSON backup." },
        { tag: "Fix", text: "Settings drawer and tab bar hold up on mobile zoom and gesture bars." },
      ],
    },
  ];

  Cadence.settings = {
    focus: 25, short: 5, long: 15, interval: 4,
    dailyGoal: 8, weeklyGoal: 40, monthlyGoal: 160,
    autoStart: false, sound: true, Cadence.notify: false, tickSound: false,
    Cadence.vibrate: true, soundChoice: "chime", volume: 2, themeAuto: false,
    accent: "default", compact: false, confirmSkip: true,
  };
  Cadence.ACCENTS = {
    default: null,
    amber:  { work: "#e7b54a", soft: "rgba(231,181,74,0.16)", ink: "#171308" },
    coral:  { work: "#ff6b4a", soft: "rgba(255,107,74,0.16)", ink: "#1a0a06" },
    mint:   { work: "#3dcfb6", soft: "rgba(61,207,182,0.14)", ink: "#03140f" },
    violet: { work: "#8c7ae6", soft: "rgba(140,122,230,0.16)", ink: "#0f0c1e" },
    rose:   { work: "#ff5470", soft: "rgba(255,84,112,0.16)", ink: "#170307" },
    sky:    { work: "#4aa3ff", soft: "rgba(74,163,255,0.16)", ink: "#061018" },
  };
  Cadence.VOLUME_LABEL = { 1: "Quiet", 2: "Normal", 3: "Loud" };
  Cadence.BREAK_IDEAS = [
    "Stand up and stretch your shoulders",
    "Drink a glass of water",
    "Look 20 feet away for 20 seconds",
    "Take three slow breaths",
    "Walk to a window",
    "Roll your neck gently",
    "Shake out your hands",
    "Step outside if you can",
  ];
  Cadence.state = {
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
    logLimit: Cadence.LOG_PAGE,
    taskView: "open",
    lastExportAt: 0,
    zen: false,
    pendingAutoStart: false,
    pendingNoteId: null,
    lastTickSecond: null,
    logDayFilter: null,
    lastReviewDay: null,
    schemaVersion: Cadence.SCHEMA_VERSION,
  };

  Cadence.$ = (id) => document.getElementById(id);
  const ringProgress = Cadence.$("ringProgress"); Cadence.ringProgress = ringProgress;
  Cadence.ringProgress.style.strokeDasharray = `${Cadence.CIRC} ${Cadence.CIRC}`;

  const ticksG = Cadence.$("ticks");
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30) * Math.PI / 180;
    const cx = 140, cy = 140, rO = 134, rI = 126;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", cx + rO * Math.cos(angle));
    line.setAttribute("y1", cy + rO * Math.sin(angle));
    line.setAttribute("x2", cx + rI * Math.cos(angle));
    line.setAttribute("y2", cy + rI * Math.sin(angle));
    line.setAttribute("class", "Cadence.tick");
    ticksG.appendChild(line);
  }

  Cadence.uid = function() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }
  Cadence.durationFor = function(mode) {
    if (mode === "focus") {
      const t = Cadence.state.activeTaskId && Cadence.state.tasks.find((x) => x.id === Cadence.state.activeTaskId);
      if (t && t.focusMin >= 5) return t.focusMin * 60;
      return Cadence.settings.focus * 60;
    }
    return (mode === "short" ? Cadence.settings.short : Cadence.settings.long) * 60;
  }
  Cadence.pad = function(n) { return String(n).padStart(2, "0"); }
  Cadence.fmtMs = function(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    if (h <= 0) return m + "m";
    return m ? h + "h " + m + "m" : h + "h";
  }
  Cadence.dayKey = function(ts) {
    const d = new Date(ts);
    return d.getFullYear() + "-" + Cadence.pad(d.getMonth() + 1) + "-" + Cadence.pad(d.getDate());
  }
  Cadence.startOfDay = function(ts) {
    const d = new Date(ts || Date.now()); d.setHours(0, 0, 0, 0); return d.getTime();
  }
  Cadence.escapeHtml = function(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => {
      if (c === "&") return "&" + "amp;";
      if (c === "<") return "&" + "lt;";
      if (c === ">") return "&" + "gt;";
      if (c === '"') return "&" + "quot;";
      return "&#39;";
    });
  }
  Cadence.nextModeAfter = function(mode, focusCount) {
    if (mode === "focus") return (focusCount + 1) % Cadence.settings.interval === 0 ? "long" : "short";
    return "focus";
  }

  
})(window.Cadence);
