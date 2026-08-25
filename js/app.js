(function () {
  const R = 120, C = 2 * Math.PI * R;
  const KEY = "cadence-v1-static";
  const MODE_LABEL = { focus: "Focus", short: "Short Break", long: "Long Break" };

  const settings = { focus: 25, short: 5, long: 15, interval: 4, dailyGoal: 8, autoStart: false, sound: true, notify: false, tickSound: false };
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
    const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime();
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify({
      settings, theme: state.theme, mode: state.mode, secondsLeft: state.secondsLeft,
      focusCount: state.focusCount, tasks: state.tasks, activeTaskId: state.activeTaskId,
      sessions: state.sessions, demo: state.demo,
    }));
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return false;
      const d = JSON.parse(raw);
      Object.assign(settings, d.settings || {});
      state.theme = d.theme || "graphite";
      state.mode = d.mode || "focus";
      state.secondsLeft = d.secondsLeft || durationFor(state.mode);
      state.focusCount = d.focusCount || 0;
      state.tasks = d.tasks || [];
      state.activeTaskId = d.activeTaskId || null;
      state.sessions = d.sessions || [];
      state.demo = !!d.demo;
      return true;
    } catch { return false; }
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
      { id: "t1", title: "Deep work block", done: false, pomodoros: 0 },
      { id: "t2", title: "Write and review", done: false, pomodoros: 0 },
      { id: "t3", title: "Study session", done: true, pomodoros: 0 },
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
        sessions.push({ id: "s" + d + i, mode: "focus", startedAt: started.getTime(), endedAt: started.getTime() + dur * 1000, durationSec: dur, taskId, completed: rand() > 0.08 });
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

  function beep() {
    if (!settings.sound) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.16, 0.32].forEach((t, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = i === 2 ? 880 : 660;
        g.gain.setValueAtTime(0, ctx.currentTime + t);
        g.gain.linearRampToValueAtTime(0.16, ctx.currentTime + t + 0.02);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + t + 0.14);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.16);
      });
    } catch (e) { /* ignore */ }
  }
  function notify(title, body) {
    if (!settings.notify || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try { new Notification(title, { body, silent: true }); } catch (e) { /* ignore */ }
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
  function renderTasks() {
    const list = $("taskList");
    list.innerHTML = "";
    const items = [...state.tasks.filter((t) => !t.done), ...state.tasks.filter((t) => t.done)].slice(0, 6);
    if (!items.length) {
      list.innerHTML = '<p class="today-line" style="padding:16px;text-align:center;border:1px solid var(--border);border-radius:14px;background:var(--surface)">Name what you are working on.</p>';
      return;
    }
    items.forEach((t) => {
      const row = document.createElement("div");
      row.className = "task" + (t.id === state.activeTaskId ? " active" : "") + (t.done ? " done" : "");
      row.innerHTML = `<button class="chk" aria-label="toggle"></button><button class="title">${escapeHtml(t.title)}${t.pomodoros ? `<div class="today-line">${t.pomodoros} focus</div>` : ""}</button><button class="del" aria-label="remove">×</button>`;
      row.querySelector(".chk").onclick = () => { t.done = !t.done; save(); renderTasks(); };
      row.querySelector(".title").onclick = () => { state.activeTaskId = state.activeTaskId === t.id ? null : t.id; save(); renderTasks(); };
      row.querySelector(".del").onclick = () => { state.tasks = state.tasks.filter((x) => x.id !== t.id); if (state.activeTaskId === t.id) state.activeTaskId = null; save(); renderTasks(); };
      list.appendChild(row);
    });
  }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function renderTimer() {
    const total = durationFor(state.mode);
    const mm = pad(Math.floor(state.secondsLeft / 60));
    const ss = pad(state.secondsLeft % 60);
    $("timeDisplay").textContent = mm + ":" + ss;
    $("stateLabel").textContent = state.running ? "In progress" : "Ready";
    const today = countRange(startOfDay(), startOfDay() + 86400000);
    $("todayLine").textContent = today + " session" + (today === 1 ? "" : "s") + " today · goal " + settings.dailyGoal;
    document.body.setAttribute("data-mode", state.mode);
    document.documentElement.setAttribute("data-theme", state.theme);
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

  function renderReports() {
    const now = Date.now();
    const todayFrom = startOfDay(now);
    const d = new Date(todayFrom);
    const mondayOff = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const weekFrom = todayFrom - mondayOff * 86400000;
    const monthFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const todaySec = sumRange(todayFrom, todayFrom + 86400000);
    const weekSec = sumRange(weekFrom, weekFrom + 7 * 86400000);
    const lastWeek = sumRange(weekFrom - 7 * 86400000, weekFrom);
    const monthSec = sumRange(monthFrom, now + 86400000);
    const todayCount = countRange(todayFrom, todayFrom + 86400000);
    const weekCount = countRange(weekFrom, weekFrom + 7 * 86400000);
    const delta = lastWeek === 0 ? null : Math.round(((weekSec - lastWeek) / lastWeek) * 100);
    $("statToday").textContent = fmtMs(todaySec);
    $("statTodayH").textContent = todayCount + " / " + settings.dailyGoal + " goal";
    $("statWeek").textContent = fmtMs(weekSec);
    $("statWeekH").textContent = weekCount + " sessions";
    $("statStreak").textContent = streak() + "d";
    $("statMonth").textContent = fmtMs(monthSec);
    $("reportLead").textContent = weekSec === 0
      ? "Complete a focus session and this page fills in."
      : "You focused " + fmtMs(weekSec) + " this week" + (delta == null ? "." : ", " + Math.abs(delta) + "% " + (delta >= 0 ? "above" : "below") + " last week.");
    $("demoBanner").style.display = state.demo ? "block" : "none";

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
    days.forEach((day) => {
      const col = document.createElement("div");
      col.className = "bar-col";
      const h = Math.max(4, Math.round((day.m / max) * 130));
      col.innerHTML = `<div class="bar" style="height:${h}px" title="${day.m} min"></div><span>${day.label}</span>`;
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
      const label = (h.hour % 12 || 12) + (h.hour >= 12 ? "p" : "a");
      col.innerHTML = `<div class="bar rest" style="height:${ht}px"></div><span>${label}</span>`;
      hourBars.appendChild(col);
    });
  }

  function renderLog() {
    const wrap = $("logList");
    wrap.innerHTML = "";
    const rows = state.sessions
      .filter((s) => state.logFilter === "all" || s.mode === state.logFilter)
      .sort((a, b) => b.endedAt - a.endedAt)
      .slice(0, 80);
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
      sec.innerHTML = `<h3>${day}<span class="today-line">${fmtMs(focus)} focus</span></h3><div class="log-list"></div>`;
      const box = sec.querySelector(".log-list");
      list.forEach((s) => {
        const task = state.tasks.find((t) => t.id === s.taskId);
        const row = document.createElement("div");
        row.className = "log-row";
        const t0 = new Date(s.startedAt), t1 = new Date(s.endedAt);
        row.innerHTML = `<span class="dot ${s.mode === "focus" ? "focus" : "break"}"></span><div style="flex:1"><div>${MODE_LABEL[s.mode]}${task ? " · " + escapeHtml(task.title) : ""}</div><div class="today-line">${pad(t0.getHours())}:${pad(t0.getMinutes())} – ${pad(t1.getHours())}:${pad(t1.getMinutes())}</div></div><div style="text-align:right"><div>${Math.round(s.durationSec / 60)}m</div><div class="today-line">${s.completed ? "Done" : "Skipped"}</div></div>`;
        box.appendChild(row);
      });
      wrap.appendChild(sec);
    });
  }

  function showPage(name) {
    state.page = name;
    document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.dataset.page === name));
    document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === name));
    if (name === "reports") renderReports();
    if (name === "log") renderLog();
    location.hash = name === "timer" ? "" : name;
  }

  function logSession(mode, elapsed, completed) {
    if (elapsed < 15 && !completed) return;
    const now = Date.now();
    state.sessions.push({
      id: uid(), mode, startedAt: now - elapsed * 1000, endedAt: now,
      durationSec: elapsed, taskId: mode === "focus" ? state.activeTaskId : undefined, completed,
    });
    if (completed && mode === "focus" && state.activeTaskId) {
      const t = state.tasks.find((x) => x.id === state.activeTaskId);
      if (t) t.pomodoros += 1;
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
    if (fromComplete && settings.autoStart) startTimer();
    else renderTimer();
    save();
  }
  function completePhase() {
    logSession(state.mode, durationFor(state.mode), true);
    beep();
    notify(MODE_LABEL[state.mode] + " complete", "Next phase is ready");
    advance(true);
  }
  function tick() {
    if (!state.running || !state.endsAt) return;
    const rem = Math.ceil((state.endsAt - Date.now()) / 1000);
    if (rem <= 0) completePhase();
    else { state.secondsLeft = rem; renderTimer(); }
  }
  function startTimer() {
    state.running = true;
    state.endsAt = Date.now() + state.secondsLeft * 1000;
    clearInterval(state.timerId);
    state.timerId = setInterval(tick, 200);
    renderTimer();
  }
  function stopTimer() {
    if (state.running && state.endsAt) state.secondsLeft = Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
    state.running = false; state.endsAt = null;
    clearInterval(state.timerId);
    renderTimer(); save();
  }

  $("playBtn").onclick = () => state.running ? stopTimer() : startTimer();
  $("resetBtn").onclick = () => { stopTimer(); state.secondsLeft = durationFor(state.mode); renderTimer(); save(); };
  $("skipBtn").onclick = () => {
    const elapsed = durationFor(state.mode) - state.secondsLeft;
    logSession(state.mode, elapsed, false);
    advance(false);
  };
  document.querySelectorAll(".mode-switch button").forEach((b) => {
    b.onclick = () => { stopTimer(); state.mode = b.dataset.mode; state.secondsLeft = durationFor(state.mode); renderTimer(); save(); };
  });
  $("taskForm").onsubmit = (e) => {
    e.preventDefault();
    const title = $("taskInput").value.trim();
    if (!title) return;
    const t = { id: uid(), title, done: false, pomodoros: 0 };
    state.tasks.unshift(t);
    if (!state.activeTaskId) state.activeTaskId = t.id;
    $("taskInput").value = "";
    save(); renderTasks();
  };

  document.querySelectorAll("[data-nav]").forEach((a) => {
    a.onclick = (e) => { e.preventDefault(); showPage(a.dataset.nav); };
  });
  $("wordmark").onclick = () => showPage("timer");

  const themeBtn = $("themeBtn"), themePopover = $("themePopover");
  function setActiveSwatch(theme) {
    document.querySelectorAll(".swatch").forEach((s) => s.classList.toggle("active", s.dataset.t === theme));
  }
  themeBtn.onclick = (e) => { e.stopPropagation(); themePopover.classList.toggle("open"); };
  document.querySelectorAll(".swatch").forEach((s) => {
    s.onclick = () => {
      state.theme = s.dataset.t;
      document.documentElement.setAttribute("data-theme", state.theme);
      setActiveSwatch(state.theme); themePopover.classList.remove("open"); save();
    };
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
    };
  }
  bindRange("rFocus", "focus", "min", "vFocus");
  bindRange("rShort", "short", "min", "vShort");
  bindRange("rLong", "long", "min", "vLong");
  bindRange("rInterval", "interval", "sessions", "vInterval");
  bindRange("rGoal", "dailyGoal", "sessions", "vGoal");

  function bindSwitch(id, key, extra) {
    const el = $(id);
    el.classList.toggle("on", settings[key]);
    el.onclick = async () => {
      if (key === "notify" && !settings.notify) {
        if (typeof Notification !== "undefined") {
          const p = await Notification.requestPermission();
          if (p !== "granted") return;
        }
      }
      settings[key] = !settings[key];
      el.classList.toggle("on", settings[key]);
      if (extra) extra();
      save();
    };
  }
  bindSwitch("switchAuto", "autoStart");
  bindSwitch("switchSound", "sound");
  bindSwitch("switchTick", "tickSound");
  bindSwitch("switchNotify", "notify");

  $("exportBtn").onclick = () => {
    const blob = new Blob([JSON.stringify({ settings, theme: state.theme, tasks: state.tasks, sessions: state.sessions, focusCount: state.focusCount }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cadence-data.json";
    a.click();
  };
  $("importBtn").onclick = () => $("importFile").click();
  $("importFile").onchange = async (e) => {
    const file = e.target.files[0]; e.target.value = "";
    if (!file) return;
    try {
      const d = JSON.parse(await file.text());
      if (!Array.isArray(d.sessions) || !Array.isArray(d.tasks)) throw new Error("bad");
      Object.assign(settings, d.settings || {});
      state.tasks = d.tasks; state.sessions = d.sessions;
      state.theme = d.theme || state.theme; state.focusCount = d.focusCount || 0; state.demo = false;
      renderAll(); save();
    } catch { alert("Could not read that file"); }
  };
  $("demoBtn").onclick = () => { seed(); renderAll(); save(); };
  $("clearBtn").onclick = () => {
    state.sessions = []; state.tasks = []; state.focusCount = 0; state.demo = true; state.activeTaskId = null;
    renderAll(); save();
  };

  $("helpBtn").onclick = () => $("helpModal").classList.add("open");
  $("helpModal").onclick = (e) => { if (e.target.id === "helpModal") $("helpModal").classList.remove("open"); };
  $("closeHelp").onclick = () => $("helpModal").classList.remove("open");

  document.querySelectorAll("[data-filter]").forEach((b) => {
    b.onclick = () => {
      state.logFilter = b.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((x) => x.classList.toggle("on", x === b));
      renderLog();
    };
  });

  window.addEventListener("keydown", (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.code === "Space") { e.preventDefault(); $("playBtn").click(); }
    if (e.key === "?" ) { e.preventDefault(); $("helpModal").classList.toggle("open"); }
    if (e.key === ",") { e.preventDefault(); openDrawer(); }
    const k = e.key.toLowerCase();
    if (k === "r") $("resetBtn").click();
    if (k === "n" || k === "s") $("skipBtn").click();
    if (k === "1") { state.mode = "focus"; state.secondsLeft = durationFor("focus"); stopTimer(); }
    if (k === "2") { state.mode = "short"; state.secondsLeft = durationFor("short"); stopTimer(); }
    if (k === "3") { state.mode = "long"; state.secondsLeft = durationFor("long"); stopTimer(); }
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") tick(); });

  function renderAll() {
    setActiveSwatch(state.theme);
    document.documentElement.setAttribute("data-theme", state.theme);
    $("rFocus").value = settings.focus; $("vFocus").textContent = settings.focus + " min";
    $("rShort").value = settings.short; $("vShort").textContent = settings.short + " min";
    $("rLong").value = settings.long; $("vLong").textContent = settings.long + " min";
    $("rInterval").value = settings.interval; $("vInterval").textContent = settings.interval + " sessions";
    $("rGoal").value = settings.dailyGoal; $("vGoal").textContent = settings.dailyGoal + " sessions";
    $("switchAuto").classList.toggle("on", settings.autoStart);
    $("switchSound").classList.toggle("on", settings.sound);
    $("switchTick").classList.toggle("on", settings.tickSound);
    $("switchNotify").classList.toggle("on", settings.notify);
    renderTimer(); renderTasks();
    if (state.page === "reports") renderReports();
    if (state.page === "log") renderLog();
  }

  if (!load()) seed();
  const hash = location.hash.replace("#", "");
  renderAll();
  if (hash === "reports" || hash === "log") showPage(hash);
})();
