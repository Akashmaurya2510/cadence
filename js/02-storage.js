/* Cadence module */
(function (Cadence) {
"use strict";
Cadence.snapshot = function() {
    // Persist endsAt so a running timer survives refresh / app kill
    let endsAt = Cadence.state.endsAt;
    let secondsLeft = Cadence.state.secondsLeft;
    let running = !!Cadence.state.running;
    if (running && endsAt) {
      secondsLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    }
    return {
      schemaVersion: Cadence.SCHEMA_VERSION,
      Cadence.settings, theme: Cadence.state.theme, mode: Cadence.state.mode, secondsLeft,
      running, endsAt: running ? endsAt : null,
      focusCount: Cadence.state.focusCount, tasks: Cadence.state.tasks, activeTaskId: Cadence.state.activeTaskId,
      sessions: Cadence.state.sessions, demo: Cadence.state.demo, lastExportAt: Cadence.state.lastExportAt,
      lastReviewDay: Cadence.state.lastReviewDay,
    };
  }
  Cadence.save = function() {
    localStorage.setItem(Cadence.KEY, JSON.stringify(Cadence.snapshot()));
  }
  Cadence.load = function() {
    try {
      const raw = localStorage.getItem(Cadence.KEY);
      if (!raw) return false;
      const d = JSON.parse(raw);
      Object.assign(Cadence.settings, d.settings || {});
      if (!Cadence.settings.weeklyGoal) Cadence.settings.weeklyGoal = 40;
      if (!Cadence.settings.monthlyGoal) Cadence.settings.monthlyGoal = 160;
      if (Cadence.settings.vibrate == null) Cadence.settings.vibrate = true;
      if (!Cadence.settings.soundChoice) Cadence.settings.soundChoice = "chime";
      Cadence.state.theme = d.theme || "graphite";
      Cadence.state.mode = d.mode || "focus";
      Cadence.state.secondsLeft = d.secondsLeft != null ? d.secondsLeft : Cadence.durationFor(Cadence.state.mode);
      Cadence.state.focusCount = d.focusCount || 0;
      Cadence.state.tasks = Array.isArray(d.tasks) ? d.tasks.map(Cadence.normalizeTask) : [];
      Cadence.state.activeTaskId = d.activeTaskId || null;
      Cadence.state.sessions = Array.isArray(d.sessions) ? d.sessions : [];
      Cadence.state.demo = !!d.demo;
      Cadence.state.lastExportAt = d.lastExportAt || 0;
      Cadence.state.lastReviewDay = d.lastReviewDay || null;
      Cadence.state.schemaVersion = d.schemaVersion || 1;
      // Restore timer across refresh — actual resume in Cadence.resumeTimerIfNeeded()
      Cadence.state._restoreEndsAt = typeof d.endsAt === "number" ? d.endsAt : null;
      Cadence.state._restoreRunning = !!d.running && !!d.endsAt;
      if (Cadence.settings.volume == null) Cadence.settings.volume = 2;
      if (Cadence.settings.themeAuto == null) Cadence.settings.themeAuto = false;
      if (!Cadence.settings.accent) Cadence.settings.accent = "default";
      if (Cadence.settings.compact == null) Cadence.settings.compact = false;
      if (Cadence.settings.confirmSkip == null) Cadence.settings.confirmSkip = true;
      return true;
    } catch { return false; }
  }
  Cadence.normalizeTask = function(t) {
    const focusMin = Number(t.focusMin) || 0;
    return {
      id: t.id || Cadence.uid(),
      title: String(t.title || "Untitled"),
      done: !!t.done,
      pomodoros: Number(t.pomodoros) || 0,
      target: Number(t.target) || 0,
      focusMin: focusMin >= 5 && focusMin <= 90 ? focusMin : 0,
      due: t.due === "today" || t.due === "later" ? t.due : null,
      archived: !!t.archived,
    };
  }
  Cadence.isValidSession = function(s) {
    return s && typeof s === "object"
      && typeof s.id === "string"
      && (s.mode === "focus" || s.mode === "short" || s.mode === "long")
      && typeof s.startedAt === "number"
      && typeof s.endedAt === "number"
      && typeof s.durationSec === "number"
      && typeof s.completed === "boolean";
  }
  Cadence.isValidTask = function(t) {
    return t && typeof t === "object" && typeof t.id === "string" && typeof t.title === "string";
  }

  
})(window.Cadence);
