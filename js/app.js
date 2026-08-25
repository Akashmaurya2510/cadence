(function () {
  const R = 120, C = 2 * Math.PI * R;
  const KEY = "cadence-v1-static";
  const TOUR_KEY = "cadence-v1-tour-done";
  const CHANGELOG_SEEN_KEY = "cadence-changelog-seen";
  const CELEBRATE_KEY = "cadence-celebrated";
  const LOG_PAGE = 40;
  const MODE_LABEL = { focus: "Focus", short: "Short Break", long: "Long Break" };
  const THEME_COLORS = { graphite: "#15171b", linen: "#e9ebee", moss: "#121a16", dusk: "#17151f", oled: "#000000" };

  const APP_VERSION = "2.0.0";
  const CHANGELOG = [
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
        { tag: "New", text: "Longest streak, completion rate, time-by-task, and weekly/monthly goals." },
        { tag: "New", text: "Search the log, export a report image, and copy a JSON backup." },
        { tag: "Fix", text: "Settings drawer and tab bar hold up on mobile zoom and gesture bars." },
      ],
    },
  ];

  const settings = {
    focus: 25, short: 5, long: 15, interval: 4,
    dailyGoal: 8, weeklyGoal: 40, monthlyGoal: 160,
    autoStart: false, sound: true, notify: false, tickSound: false,
    vibrate: true, soundChoice: "chime",
  };
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
    return (mode === "focus" ? settings.focus : mode === "short" ? settings.short : settings.long) * 60;
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
    return {
      settings, theme: state.theme, mode: state.mode, secondsLeft: state.secondsLeft,
      focusCount: state.focusCount, tasks: state.tasks, activeTaskId: state.activeTaskId,
      sessions: state.sessions, demo: state.demo, lastExportAt: state.lastExportAt,
    };
  }
  function save() {
    localStorage.setItem(KEY, JSON.stringify(snapshot()));
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
      state.secondsLeft = d.secondsLeft || durationFor(state.mode);
      state.focusCount = d.focusCount || 0;
      state.tasks = Array.isArray(d.tasks) ? d.tasks.map(normalizeTask) : [];
      state.activeTaskId = d.activeTaskId || null;
      state.sessions = Array.isArray(d.sessions) ? d.sessions : [];
      state.demo = !!d.demo;
      state.lastExportAt = d.lastExportAt || 0;
      return true;
    } catch { return false; }
  }
  function normalizeTask(t) {
    return {
      id: t.id || uid(),
      title: String(t.title || "Untitled"),
      done: !!t.done,
      pomodoros: Number(t.pomodoros) || 0,
      target: Number(t.target) || 0,
      due: t.due === "today" || t.due === "later" ? t.due : null,
      archived: !!t.archived,
    };
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

  function mulberry32(a) {
    return function () {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function seed() {
    const rand = mulberry32(20260825);
    const tasks = [
      { id: "t1", title: "Deep work block", done: false, pomodoros: 0, target: 8, due: "today", archived: false },
      { id: "t2", title: "Write and review", done: false, pomodoros: 0, target: 4, due: "today", archived: false },
      { id: "t3", title: "Study session", done: true, pomodoros: 0, target: 3, due: "later", archived: false },
      { id: "t4", title: "Side project", done: false, pomodoros: 0, target: 6, due: "later", archived: true },
    ];
    const sessions = [];
    const now = Date.now();
    for (let d = 27; d >= 0; d--) {
      const day = new Date(now - d * 86400000);
      const weekend = day.getDay() === 0 || day.getDay() === 6;
      const count = weekend ? Math.floor(rand() * 3) : 3 + Math.floor(rand() * 5);
      for (let i = 0; i < count; i++) {
        const started = new Date(day);
        started.setHours(8 + Math.floor(rand() * 11), Math.floor(rand() * 50), 0, 0);
        if (started.getTime() > now) continue;
        const dur = 25 * 60 - Math.floor(rand() * 90);
        const taskId = rand() < 0.4 ? "t1" : rand() < 0.7 ? "t2" : rand() < 0.85 ? "t3" : undefined;
        const completed = rand() > 0.08;
        const note = completed && rand() < 0.18 ? "Kept the block intact." : undefined;
        sessions.push({
          id: "s" + d + i, mode: "focus", startedAt: started.getTime(),
          endedAt: started.getTime() + dur * 1000, durationSec: dur, taskId, completed, note,
        });
      }
    }
    tasks.forEach((t) => { t.pomodoros = sessions.filter((s) => s.taskId === t.id && s.completed).length; });
    state.tasks = tasks;
    state.sessions = sessions;
    state.demo = true;
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
  function tone(ac, freq, start, dur, type, gain) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.02);
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
        tone(ac, 523, t0, 0.55, "sine", 0.14);
        tone(ac, 784, t0 + 0.08, 0.7, "sine", 0.1);
        tone(ac, 1046, t0 + 0.18, 0.9, "sine", 0.08);
      } else if (kind === "wood") {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = "triangle"; o.frequency.setValueAtTime(180, t0);
        o.frequency.exponentialRampToValueAtTime(60, t0 + 0.12);
        g.gain.setValueAtTime(0.22, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
        o.connect(g); g.connect(ac.destination);
        o.start(t0); o.stop(t0 + 0.16);
        tone(ac, 140, t0 + 0.16, 0.1, "triangle", 0.12);
      } else {
        [0, 0.16, 0.32].forEach((t, i) => tone(ac, i === 2 ? 880 : 660, t0 + t, 0.14, "sine", 0.16));
      }
    } catch (e) { /* ignore */ }
  }
  function playTick() {
    if (!settings.tickSound || state.mode !== "focus") return;
    try {
      const ac = ctx();
      tone(ac, 920, ac.currentTime, 0.03, "square", 0.03);
    } catch (e) { /* ignore */ }
  }
  function vibrate() {
    if (!settings.vibrate || !navigator.vibrate) return;
    try { navigator.vibrate([40, 80, 40]); } catch (e) { /* ignore */ }
  }
  function notify(title, body) {
    if (!settings.notify || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try { new Notification(title, { body, silent: true }); } catch (e) { /* ignore */ }
  }

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    const color = THEME_COLORS[theme] || "#15171b";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", color);
    document.querySelectorAll(".swatch").forEach((s) => s.classList.toggle("active", s.dataset.t === theme));
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
      const dueLabel = t.due === "today" ? "Today" : t.due === "later" ? "Later" : "Due";
      row.innerHTML =
        '<button class="chk" aria-label="toggle done"></button>' +
        '<div class="body">' +
          '<button class="title">' + escapeHtml(t.title) + "</button>" +
          '<div class="meta">' +
            (t.target > 0
              ? '<div class="pomo-bar" title="' + t.pomodoros + " / " + t.target + '"><span style="width:' + pct + '%"></span></div>' +
                '<button type="button" class="today-line pomo-hit">' + t.pomodoros + " / " + t.target + "</button>"
              : '<button type="button" class="today-line pomo-hit">' + (t.pomodoros ? t.pomodoros + " focus · " : "") + "target</button>") +
            '<button class="due-chip' + (t.due === "today" ? " today" : "") + '" type="button">' + dueLabel + "</button>" +
          "</div>" +
        "</div>" +
        '<div class="actions">' +
          '<button class="iconish up" aria-label="Move up" title="Move up">↑</button>' +
          '<button class="iconish down" aria-label="Move down" title="Move down">↓</button>' +
          '<button class="iconish archive" aria-label="' + (t.archived ? "Resume" : "Pause") + '" title="' + (t.archived ? "Resume" : "Pause") + '">' +
            (t.archived
              ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
              : '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>') +
          "</button>" +
          '<button class="iconish del" aria-label="Delete">×</button>' +
        "</div>";
      row.querySelector(".chk").onclick = (e) => { e.stopPropagation(); t.done = !t.done; if (t.done && state.activeTaskId === t.id) state.activeTaskId = null; save(); renderTasks(); };
      row.querySelector(".title").onclick = () => {
        if (t.archived || t.done) return;
        state.activeTaskId = state.activeTaskId === t.id ? null : t.id;
        save(); renderTasks();
      };
      row.querySelector(".title").ondblclick = (e) => { e.preventDefault(); startEdit(row, t); };
      row.querySelector(".due-chip").onclick = (e) => {
        e.stopPropagation();
        t.due = t.due === "today" ? "later" : t.due === "later" ? null : "today";
        save(); renderTasks();
      };
      const pomoHit = row.querySelector(".pomo-hit");
      if (pomoHit) {
        pomoHit.onclick = (e) => {
          e.stopPropagation();
          t.target = t.target >= 12 ? 0 : (t.target || 0) + 1;
          save(); renderTasks();
        };
      }
      row.querySelector(".up").onclick = (e) => { e.stopPropagation(); moveTask(t.id, -1); };
      row.querySelector(".down").onclick = (e) => { e.stopPropagation(); moveTask(t.id, 1); };
      row.querySelector(".archive").onclick = (e) => {
        e.stopPropagation();
        t.archived = !t.archived;
        if (t.archived && state.activeTaskId === t.id) state.activeTaskId = null;
        save(); renderTasks();
        toast(t.archived ? "Task paused" : "Task resumed");
      };
      row.querySelector(".del").onclick = (e) => { e.stopPropagation(); deleteTask(t); };
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
    document.body.setAttribute("data-mode", state.mode);
    setTheme(state.theme);
    ringProgress.style.strokeDashoffset = C * (1 - state.secondsLeft / total);
    $("playIcon").innerHTML = state.running
      ? '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>'
      : '<path d="M8 5v14l11-7z"/>';
    $("playBtn").setAttribute("aria-label", state.running ? "Pause" : "Start");
    $("ringStage").classList.toggle("breathing", state.running);
    document.title = state.running ? mm + ":" + ss + " · Cadence" : "Cadence";
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
    $("demoBanner").style.display = state.demo ? "flex" : "none";
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
    days.forEach((d0) => {
      const col = document.createElement("div");
      col.className = "bar-col";
      const h = Math.max(4, Math.round((d0.m / max) * 130));
      col.innerHTML = '<div class="bar" style="height:' + h + 'px" title="' + d0.m + ' min"></div><span>' + d0.label + "</span>";
      bars.appendChild(col);
    });

    const heat = $("heatGrid");
    heat.innerHTML = "";
    const map = {};
    focusSessions().forEach((s) => {
      const k = dayKey(s.endedAt);
      map[k] = (map[k] || 0) + s.durationSec / 60;
    });
    const start = weekFrom - 15 * 7 * 86400000;
    for (let t = start; t < todayFrom + 86400000; t += 86400000) {
      const cell = document.createElement("div");
      const m = Math.round(map[dayKey(t)] || 0);
      let cls = "";
      if (m >= 100) cls = "h4"; else if (m >= 50) cls = "h3"; else if (m >= 25) cls = "h2"; else if (m > 0) cls = "h1";
      cell.className = "heat-cell " + cls;
      cell.title = dayKey(t) + ": " + m + "m";
      heat.appendChild(cell);
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
    hours.forEach((h) => {
      const col = document.createElement("div");
      col.className = "bar-col";
      const ht = Math.max(4, Math.round((h.m / hourMax) * 110));
      col.innerHTML = '<div class="bar rest" style="height:' + ht + 'px"></div><span>' + (h.hour % 12 || 12) + (h.hour >= 12 ? "p" : "a") + "</span>";
      hourBars.appendChild(col);
    });

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
    return state.sessions.filter((s) => {
      if (state.logFilter !== "all" && s.mode !== state.logFilter) return false;
      if (state.logTaskFilter !== "all") {
        if (state.logTaskFilter === "_none" && s.taskId) return false;
        if (state.logTaskFilter !== "_none" && s.taskId !== state.logTaskFilter) return false;
      }
      if (q) {
        const task = state.tasks.find((t) => t.id === s.taskId);
        const hay = ((task && task.title) || "") + " " + (s.note || "") + " " + MODE_LABEL[s.mode];
        if (!hay.toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => b.endedAt - a.endedAt);
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
    Array.from(ids).forEach((id) => {
      if (state.tasks.some((t) => t.id === id)) return;
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = "Deleted task";
      sel.appendChild(opt);
    });
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
        const row = document.createElement("div");
        row.className = "log-row";
        const t0 = new Date(s.startedAt), t1 = new Date(s.endedAt);
        row.innerHTML =
          '<span class="dot ' + (s.mode === "focus" ? "focus" : "break") + '"></span>' +
          '<div style="flex:1"><div>' + MODE_LABEL[s.mode] + (task ? " · " + escapeHtml(task.title) : "") + "</div>" +
          '<div class="today-line">' + pad(t0.getHours()) + ":" + pad(t0.getMinutes()) + " – " + pad(t1.getHours()) + ":" + pad(t1.getMinutes()) + "</div>" +
          (s.note ? '<div class="log-note">' + escapeHtml(s.note) + "</div>" : "") +
          '</div><div style="text-align:right"><div>' + Math.round(s.durationSec / 60) + "m</div>" +
          '<div class="today-line">' + (s.completed ? "Done" : "Skipped") + "</div></div>";
        box.appendChild(row);
      });
      wrap.appendChild(sec);
    });
  }

  function showPage(name) {
    state.page = name;
    if (name !== "timer") setZen(false);
    document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.dataset.page === name));
    document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === name));
    if (name === "reports") renderReports();
    if (name === "log") { renderLogFilters(); renderLog(); }
    try { location.hash = name === "timer" ? "" : name; } catch (e) { /* ignore */ }
  }

  function logSession(mode, elapsed, completed) {
    if (elapsed < 15 && !completed) return null;
    const now = Date.now();
    const entry = {
      id: uid(), mode, startedAt: now - elapsed * 1000, endedAt: now,
      durationSec: elapsed, taskId: mode === "focus" ? state.activeTaskId : undefined, completed,
    };
    state.sessions.push(entry);
    if (completed && mode === "focus" && state.activeTaskId) {
      const t = state.tasks.find((x) => x.id === state.activeTaskId);
      if (t) t.pomodoros += 1;
    }
    return entry;
  }

  function setZen(on) {
    state.zen = !!on;
    document.body.classList.toggle("zen", state.zen);
  }

  let zenTimer = null;
  function scheduleZen() {
    clearTimeout(zenTimer);
    if (state.running && state.mode === "focus") {
      zenTimer = setTimeout(() => { if (state.running && state.mode === "focus") setZen(true); }, 1400);
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
    if (fire) burstConfetti();
  }

  function completePhase() {
    const prevStreak = streak();
    const prevToday = countRange(startOfDay(), startOfDay() + 86400000);
    const wasFocus = state.mode === "focus";
    const entry = logSession(state.mode, durationFor(state.mode), true);
    playSound();
    vibrate();
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

  function tick() {
    if (!state.running || !state.endsAt) return;
    const rem = Math.ceil((state.endsAt - Date.now()) / 1000);
    if (rem <= 0) completePhase();
    else {
      if (state.lastTickSecond !== rem) {
        state.lastTickSecond = rem;
        playTick();
      }
      state.secondsLeft = rem;
      renderTimer();
    }
  }
  function startTimer() {
    state.running = true;
    state.endsAt = Date.now() + state.secondsLeft * 1000;
    clearInterval(state.timerId);
    state.timerId = setInterval(tick, 200);
    renderTimer();
    scheduleZen();
  }
  function stopTimer() {
    if (state.running && state.endsAt) state.secondsLeft = Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
    state.running = false; state.endsAt = null;
    clearInterval(state.timerId);
    clearTimeout(zenTimer);
    setZen(false);
    renderTimer(); save();
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
      state.mode = mode;
      state.secondsLeft = durationFor(mode);
      renderTimer(); save();
    };
    if (meaningfullyElapsed()) {
      askConfirm({
        title: "Switch phase?",
        text: "This focus block is in progress. Switching will discard the current timer.",
        ok: "Switch",
      }).then((ok) => { if (ok) go(); });
    } else go();
  }

  $("playBtn").onclick = () => state.running ? stopTimer() : startTimer();
  $("resetBtn").onclick = () => { stopTimer(); state.secondsLeft = durationFor(state.mode); renderTimer(); save(); };
  $("skipBtn").onclick = () => {
    const elapsed = elapsedNow();
    logSession(state.mode, elapsed, false);
    advance(false);
  };
  document.querySelectorAll(".mode-switch button").forEach((b) => {
    b.onclick = () => switchMode(b.dataset.mode);
  });
  $("ringStage").onclick = () => {
    if (state.running) setZen(!state.zen);
  };
  $("ringStage").onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (state.running) setZen(!state.zen); }
  };

  $("taskForm").onsubmit = (e) => {
    e.preventDefault();
    const title = $("taskInput").value.trim();
    if (!title) return;
    const t = { id: uid(), title, done: false, pomodoros: 0, target: 0, due: "today", archived: false };
    state.tasks.unshift(t);
    if (!state.activeTaskId) state.activeTaskId = t.id;
    $("taskInput").value = "";
    save(); renderTasks();
  };
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
  document.querySelectorAll(".swatch").forEach((s) => {
    s.onclick = () => { setTheme(s.dataset.t); themePopover.classList.remove("open"); save(); };
  });
  document.addEventListener("click", (e) => {
    if (!themePopover.contains(e.target) && e.target !== themeBtn) themePopover.classList.remove("open");
  });

  const drawer = $("drawer"), backdrop = $("backdrop");
  function openDrawer() { drawer.classList.add("open"); backdrop.classList.add("open"); }
  function shutDrawer() { drawer.classList.remove("open"); backdrop.classList.remove("open"); }
  $("settingsBtn").onclick = openDrawer;
  $("closeDrawer").onclick = shutDrawer;
  backdrop.onclick = shutDrawer;

  function bindRange(id, key, suffix, valId) {
    const el = $(id);
    el.value = settings[key];
    $(valId).textContent = settings[key] + " " + suffix;
    el.oninput = () => {
      settings[key] = +el.value;
      $(valId).textContent = settings[key] + " " + suffix;
      if (!state.running) state.secondsLeft = durationFor(state.mode);
      renderTimer(); save();
      if (state.page === "reports") renderReports();
    };
  }
  bindRange("rFocus", "focus", "min", "vFocus");
  bindRange("rShort", "short", "min", "vShort");
  bindRange("rLong", "long", "min", "vLong");
  bindRange("rInterval", "interval", "sessions", "vInterval");
  bindRange("rGoal", "dailyGoal", "sessions", "vGoal");
  bindRange("rWeekGoal", "weeklyGoal", "sessions", "vWeekGoal");
  bindRange("rMonthGoal", "monthlyGoal", "sessions", "vMonthGoal");

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
      save();
    };
  }
  bindSwitch("switchAuto", "autoStart");
  bindSwitch("switchSound", "sound");
  bindSwitch("switchTick", "tickSound");
  bindSwitch("switchNotify", "notify");
  bindSwitch("switchVibrate", "vibrate");

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

  function exportPayload() {
    return {
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      settings, theme: state.theme, tasks: state.tasks, sessions: state.sessions, focusCount: state.focusCount,
    };
  }
  function markExported() {
    state.lastExportAt = Date.now();
    save();
    if (state.page === "reports") renderReports();
  }
  $("exportBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(exportPayload(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cadence-data.json";
    a.click();
    markExported();
    toast("Exported JSON");
  };
  $("copyBtn").onclick = async () => {
    const text = JSON.stringify(exportPayload(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      markExported();
      toast("Copied to clipboard");
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); markExported(); toast("Copied to clipboard"); }
      catch (err) { toast("Could not copy"); }
      ta.remove();
    }
  };
  $("nudgeExport").onclick = () => $("exportBtn").click();
  $("importBtn").onclick = () => $("importFile").click();
  $("importFile").onchange = async (e) => {
    const file = e.target.files[0]; e.target.value = "";
    if (!file) return;
    const backup = snapshot();
    try {
      const d = JSON.parse(await file.text());
      if (!Array.isArray(d.sessions) || !Array.isArray(d.tasks)) throw new Error("bad");
      const sessions = d.sessions.filter(isValidSession);
      const tasks = d.tasks.filter(isValidTask).map(normalizeTask);
      if (!sessions.length && d.sessions.length) throw new Error("shape");
      Object.assign(settings, d.settings || {});
      state.tasks = tasks;
      state.sessions = sessions;
      state.theme = d.theme || state.theme;
      state.focusCount = d.focusCount || 0;
      state.demo = false;
      renderAll();
      save();
      toast("Imported " + sessions.length + " sessions");
    } catch (err) {
      Object.assign(settings, backup.settings);
      state.tasks = backup.tasks;
      state.sessions = backup.sessions;
      state.theme = backup.theme;
      state.focusCount = backup.focusCount;
      state.demo = backup.demo;
      try { renderAll(); } catch (e2) { /* ignore */ }
      toast("Could not import that file — existing data kept");
    }
  };
  $("demoBtn").onclick = () => { seed(); renderAll(); save(); toast("Sample history loaded"); };
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

  $("helpBtn").onclick = () => $("helpModal").classList.add("open");
  $("helpModal").onclick = (e) => { if (e.target.id === "helpModal") $("helpModal").classList.remove("open"); };
  $("closeHelp").onclick = () => $("helpModal").classList.remove("open");

  document.querySelectorAll("[data-filter]").forEach((b) => {
    b.onclick = () => {
      state.logFilter = b.dataset.filter;
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
    const open = document.querySelector(".modal.open");
    if (open && open.id !== "noteModal") { open.classList.remove("open"); return true; }
    return false;
  }

  window.addEventListener("keydown", (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    if (e.key === "Escape") { closeTopModal(); return; }
    if (typing) return;
    if (e.code === "Space") { e.preventDefault(); $("playBtn").click(); }
    if (e.key === "?") { e.preventDefault(); $("helpModal").classList.toggle("open"); }
    if (e.key === ",") { e.preventDefault(); openDrawer(); }
    const k = e.key.toLowerCase();
    if (k === "r") $("resetBtn").click();
    if (k === "n" || k === "s") $("skipBtn").click();
    if (k === "t") { e.preventDefault(); showPage("timer"); $("taskInput").focus(); }
    if (k === "1") switchMode("focus");
    if (k === "2") switchMode("short");
    if (k === "3") switchMode("long");
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") tick(); });

  function renderAll() {
    setTheme(state.theme);
    $("rFocus").value = settings.focus; $("vFocus").textContent = settings.focus + " min";
    $("rShort").value = settings.short; $("vShort").textContent = settings.short + " min";
    $("rLong").value = settings.long; $("vLong").textContent = settings.long + " min";
    $("rInterval").value = settings.interval; $("vInterval").textContent = settings.interval + " sessions";
    $("rGoal").value = settings.dailyGoal; $("vGoal").textContent = settings.dailyGoal + " sessions";
    $("rWeekGoal").value = settings.weeklyGoal; $("vWeekGoal").textContent = settings.weeklyGoal + " sessions";
    $("rMonthGoal").value = settings.monthlyGoal; $("vMonthGoal").textContent = settings.monthlyGoal + " sessions";
    $("switchAuto").classList.toggle("on", settings.autoStart);
    $("switchSound").classList.toggle("on", settings.sound);
    $("switchTick").classList.toggle("on", settings.tickSound);
    $("switchNotify").classList.toggle("on", settings.notify);
    $("switchVibrate").classList.toggle("on", settings.vibrate);
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

  function openNoteModal() {
    $("noteInput").value = "";
    $("noteModal").classList.add("open");
    setTimeout(() => $("noteInput").focus(), 50);
  }
  function closeNote(saveNote) {
    if (saveNote && state.pendingNoteId) {
      const s = state.sessions.find((x) => x.id === state.pendingNoteId);
      const text = $("noteInput").value.trim();
      if (s && text) s.note = text;
      save();
    }
    state.pendingNoteId = null;
    $("noteModal").classList.remove("open");
    if (state.pendingAutoStart) {
      state.pendingAutoStart = false;
      startTimer();
    }
  }
  $("noteSkip").onclick = () => closeNote(false);
  $("noteSave").onclick = () => closeNote(true);

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
    {
      title: "A calmer way to focus",
      text: "Cadence runs 25-minute focus sessions with short and long breaks in between. Tap the center button to start — the ring fills in as time passes.",
    },
    {
      title: "Make it yours",
      text: "Switch Focus, Short Break, or Long Break anytime with the pill at the top, or tap the palette icon for five color themes, including a true-black OLED option.",
    },
    {
      title: "Track what you're working on",
      text: "Add tasks below the timer, mark one active, set a today/later split, and give each a pomodoro target. Completed focus sessions log against the active task.",
    },
    {
      title: "See your rhythm",
      text: "Reports and Log show your streak, weekly trends, and full session history. Press ? anytime for keyboard shortcuts — T jumps to the task field.",
    },
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
  $("tourReplay").onclick = () => { shutDrawer(); startTour(true); };

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
  $("changeOk").onclick = dismissChangelog;
  $("changeLater").onclick = () => $("changelogModal").classList.remove("open");
  $("whatsNewBtn").onclick = () => { shutDrawer(); openChangelog(true); };

  $("pngBtn").onclick = () => exportReportPng();

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
    navigator.serviceWorker.register(swUrl).catch(() => { /* ignore */ });
  }

  const hadData = load();
  const hash = (location.hash || "").replace("#", "");
  try { renderAll(); } catch (e) { console.error(e); toast("Something went wrong rendering. Try Settings → Clear, or import a backup."); }
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
