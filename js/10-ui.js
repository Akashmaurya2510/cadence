/* Cadence module */
(function (Cadence) {
"use strict";
const themeBtn = Cadence.$("themeBtn"), themePopover = Cadence.$("themePopover");
  themeBtn.onclick = (e) => { e.stopPropagation(); themePopover.classList.toggle("open"); };
  document.querySelectorAll(".theme-card[data-t]").forEach((c) => {
    c.onclick = (e) => {
      e.stopPropagation();
      Cadence.settings.themeAuto = false;
      Cadence.setTheme(c.dataset.t);
      Cadence.save();
    };
  });
  if (Cadence.$("themeAutoBtn")) {
    Cadence.$("themeAutoBtn").onclick = (e) => {
      e.stopPropagation();
      Cadence.settings.themeAuto = true;
      Cadence.applyTheme();
      Cadence.save();
      Cadence.toast("Following system theme");
    };
  }
  document.querySelectorAll(".accent-dot").forEach((d) => {
    d.onclick = (e) => {
      e.stopPropagation();
      Cadence.settings.accent = d.dataset.accent || "default";
      Cadence.applyAccent();
      Cadence.syncThemeUI();
      Cadence.save();
    };
  });
  if (Cadence.$("themePanelClose")) {
    Cadence.$("themePanelClose").onclick = (e) => { e.stopPropagation(); themePopover.classList.remove("open"); };
  }
  document.addEventListener("click", (e) => {
    if (themePopover && !themePopover.contains(e.target) && e.target !== themeBtn && !themeBtn.contains(e.target)) {
      themePopover.classList.remove("open");
    }
  });

  const drawer = Cadence.$("drawer"), backdrop = Cadence.$("backdrop");
  Cadence.openDrawer = function() {
    drawer.classList.add("open");
    backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  Cadence.shutDrawer = function() {
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
    document.body.style.overflow = "";
  }
  Cadence.$("settingsBtn").onclick = Cadence.openDrawer;
  Cadence.$("closeDrawer").onclick = Cadence.shutDrawer;
  if (Cadence.$("closeDrawerBottom")) Cadence.$("closeDrawerBottom").onclick = Cadence.shutDrawer;
  backdrop.onclick = Cadence.shutDrawer;

  Cadence.refreshStepper = function(el) {
    const key = el.dataset.key, min = +el.dataset.min, max = +el.dataset.max, suffix = el.dataset.suffix;
    const v = Cadence.settings[key];
    if (key === "volume") Cadence.$(el.dataset.val).textContent = Cadence.VOLUME_LABEL[v] || "Normal";
    else Cadence.$(el.dataset.val).textContent = v + " " + suffix;
    el.querySelector(".step-fill").style.width = (((v - min) / (max - min)) * 100) + "%";
    el.querySelectorAll(".step-btn").forEach((b) => {
      const dir = +b.dataset.dir;
      b.disabled = dir < 0 ? v <= min : v >= max;
    });
  }
  Cadence.stepperChange = function(el, dir) {
    const key = el.dataset.key, min = +el.dataset.min, max = +el.dataset.max, step = +el.dataset.step;
    Cadence.settings[key] = Math.min(max, Math.max(min, Cadence.settings[key] + dir * step));
    Cadence.refreshStepper(el);
    if (!Cadence.state.running) Cadence.state.secondsLeft = Cadence.durationFor(Cadence.state.mode);
    Cadence.renderTimer(); Cadence.save();
    if (Cadence.state.page === "reports") Cadence.renderReports();
  }
  document.querySelectorAll(".stepper").forEach((el) => {
    Cadence.refreshStepper(el);
    el.querySelectorAll(".step-btn").forEach((btn) => {
      const dir = +btn.dataset.dir;
      let holdTimeout = null, holdInterval = null;
      const fire = () => { if (!btn.disabled) Cadence.stepperChange(el, dir); };
      const stopHold = () => { clearTimeout(holdTimeout); clearInterval(holdInterval); holdTimeout = holdInterval = null; };
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        fire();
        holdTimeout = setTimeout(() => { holdInterval = setInterval(fire, 90); }, 450);
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => btn.addEventListener(ev, stopHold));
    });
  });
  Cadence.refreshAllSteppers = function() { document.querySelectorAll(".stepper").forEach(Cadence.refreshStepper); }

  Cadence.bindSwitch = function(id, key) {
    const el = Cadence.$(id);
    el.classList.toggle("on", Cadence.settings[key]);
    el.setAttribute("aria-checked", Cadence.settings[key] ? "true" : "false");
    el.onclick = async () => {
      if (key === "Cadence.notify" && !Cadence.settings.notify) {
        if (typeof Notification !== "undefined") {
          const p = await Notification.requestPermission();
          if (p !== "granted") return;
        }
      }
      Cadence.settings[key] = !Cadence.settings[key];
      el.classList.toggle("on", Cadence.settings[key]);
      el.setAttribute("aria-checked", Cadence.settings[key] ? "true" : "false");
      Cadence.save();
    };
  }
  Cadence.bindSwitch("switchAuto", "autoStart");
  Cadence.bindSwitch("switchSound", "sound");
  Cadence.bindSwitch("switchTick", "tickSound");
  Cadence.bindSwitch("switchNotify", "Cadence.notify");
  Cadence.bindSwitch("switchVibrate", "Cadence.vibrate");
  if (Cadence.$("switchThemeAuto")) {
    const el = Cadence.$("switchThemeAuto");
    el.classList.toggle("on", Cadence.settings.themeAuto);
    el.setAttribute("aria-checked", Cadence.settings.themeAuto ? "true" : "false");
    el.onclick = () => {
      Cadence.settings.themeAuto = !Cadence.settings.themeAuto;
      el.classList.toggle("on", Cadence.settings.themeAuto);
      el.setAttribute("aria-checked", Cadence.settings.themeAuto ? "true" : "false");
      Cadence.applyTheme();
      Cadence.save();
    };
  }
  Cadence.bindSimpleSwitch = function(id, key, onChange) {
    const el = Cadence.$(id);
    if (!el) return;
    el.classList.toggle("on", !!Cadence.settings[key]);
    el.setAttribute("aria-checked", Cadence.settings[key] ? "true" : "false");
    el.onclick = () => {
      Cadence.settings[key] = !Cadence.settings[key];
      el.classList.toggle("on", Cadence.settings[key]);
      el.setAttribute("aria-checked", Cadence.settings[key] ? "true" : "false");
      if (onChange) onChange();
      Cadence.save();
    };
  }
  Cadence.bindSimpleSwitch("switchCompact", "compact", () => {
    document.body.classList.toggle("compact", !!Cadence.settings.compact);
  });
  Cadence.bindSimpleSwitch("switchConfirmSkip", "confirmSkip");

  Cadence.renderSoundPicks = function() {
    document.querySelectorAll("[data-sound]").forEach((b) => {
      b.classList.toggle("on", b.dataset.sound === Cadence.settings.soundChoice);
    });
  }
  document.querySelectorAll("[data-sound]").forEach((b) => {
    b.onclick = () => {
      Cadence.settings.soundChoice = b.dataset.sound;
      Cadence.renderSoundPicks();
      Cadence.save();
      const prev = Cadence.settings.sound;
      Cadence.settings.sound = true;
      Cadence.playSound(b.dataset.sound);
      Cadence.settings.sound = prev;
    };
  });

  Cadence.exportPayload = function() {
    return {
      version: Cadence.APP_VERSION,
      exportedAt: new Date().toISOString(),
      Cadence.settings, theme: Cadence.state.theme, tasks: Cadence.state.tasks, sessions: Cadence.state.sessions, focusCount: Cadence.state.focusCount,
    };
  }
  Cadence.markExported = function() {
    Cadence.state.lastExportAt = Date.now();
    Cadence.save();
    if (Cadence.state.page === "reports") Cadence.renderReports();
  }
  Cadence.$("exportBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(Cadence.exportPayload(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cadence-data.json";
    a.click();
    Cadence.markExported();
    Cadence.toast("Exported JSON");
  };
  Cadence.exportCsv = function() {
    const rows = [["id", "mode", "startedAt", "endedAt", "durationSec", "completed", "task", "note"]];
    Cadence.state.sessions.slice().sort((a, b) => a.endedAt - b.endedAt).forEach((s) => {
      const task = Cadence.state.tasks.find((t) => t.id === s.taskId);
      const esc = (v) => {
        const str = v == null ? "" : String(v);
        return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
      };
      rows.push([
        s.id, s.mode,
        new Date(s.startedAt).toISOString(),
        new Date(s.endedAt).toISOString(),
        s.durationSec, s.completed ? "1" : "0",
        task ? task.title : "",
        s.note || "",
      ].map(esc));
    });
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cadence-sessions.csv";
    a.click();
    Cadence.markExported();
    Cadence.toast("Exported CSV");
  }
  if (Cadence.$("exportCsvBtn")) Cadence.$("exportCsvBtn").onclick = Cadence.exportCsv;
  Cadence.$("copyBtn").onclick = async () => {
    const text = JSON.stringify(Cadence.exportPayload(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      Cadence.markExported();
      Cadence.toast("Copied to clipboard");
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); Cadence.markExported(); Cadence.toast("Copied to clipboard"); }
      catch (err) { Cadence.toast("Could not copy"); }
      ta.remove();
    }
  };
  Cadence.$("nudgeExport").onclick = () => Cadence.$("exportBtn").click();
  Cadence.$("importBtn").onclick = () => Cadence.$("importFile").click();
  Cadence.$("importFile").onchange = async (e) => {
    const file = e.target.files[0]; e.target.value = "";
    if (!file) return;
    const backup = Cadence.snapshot();
    try {
      const d = JSON.parse(await file.text());
      if (!Array.isArray(d.sessions) || !Array.isArray(d.tasks)) throw new Error("bad");
      const sessions = d.sessions.filter(Cadence.isValidSession);
      const tasks = d.tasks.filter(Cadence.isValidTask).map(Cadence.normalizeTask);
      if (!sessions.length && d.sessions.length) throw new Error("shape");
      Object.assign(Cadence.settings, d.settings || {});
      Cadence.state.tasks = tasks;
      Cadence.state.sessions = sessions;
      Cadence.state.theme = d.theme || Cadence.state.theme;
      Cadence.state.focusCount = d.focusCount || 0;
      Cadence.state.demo = false;
      Cadence.renderAll();
      Cadence.save();
      Cadence.toast("Imported " + sessions.length + " sessions");
    } catch (err) {
      Object.assign(Cadence.settings, backup.settings);
      Cadence.state.tasks = backup.tasks;
      Cadence.state.sessions = backup.sessions;
      Cadence.state.theme = backup.theme;
      Cadence.state.focusCount = backup.focusCount;
      Cadence.state.demo = backup.demo;
      try { Cadence.renderAll(); } catch (e2) { /* ignore */ }
      Cadence.toast("Could not import that file — existing data kept");
    }
  };
  Cadence.$("demoBtn").onclick = () => { Cadence.seed(); Cadence.renderAll(); Cadence.save(); Cadence.toast("Sample history loaded"); };
  Cadence.$("clearBtn").onclick = async () => {
    const ok = await Cadence.askConfirm({
      title: "Clear all data?",
      text: "This permanently deletes every session and task on this device. There is no undo.",
      ok: "Clear everything",
      danger: true,
    });
    if (!ok) return;
    Cadence.state.sessions = []; Cadence.state.tasks = []; Cadence.state.focusCount = 0; Cadence.state.demo = false; Cadence.state.activeTaskId = null;
    Cadence.renderAll(); Cadence.save();
    Cadence.toast("All data cleared");
  };

  Cadence.openHelp = function() { Cadence.$("helpModal").classList.add("open"); }
  if (Cadence.$("shortcutsBtn")) Cadence.$("shortcutsBtn").onclick = () => { Cadence.shutDrawer(); Cadence.openHelp(); };
  Cadence.$("helpModal").onclick = (e) => { if (e.target.id === "helpModal") Cadence.$("helpModal").classList.remove("open"); };
  Cadence.$("closeHelp").onclick = () => Cadence.$("helpModal").classList.remove("open");

  document.querySelectorAll("[data-filter]").forEach((b) => {
    b.onclick = () => {
      Cadence.state.logFilter = b.dataset.filter;
      Cadence.state.logDayFilter = null;
      Cadence.state.logLimit = Cadence.LOG_PAGE;
      document.querySelectorAll("[data-filter]").forEach((x) => x.classList.toggle("on", x === b));
      Cadence.renderLog();
    };
  });
  Cadence.$("logSearch").oninput = () => {
    Cadence.state.logSearch = Cadence.$("logSearch").value;
    Cadence.state.logLimit = Cadence.LOG_PAGE;
    Cadence.renderLog();
  };
  Cadence.$("logTaskFilter").onchange = () => {
    Cadence.state.logTaskFilter = Cadence.$("logTaskFilter").value;
    Cadence.state.logLimit = Cadence.LOG_PAGE;
    Cadence.renderLog();
  };
  Cadence.$("logMore").onclick = () => { Cadence.state.logLimit += Cadence.LOG_PAGE; Cadence.renderLog(); };

  Cadence.closeTopModal = function() {
    if (drawer.classList.contains("open")) { Cadence.shutDrawer(); return true; }
    const open = document.querySelector(".modal.open");
    if (open && open.id !== "noteModal") { open.classList.remove("open"); return true; }
    return false;
  }

  window.addEventListener("keydown", (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    if (e.key === "Escape") { Cadence.closeTopModal(); return; }
    if (typing) return;
    if (e.code === "Space") { e.preventDefault(); Cadence.$("playBtn").click(); }
    if (e.key === "?") { e.preventDefault(); Cadence.$("helpModal").classList.toggle("open"); }
    /* shortcuts also in Settings */
    if (e.key === ",") { e.preventDefault(); Cadence.openDrawer(); }
    const k = e.key.toLowerCase();
    if (k === "r") Cadence.$("resetBtn").click();
    if (k === "n" || k === "s") Cadence.$("skipBtn").click();
    if (k === "t") { e.preventDefault(); Cadence.showPage("timer"); Cadence.$("taskInput").focus(); }
    if (k === "1") Cadence.switchMode("focus");
    if (k === "2") Cadence.switchMode("short");
    if (k === "3") Cadence.switchMode("long");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      Cadence.tick();
      if (Cadence.state.running) Cadence.renderTimer();
    }
  });
  window.addEventListener("pageshow", () => { if (Cadence.state.running) Cadence.tick(); });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (Cadence.settings.themeAuto) { Cadence.applyTheme(); Cadence.save(); }
  });

  Cadence.renderAll = function() {
    Cadence.applyTheme();
    Cadence.refreshAllSteppers();
    Cadence.$("switchAuto").classList.toggle("on", Cadence.settings.autoStart);
    Cadence.$("switchSound").classList.toggle("on", Cadence.settings.sound);
    Cadence.$("switchTick").classList.toggle("on", Cadence.settings.tickSound);
    Cadence.$("switchNotify").classList.toggle("on", Cadence.settings.notify);
    Cadence.$("switchVibrate").classList.toggle("on", Cadence.settings.vibrate);
    if (Cadence.$("switchThemeAuto")) {
      Cadence.$("switchThemeAuto").classList.toggle("on", Cadence.settings.themeAuto);
      Cadence.$("switchThemeAuto").setAttribute("aria-checked", Cadence.settings.themeAuto ? "true" : "false");
    }
    if (Cadence.$("switchCompact")) {
      Cadence.$("switchCompact").classList.toggle("on", !!Cadence.settings.compact);
      Cadence.$("switchCompact").setAttribute("aria-checked", Cadence.settings.compact ? "true" : "false");
    }
    if (Cadence.$("switchConfirmSkip")) {
      Cadence.$("switchConfirmSkip").classList.toggle("on", !!Cadence.settings.confirmSkip);
      Cadence.$("switchConfirmSkip").setAttribute("aria-checked", Cadence.settings.confirmSkip ? "true" : "false");
    }
    document.body.classList.toggle("compact", !!Cadence.settings.compact);
    Cadence.renderSoundPicks();
    Cadence.renderTimer(); Cadence.renderTasks();
    if (Cadence.state.page === "reports") Cadence.renderReports();
    if (Cadence.state.page === "log") { Cadence.renderLogFilters(); Cadence.renderLog(); }
  }

  let confirmResolver = null;
  Cadence.askConfirm = function({ title, text, ok, danger }) {
    Cadence.$("confirmTitle").textContent = title || "Are you sure?";
    Cadence.$("confirmText").textContent = text || "";
    Cadence.$("confirmOk").textContent = ok || "Confirm";
    Cadence.$("confirmOk").classList.toggle("danger", !!danger);
    Cadence.$("confirmModal").classList.add("open");
    return new Promise((resolve) => { confirmResolver = resolve; });
  }
  Cadence.settleConfirm = function(val) {
    Cadence.$("confirmModal").classList.remove("open");
    if (confirmResolver) confirmResolver(val);
    confirmResolver = null;
  }
  Cadence.$("confirmOk").onclick = () => Cadence.settleConfirm(true);
  Cadence.$("confirmCancel").onclick = () => Cadence.settleConfirm(false);
  Cadence.$("confirmModal").onclick = (e) => { if (e.target.id === "confirmModal") Cadence.settleConfirm(false); };

  Cadence.openNoteModal = function() {
    Cadence.$("noteInput").value = "";
    Cadence.$("noteModal").classList.add("open");
    setTimeout(() => Cadence.$("noteInput").focus(), 50);
  }
  Cadence.closeNote = function(saveNote) {
    if (saveNote && Cadence.state.pendingNoteId) {
      const s = Cadence.state.sessions.find((x) => x.id === Cadence.state.pendingNoteId);
      const text = Cadence.$("noteInput").value.trim();
      if (s && text) s.note = text;
      Cadence.save();
    }
    Cadence.state.pendingNoteId = null;
    Cadence.$("noteModal").classList.remove("open");
    const today = Cadence.dayKey(Date.now());
    const todayCount = Cadence.countRange(Cadence.startOfDay(), Cadence.startOfDay() + 86400000);
    const shouldReview = todayCount >= Cadence.settings.dailyGoal && Cadence.state.lastReviewDay !== today;
    if (shouldReview && Cadence.$("reviewModal")) {
      Cadence.openReviewModal();
      return;
    }
    if (Cadence.state.pendingAutoStart) {
      Cadence.state.pendingAutoStart = false;
      Cadence.startTimer();
    }
  }
  Cadence.$("noteSkip").onclick = () => Cadence.closeNote(false);
  Cadence.$("noteSave").onclick = () => Cadence.closeNote(true);

  Cadence.openReviewModal = function() {
    Cadence.$("reviewInput").value = "";
    Cadence.$("reviewModal").classList.add("open");
    setTimeout(() => Cadence.$("reviewInput").focus(), 50);
  }
  Cadence.closeReview = function(saveIt) {
    if (saveIt) {
      const text = Cadence.$("reviewInput").value.trim();
      if (text) {
        Cadence.state.sessions.push({
          id: Cadence.uid(), mode: "focus", startedAt: Date.now(), endedAt: Date.now(),
          durationSec: 0, completed: true, note: "Review: " + text, taskId: undefined,
        });
      }
      Cadence.state.lastReviewDay = Cadence.dayKey(Date.now());
      Cadence.save();
    } else {
      Cadence.state.lastReviewDay = Cadence.dayKey(Date.now());
      Cadence.save();
    }
    Cadence.$("reviewModal").classList.remove("open");
    if (Cadence.state.pendingAutoStart) {
      Cadence.state.pendingAutoStart = false;
      Cadence.startTimer();
    }
  }
  if (Cadence.$("reviewSkip")) Cadence.$("reviewSkip").onclick = () => Cadence.closeReview(false);
  if (Cadence.$("reviewSave")) Cadence.$("reviewSave").onclick = () => Cadence.closeReview(true);

  let toastTimer = null;
  let toastUndo = null;
  Cadence.toast = function(msg, action, onAction) {
    Cadence.$("toastMsg").textContent = msg;
    const btn = Cadence.$("toastAction");
    toastUndo = onAction || null;
    btn.hidden = !onAction;
    btn.textContent = action || "Undo";
    Cadence.$("Cadence.toast").hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { Cadence.$("Cadence.toast").hidden = true; toastUndo = null; }, 4200);
  }
  Cadence.$("toastAction").onclick = () => {
    if (toastUndo) toastUndo();
    Cadence.$("Cadence.toast").hidden = true;
    toastUndo = null;
  };

  Cadence.burstConfetti = function() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { Cadence.toast("Goal reached"); return; }
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
      text: "Reports and Log show your Cadence.streak, weekly trends, and full session history. Press ? anytime for keyboard shortcuts — T jumps to the task field.",
    },
  ];
  let tourIndex = 0;
  let tourReplay = false;
  Cadence.renderTourStep = function() {
    const s = tourSteps[tourIndex];
    Cadence.$("tourKicker").textContent = "Step " + (tourIndex + 1) + " of " + tourSteps.length;
    Cadence.$("tourTitle").textContent = s.title;
    Cadence.$("tourText").textContent = s.text;
    Cadence.$("tourNext").textContent = tourIndex === tourSteps.length - 1 ? "Start" : "Next";
  }
  Cadence.finishTour = function() {
    localStorage.setItem(Cadence.TOUR_KEY, "1");
    Cadence.$("onboardModal").classList.remove("open");
    tourReplay = false;
  }
  Cadence.startTour = function(replay) {
    tourReplay = !!replay;
    tourIndex = 0;
    Cadence.renderTourStep();
    Cadence.$("onboardModal").classList.add("open");
  }
  Cadence.$("tourNext").onclick = () => {
    if (tourIndex === tourSteps.length - 1) { Cadence.finishTour(); return; }
    tourIndex++; Cadence.renderTourStep();
  };
  Cadence.$("tourSkip").onclick = Cadence.finishTour;
  Cadence.$("tourReplay").onclick = () => { Cadence.shutDrawer(); Cadence.startTour(true); };

  Cadence.unseenChangelog = function() {
    const seen = localStorage.getItem(Cadence.CHANGELOG_SEEN_KEY);
    if (!seen) return Cadence.CHANGELOG;
    const idx = CHANGELOG.findIndex((c) => c.version === seen);
    if (idx === 0) return [];
    if (idx === -1) return Cadence.CHANGELOG;
    return CHANGELOG.slice(0, idx);
  }
  Cadence.renderChangelog = function(entries) {
    const list = entries && entries.length ? entries : Cadence.CHANGELOG;
    Cadence.$("changeTitle").textContent = list[0].title;
    Cadence.$("changeBlurb").textContent = list[0].blurb + (list[0].date ? " · " + list[0].date : "");
    const box = Cadence.$("changeList");
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
        row.innerHTML = '<span class="change-tag">' + Cadence.escapeHtml(item.tag) + "</span><span>" + Cadence.escapeHtml(item.text) + "</span>";
        wrap.appendChild(row);
      });
      box.appendChild(wrap);
    });
  }
  Cadence.openChangelog = function(force) {
    const entries = force ? Cadence.CHANGELOG : Cadence.unseenChangelog();
    if (!entries.length) return;
    Cadence.renderChangelog(entries);
    Cadence.$("changelogModal").classList.add("open");
  }
  Cadence.dismissChangelog = function() {
    localStorage.setItem(Cadence.CHANGELOG_SEEN_KEY, Cadence.APP_VERSION);
    Cadence.$("changelogModal").classList.remove("open");
  }
  Cadence.$("changeOk").onclick = Cadence.dismissChangelog;
  Cadence.$("changeLater").onclick = () => Cadence.$("changelogModal").classList.remove("open");
  if (Cadence.$("changeCloseX")) Cadence.$("changeCloseX").onclick = () => Cadence.$("changelogModal").classList.remove("open");
  Cadence.$("whatsNewBtn").onclick = () => { Cadence.shutDrawer(); Cadence.openChangelog(true); };
  if (Cadence.$("footerUpdated")) {
    Cadence.$("footerUpdated").onclick = () => Cadence.openChangelog(true);
  }

  Cadence.$("pngBtn").onclick = () => Cadence.exportReportPng();

  Cadence.exportReportPng = function() {
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
    const { todayFrom, weekFrom } = Cadence.weekBounds(now);
    const weekSec = Cadence.sumRange(weekFrom, weekFrom + 7 * 86400000);
    const todayCount = Cadence.countRange(todayFrom, todayFrom + 86400000);
    const weekCount = Cadence.countRange(weekFrom, weekFrom + 7 * 86400000);
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
    g.fillText(Cadence.fmtMs(weekSec), 72, 280);
    g.fillStyle = dim;
    g.font = "400 22px Inter, sans-serif";
    g.fillText(weekCount + " focus sessions  ·  Cadence.streak " + Cadence.streak() + "d  ·  best " + Cadence.longestStreak() + "d", 72, 330);

    const names = ["S", "M", "T", "W", "T", "F", "S"];
    let max = 1;
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const ts = todayFrom - i * 86400000;
      const m = Math.round(Cadence.sumRange(ts, ts + 86400000) / 60);
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
      { l: "Today", v: todayCount + " / " + Cadence.settings.dailyGoal },
      { l: "Week goal", v: weekCount + " / " + Cadence.settings.weeklyGoal },
      { l: "Avg focus", v: Cadence.fmtMs(Cadence.avgFocusSec()) },
      { l: "Completion", v: (Cadence.completionRate() == null ? "—" : Cadence.completionRate() + "%") },
    ];
    cards.forEach((c, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 72 + col * 484, y = 800 + row * 180;
      g.fillStyle = surface;
      g.strokeStyle = border;
      g.lineWidth = 2;
      Cadence.roundRect(g, x, y, 452, 156, 24);
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
      if (!blob) { Cadence.toast("Could not create image"); return; }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "cadence-report.png";
      a.click();
      Cadence.toast("Report image saved");
    }, "image/png");
  }
  Cadence.roundRect = function(g, x, y, w, h, r) {
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
    navigator.serviceWorker.register(swUrl + "?v=" + Cadence.APP_VERSION).then((reg) => {
      // Force check for updates on each Cadence.load
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

  
})(window.Cadence);
