/* Cadence module */
(function (Cadence) {
"use strict";
Cadence.logSession = function(mode, elapsed, completed) {
    if (elapsed < 15 && !completed) return null;
    if (Cadence.state.demo && completed && mode === "focus") {
      Cadence.state.sessions = [];
      Cadence.state.demo = false;
      Cadence.toast("Sample history cleared — your real sessions start now");
    }
    const now = Date.now();
    const entry = {
      id: Cadence.uid(), mode, startedAt: now - elapsed * 1000, endedAt: now,
      durationSec: elapsed, taskId: mode === "focus" ? Cadence.state.activeTaskId : undefined, completed,
    };
    Cadence.state.sessions.push(entry);
    if (completed && mode === "focus" && Cadence.state.activeTaskId) {
      const t = Cadence.state.tasks.find((x) => x.id === Cadence.state.activeTaskId);
      if (t) {
        t.pomodoros += 1;
        if (t.target > 0 && t.pomodoros >= t.target && !t.done) {
          t.done = true;
          if (Cadence.state.activeTaskId === t.id) Cadence.state.activeTaskId = null;
          setTimeout(() => Cadence.toast("Target hit · " + t.title + " marked done"), 400);
        }
      }
    }
    return entry;
  }

  Cadence.setZen = function(on) {
    Cadence.state.zen = !!on;
    document.body.classList.toggle("zen", Cadence.state.zen);
  }

  Cadence.zenTimer = null;
  Cadence.scheduleZen = function() {
    clearTimeout(Cadence.zenTimer);
    if (Cadence.state.running && Cadence.state.mode === "focus") {
      Cadence.zenTimer = setTimeout(() => { if (Cadence.state.running && Cadence.state.mode === "focus") Cadence.setZen(true); }, 1400);
    }
  }

  Cadence.advance = function(fromComplete) {
    if (Cadence.state.mode === "focus") {
      Cadence.state.focusCount++;
      Cadence.state.mode = Cadence.state.focusCount % Cadence.settings.interval === 0 ? "long" : "short";
    } else Cadence.state.mode = "focus";
    Cadence.state.secondsLeft = Cadence.durationFor(Cadence.state.mode);
    Cadence.state.running = false;
    Cadence.state.endsAt = null;
    clearInterval(Cadence.state.timerId);
    Cadence.setZen(false);
    if (fromComplete && Cadence.settings.autoStart && !Cadence.state.pendingNoteId) Cadence.startTimer();
    else Cadence.renderTimer();
    Cadence.save();
  }

  Cadence.celebrateIfNeeded = function(prevStreak, prevToday) {
    const today = Cadence.countRange(Cadence.startOfDay(), Cadence.startOfDay() + 86400000);
    const s = Cadence.streak();
    let celebrated = {};
    try { celebrated = JSON.parse(localStorage.getItem(Cadence.CELEBRATE_KEY) || "{}"); } catch (e) { celebrated = {}; }
    const day = Cadence.dayKey(Date.now());
    let fire = false;
    if (today >= Cadence.settings.dailyGoal && prevToday < Cadence.settings.dailyGoal && celebrated.goalDay !== day) {
      celebrated.goalDay = day;
      fire = true;
    }
    const longest = Cadence.longestStreak();
    if (s > prevStreak && s >= longest && s > 1 && celebrated.streak !== s) {
      celebrated.streak = s;
      fire = true;
    }
    localStorage.setItem(Cadence.CELEBRATE_KEY, JSON.stringify(celebrated));
    if (fire) Cadence.burstConfetti();
  }

  Cadence.completePhase = function() {
    const prevStreak = Cadence.streak();
    const prevToday = Cadence.countRange(Cadence.startOfDay(), Cadence.startOfDay() + 86400000);
    const wasFocus = Cadence.state.mode === "focus";
    const entry = Cadence.logSession(Cadence.state.mode, Cadence.durationFor(Cadence.state.mode), true);
    Cadence.playSound();
    Cadence.vibrate();
    Cadence.notify(Cadence.MODE_LABEL[Cadence.state.mode] + " complete", "Up next: " + Cadence.MODE_LABEL[Cadence.nextModeAfter(Cadence.state.mode, Cadence.state.focusCount)]);
    if (wasFocus) Cadence.celebrateIfNeeded(prevStreak, prevToday);
    if (wasFocus && entry) {
      Cadence.state.pendingNoteId = entry.id;
      Cadence.state.pendingAutoStart = Cadence.settings.autoStart;
      Cadence.advance(false);
      Cadence.openNoteModal();
    } else {
      Cadence.advance(true);
    }
  }

  Cadence.tick = function() {
    if (!Cadence.state.running || !Cadence.state.endsAt) return;
    const rem = Math.ceil((Cadence.state.endsAt - Date.now()) / 1000);
    if (rem <= 0) Cadence.completePhase();
    else {
      if (Cadence.state.lastTickSecond !== rem) {
        Cadence.state.lastTickSecond = rem;
        Cadence.playTick();
        // Persist about every 5 seconds while running
        if (rem % 5 === 0) Cadence.save();
      }
      Cadence.state.secondsLeft = rem;
      Cadence.renderTimer();
    }
  }
  Cadence.startTimer = function() {
    Cadence.state.running = true;
    Cadence.state.endsAt = Date.now() + Cadence.state.secondsLeft * 1000;
    clearInterval(Cadence.state.timerId);
    Cadence.state.timerId = setInterval(Cadence.tick, 200);
    Cadence.renderTimer();
    Cadence.scheduleZen();
    Cadence.save();
  }
  Cadence.stopTimer = function() {
    if (Cadence.state.running && Cadence.state.endsAt) Cadence.state.secondsLeft = Math.max(0, Math.ceil((Cadence.state.endsAt - Date.now()) / 1000));
    Cadence.state.running = false; Cadence.state.endsAt = null;
    clearInterval(Cadence.state.timerId);
    clearTimeout(Cadence.zenTimer);
    Cadence.setZen(false);
    Cadence.renderTimer(); Cadence.save();
  }

  Cadence.elapsedNow = function() {
    return Cadence.durationFor(Cadence.state.mode) - Cadence.state.secondsLeft;
  }
  Cadence.meaningfullyElapsed = function() {
    return Cadence.state.running && Cadence.elapsedNow() >= 30;
  }
  Cadence.switchMode = function(mode) {
    const go = () => {
      Cadence.stopTimer();
      Cadence.state.mode = mode;
      Cadence.state.secondsLeft = Cadence.durationFor(mode);
      Cadence.renderTimer(); Cadence.save();
    };
    if (Cadence.meaningfullyElapsed()) {
      Cadence.askConfirm({
        title: "Switch phase?",
        text: "This focus block is in progress. Switching will discard the current timer.",
        ok: "Switch",
      }).then((ok) => { if (ok) go(); });
    } else go();
  }

  Cadence.$("playBtn").onclick = () => Cadence.state.running ? Cadence.stopTimer() : Cadence.startTimer();
  Cadence.$("resetBtn").onclick = () => { Cadence.stopTimer(); Cadence.state.secondsLeft = Cadence.durationFor(Cadence.state.mode); Cadence.renderTimer(); Cadence.save(); };
  Cadence.$("skipBtn").onclick = async () => {
    const go = () => {
      const elapsed = Cadence.elapsedNow();
      Cadence.logSession(Cadence.state.mode, elapsed, false);
      Cadence.advance(false);
    };
    if (Cadence.settings.confirmSkip && Cadence.meaningfullyElapsed()) {
      const ok = await Cadence.askConfirm({
        title: "Skip this phase?",
        text: "You have progress on this block. Skip and move on?",
        ok: "Skip",
      });
      if (ok) go();
    } else go();
  };
  document.querySelectorAll(".mode-switch button").forEach((b) => {
    b.onclick = () => Cadence.switchMode(b.dataset.mode);
  });
  Cadence.$("ringStage").onclick = () => {
    if (Cadence.state.running) Cadence.setZen(!Cadence.state.zen);
  };
  Cadence.$("ringStage").onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (Cadence.state.running) Cadence.setZen(!Cadence.state.zen); }
  };

  Cadence.$("taskForm").onsubmit = (e) => {
    e.preventDefault();
    const title = Cadence.$("taskInput").value.trim();
    if (!title) return;
    const t = { id: Cadence.uid(), title, done: false, pomodoros: 0, target: 0, due: "today", archived: false };
    Cadence.state.tasks.unshift(t);
    if (!Cadence.state.activeTaskId) Cadence.state.activeTaskId = t.id;
    Cadence.$("taskInput").value = "";
    Cadence.save(); Cadence.renderTasks();
  };
  document.querySelectorAll("[data-task-view]").forEach((b) => {
    b.onclick = () => {
      Cadence.state.taskView = b.dataset.taskView;
      document.querySelectorAll("[data-task-view]").forEach((x) => x.classList.toggle("on", x === b));
      Cadence.renderTasks();
    };
  });

  document.querySelectorAll("[data-nav]").forEach((a) => {
    a.onclick = (e) => { e.preventDefault(); Cadence.showPage(a.dataset.nav); };
  });
  Cadence.$("wordmark").onclick = () => Cadence.showPage("timer");

  
})(window.Cadence);
