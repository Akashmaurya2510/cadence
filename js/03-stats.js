/* Cadence module */
(function (Cadence) {
"use strict";
Cadence.mulberry32 = function(a) {
    return function () {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  Cadence.seed = function() {
    const rand = Cadence.mulberry32(20260825);
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
    Cadence.state.tasks = tasks;
    Cadence.state.sessions = sessions;
    Cadence.state.demo = true;
  }

  Cadence.focusSessions = function() {
    return Cadence.state.sessions.filter((s) => s.mode === "focus" && s.completed);
  }
  Cadence.allFocus = function() {
    return Cadence.state.sessions.filter((s) => s.mode === "focus");
  }
  Cadence.sumRange = function(from, to) {
    return Cadence.focusSessions().filter((s) => s.endedAt >= from && s.endedAt < to).reduce((a, s) => a + s.durationSec, 0);
  }
  Cadence.countRange = function(from, to) {
    return Cadence.focusSessions().filter((s) => s.endedAt >= from && s.endedAt < to).length;
  }
  Cadence.streak = function() {
    const days = new Set(Cadence.focusSessions().map((s) => Cadence.dayKey(s.endedAt)));
    let n = 0, cursor = Cadence.startOfDay();
    if (!days.has(Cadence.dayKey(cursor))) cursor -= 86400000;
    while (days.has(Cadence.dayKey(cursor))) { n++; cursor -= 86400000; }
    return n;
  }
  Cadence.longestStreak = function() {
    const days = [...new Set(Cadence.focusSessions().map((s) => Cadence.dayKey(s.endedAt)))].sort();
    if (!days.length) return 0;
    let best = 1, cur = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1] + "T00:00:00").getTime();
      const now = new Date(days[i] + "T00:00:00").getTime();
      if (now - prev === 86400000) { cur++; best = Math.max(best, cur); }
      else cur = 1;
    }
    return Math.max(best, Cadence.streak());
  }
  Cadence.avgFocusSec = function() {
    const list = Cadence.focusSessions();
    if (!list.length) return 0;
    return Math.round(list.reduce((a, s) => a + s.durationSec, 0) / list.length);
  }
  Cadence.completionRate = function() {
    const all = Cadence.allFocus();
    if (!all.length) return null;
    return Math.round((Cadence.focusSessions().length / all.length) * 100);
  }
  Cadence.bestDay = function() {
    const map = {};
    Cadence.focusSessions().forEach((s) => {
      const k = Cadence.dayKey(s.endedAt);
      map[k] = (map[k] || 0) + s.durationSec;
    });
    let best = null, max = 0;
    Object.keys(map).forEach((k) => { if (map[k] > max) { max = map[k]; best = k; } });
    return best ? { key: best, sec: max } : null;
  }
  Cadence.bestHour = function() {
    const hours = Array.from({ length: 24 }, () => 0);
    Cadence.focusSessions().forEach((s) => { hours[new Date(s.startedAt).getHours()] += s.durationSec; });
    let h = 0, max = 0;
    hours.forEach((v, i) => { if (v > max) { max = v; h = i; } });
    return max ? { hour: h, sec: max } : null;
  }
  Cadence.fmtHour = function(h) {
    const suffix = h >= 12 ? "pm" : "am";
    const n = h % 12 || 12;
    return n + suffix;
  }

  
})(window.Cadence);
