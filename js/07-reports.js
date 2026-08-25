/* Cadence module */
(function (Cadence) {
"use strict";
Cadence.weekBounds = function(now) {
    const todayFrom = Cadence.startOfDay(now);
    const d = new Date(todayFrom);
    const mondayOff = d.getDay() === 0 ? 6 : d.getDay() - 1;
    return { todayFrom, weekFrom: todayFrom - mondayOff * 86400000 };
  }

  Cadence.renderReports = function() {
    const now = Date.now();
    const { todayFrom, weekFrom } = Cadence.weekBounds(now);
    const monthFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const todaySec = Cadence.sumRange(todayFrom, todayFrom + 86400000);
    const weekSec = Cadence.sumRange(weekFrom, weekFrom + 7 * 86400000);
    const lastWeek = Cadence.sumRange(weekFrom - 7 * 86400000, weekFrom);
    const monthSec = Cadence.sumRange(monthFrom, now + 86400000);
    const todayCount = Cadence.countRange(todayFrom, todayFrom + 86400000);
    const weekCount = Cadence.countRange(weekFrom, weekFrom + 7 * 86400000);
    const monthCount = Cadence.countRange(monthFrom, now + 86400000);
    const delta = lastWeek === 0 ? null : Math.round(((weekSec - lastWeek) / lastWeek) * 100);
    Cadence.$("statToday").textContent = Cadence.fmtMs(todaySec);
    Cadence.$("statTodayH").textContent = todayCount + " / " + Cadence.settings.dailyGoal + " goal";
    Cadence.$("statWeek").textContent = Cadence.fmtMs(weekSec);
    Cadence.$("statWeekH").textContent = weekCount + " / " + Cadence.settings.weeklyGoal + " goal";
    Cadence.$("statStreak").textContent = Cadence.streak() + "d";
    Cadence.$("statStreakH").textContent = "best " + Cadence.longestStreak() + "d";
    Cadence.$("statMonth").textContent = Cadence.fmtMs(monthSec);
    Cadence.$("statMonthH").textContent = monthCount + " / " + Cadence.settings.monthlyGoal + " goal";
    Cadence.$("statLongest").textContent = Cadence.longestStreak() + "d";
    Cadence.$("statAvg").textContent = Cadence.fmtMs(Cadence.avgFocusSec());
    const rate = Cadence.completionRate();
    Cadence.$("statRate").textContent = rate == null ? "no sessions yet" : rate + "% completed";
    Cadence.$("reportLead").textContent = weekSec === 0
      ? "Complete a focus session and this page fills in."
      : "You focused " + Cadence.fmtMs(weekSec) + " this week" + (delta == null ? "." : ", " + Math.abs(delta) + "% " + (delta >= 0 ? "above" : "below") + " last week.");
    Cadence.$("demoBanner").style.display = Cadence.state.demo ? "flex" : "none";
    const stale = Cadence.state.lastExportAt && (Date.now() - Cadence.state.lastExportAt > 14 * 86400000);
    const never = !Cadence.state.lastExportAt && Cadence.state.sessions.length > 5 && !Cadence.state.demo;
    Cadence.$("exportNudge").hidden = !(stale || never);

    const day = Cadence.bestDay();
    const hour = Cadence.bestHour();
    const bits = [];
    if (day) {
      const pretty = new Date(day.key + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      bits.push("Best day " + pretty + " · " + Cadence.fmtMs(day.sec));
    }
    if (hour) bits.push("Most productive hour " + Cadence.fmtHour(hour.hour));
    Cadence.$("statCallout").textContent = bits.join("  ·  ");
    Cadence.$("statCallout").style.display = bits.length ? "block" : "none";

    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const bars = Cadence.$("weekBars");
    bars.innerHTML = "";
    let max = 1;
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const ts = todayFrom - i * 86400000;
      const m = Math.round(Cadence.sumRange(ts, ts + 86400000) / 60);
      days.push({ label: names[new Date(ts).getDay()], m });
      max = Math.max(max, m);
    }
    days.forEach((d0, i) => {
      const col = document.createElement("div");
      col.className = "bar-col";
      const ts = todayFrom - (6 - i) * 86400000;
      const dk = Cadence.dayKey(ts);
      const h = Math.max(4, Math.round((d0.m / max) * 130));
      col.innerHTML = '<div class="bar" style="height:' + h + 'px" title="' + d0.m + ' min — click for log"></div><span>' + d0.label + "</span>";
      col.onclick = () => {
        Cadence.state.logDayFilter = dk;
        Cadence.state.logFilter = "all";
        Cadence.state.logLimit = Cadence.LOG_PAGE;
        document.querySelectorAll("[data-filter]").forEach((x) => x.classList.remove("on"));
        Cadence.showPage("log");
        Cadence.toast("Showing " + dk);
      };
      bars.appendChild(col);
    });

    const heat = Cadence.$("heatGrid");
    heat.innerHTML = "";
    const dows = Cadence.$("heatDows");
    if (dows) {
      dows.innerHTML = "";
      ["M", "T", "W", "T", "F", "S", "S"].forEach((d) => {
        const s = document.createElement("span");
        s.textContent = d;
        dows.appendChild(s);
      });
    }
    const map = {};
    Cadence.focusSessions().forEach((s) => {
      const k = Cadence.dayKey(s.endedAt);
      map[k] = (map[k] || 0) + s.durationSec / 60;
    });
    // Align grid so each column is a week starting Monday
    const start = weekFrom - 15 * 7 * 86400000;
    for (let t = start; t < todayFrom + 86400000; t += 86400000) {
      const cell = document.createElement("div");
      const m = Math.round(map[Cadence.dayKey(t)] || 0);
      let cls = "";
      if (m >= 100) cls = "h4"; else if (m >= 50) cls = "h3"; else if (m >= 25) cls = "h2"; else if (m > 0) cls = "h1";
      cell.className = "heat-cell " + cls;
      const dk = Cadence.dayKey(t);
      cell.title = dk + ": " + m + "m — open log";
      cell.setAttribute("role", "button");
      cell.tabIndex = 0;
      cell.onclick = () => {
        Cadence.state.logDayFilter = dk;
        Cadence.state.logFilter = "all";
        Cadence.state.logLimit = Cadence.LOG_PAGE;
        document.querySelectorAll("[data-filter]").forEach((x) => x.classList.remove("on"));
        Cadence.showPage("log");
        Cadence.toast("Showing " + dk);
      };
      heat.appendChild(cell);
    }
    if (!Object.keys(map).length) {
      heat.innerHTML = '<div class="chart-empty" style="grid-column:1/-1">Complete focus sessions to fill the heatmap.</div>';
    }

    const hours = Array.from({ length: 17 }, (_, i) => ({ hour: i + 6, m: 0 }));
    Cadence.focusSessions().forEach((s) => {
      if (s.endedAt < weekFrom) return;
      const h = new Date(s.startedAt).getHours();
      const b = hours.find((x) => x.hour === h);
      if (b) b.m += s.durationSec / 60;
    });
    const hourMax = Math.max(1, ...hours.map((h) => h.m));
    const hourBars = Cadence.$("hourBars");
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
    Cadence.focusSessions().forEach((s) => {
      const id = s.taskId || "_none";
      if (!byTask[id]) byTask[id] = { sec: 0, n: 0 };
      byTask[id].sec += s.durationSec;
      byTask[id].n += 1;
    });
    const rows = Object.keys(byTask).map((id) => {
      const task = Cadence.state.tasks.find((t) => t.id === id);
      return { id, title: task ? task.title : id === "_none" ? "Untagged" : "Deleted task", ...byTask[id] };
    }).sort((a, b) => b.sec - a.sec);
    const box = Cadence.$("taskBreakdown");
    box.innerHTML = "";
    if (!rows.length) {
      Cadence.$("taskBreakdownCard").style.display = "none";
    } else {
      Cadence.$("taskBreakdownCard").style.display = "block";
      const top = Math.max(1, rows[0].sec);
      rows.slice(0, 8).forEach((r) => {
        const el = document.createElement("div");
        el.className = "breakdown-row";
        el.innerHTML = "<div>" + Cadence.escapeHtml(r.title) + '</div><div class="muted">' + Cadence.fmtMs(r.sec) + " · " + r.n + '</div><div class="bar-line"><span style="width:' + Math.round((r.sec / top) * 100) + '%"></span></div>';
        box.appendChild(el);
      });
    }
  }

  Cadence.filteredLog = function() {
    const q = Cadence.state.logSearch.trim().toLowerCase();
    const todayFrom = Cadence.startOfDay();
    const { weekFrom } = Cadence.weekBounds(Date.now());
    return Cadence.state.sessions.filter((s) => {
      if (Cadence.state.logDayFilter) {
        if (Cadence.dayKey(s.endedAt) !== Cadence.state.logDayFilter) return false;
      } else if (Cadence.state.logFilter === "today") {
        if (s.endedAt < todayFrom) return false;
      } else if (Cadence.state.logFilter === "week") {
        if (s.endedAt < weekFrom) return false;
      } else if (Cadence.state.logFilter !== "all" && s.mode !== Cadence.state.logFilter) {
        return false;
      }
      if (Cadence.state.logTaskFilter !== "all") {
        if (Cadence.state.logTaskFilter === "_none" && s.taskId) return false;
        if (Cadence.state.logTaskFilter !== "_none" && s.taskId !== Cadence.state.logTaskFilter) return false;
      }
      if (q) {
        const task = Cadence.state.tasks.find((t) => t.id === s.taskId);
        const hay = ((task && task.title) || "") + " " + (s.note || "") + " " + Cadence.MODE_LABEL[s.mode];
        if (!hay.toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => b.endedAt - a.endedAt);
  }

  Cadence.renderLogFilters = function() {
    const sel = Cadence.$("logTaskFilter");
    const current = Cadence.state.logTaskFilter;
    const ids = new Set(Cadence.state.sessions.map((s) => s.taskId).filter(Boolean));
    sel.innerHTML = '<option value="all">All tasks</option><option value="_none">Untagged</option>';
    Cadence.state.tasks.forEach((t) => {
      if (!ids.has(t.id) && t.archived) return;
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.title;
      sel.appendChild(opt);
    });
    Array.from(ids).forEach((id) => {
      if (Cadence.state.tasks.some((t) => t.id === id)) return;
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = "Deleted task";
      sel.appendChild(opt);
    });
    sel.value = current;
  }

  Cadence.renderLog = function() {
    const wrap = Cadence.$("logList");
    wrap.innerHTML = "";
    const all = Cadence.filteredLog();
    const rows = all.slice(0, Cadence.state.logLimit);
    Cadence.$("logMore").hidden = all.length <= rows.length;
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
      sec.innerHTML = "<h3>" + day + '<span class="today-line">' + Cadence.fmtMs(focus) + " focus</span></h3><div class=\"log-list\"></div>";
      const box = sec.querySelector(".log-list");
      list.forEach((s) => {
        const task = Cadence.state.tasks.find((t) => t.id === s.taskId);
        const row = document.createElement("div");
        row.className = "log-row";
        const t0 = new Date(s.startedAt), t1 = new Date(s.endedAt);
        row.innerHTML =
          '<span class="dot ' + (s.mode === "focus" ? "focus" : "break") + '"></span>' +
          '<div style="flex:1"><div>' + Cadence.MODE_LABEL[s.mode] + (task ? " · " + Cadence.escapeHtml(task.title) : "") + "</div>" +
          '<div class="today-line">' + Cadence.pad(t0.getHours()) + ":" + Cadence.pad(t0.getMinutes()) + " – " + Cadence.pad(t1.getHours()) + ":" + Cadence.pad(t1.getMinutes()) + "</div>" +
          (s.note ? '<div class="log-note">' + Cadence.escapeHtml(s.note) + "</div>" : "") +
          '</div><div style="text-align:right"><div>' + Math.round(s.durationSec / 60) + "m</div>" +
          '<div class="today-line">' + (s.completed ? "Done" : "Skipped") + "</div></div>";
        box.appendChild(row);
      });
      wrap.appendChild(sec);
    });
  }

  Cadence.showPage = function(name) {
    Cadence.state.page = name;
    if (name !== "timer") Cadence.setZen(false);
    document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.dataset.page === name));
    document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === name));
    if (name === "reports") Cadence.renderReports();
    if (name === "log") { Cadence.renderLogFilters(); Cadence.renderLog(); }
    try { location.hash = name === "timer" ? "" : name; } catch (e) { /* ignore */ }
  }

  
})(window.Cadence);
