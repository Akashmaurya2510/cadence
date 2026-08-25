/* Cadence module */
(function (Cadence) {
"use strict";
Cadence.renderPips = function() {
    const n = Cadence.settings.interval, filled = Cadence.state.focusCount % n;
    Cadence.$("pips").innerHTML = "";
    for (let i = 0; i < n; i++) {
      const d = document.createElement("div");
      d.className = "pip" + (i < filled ? " filled" : "");
      Cadence.$("pips").appendChild(d);
    }
  }

  Cadence.visibleTasks = function() {
    const view = Cadence.state.taskView;
    let list = Cadence.state.tasks.filter((t) => {
      if (view === "paused") return t.archived;
      if (t.archived) return false;
      if (view === "today") return t.due === "today" && !t.done;
      if (view === "later") return t.due === "later" && !t.done;
      return true;
    });
    if (view === "open") list = [...list.filter((t) => !t.done), ...list.filter((t) => t.done)];
    return list;
  }

  Cadence.renderTasks = function() {
    const list = Cadence.$("taskList");
    list.innerHTML = "";
    const open = Cadence.state.tasks.filter((t) => !t.done && !t.archived).length;
    Cadence.$("openCount").textContent = open ? open + " open" : "";
    const items = Cadence.visibleTasks();
    if (!items.length) {
      const empty = {
        open: "Name what you are working on.",
        today: "Nothing marked for today.",
        later: "Nothing parked for later.",
        paused: "No paused tasks.",
      }[Cadence.state.taskView] || "No tasks here.";
      list.innerHTML = '<p class="today-line" style="padding:16px;text-align:center;border:1px solid var(--border);border-radius:12px;background:var(--surface)">' + empty + "</p>";
      return;
    }
    items.forEach((t, idx) => {
      const row = document.createElement("div");
      row.className = "task" + (t.id === Cadence.state.activeTaskId ? " active" : "") + (t.done ? " done" : "");
      row.draggable = true;
      const pct = t.target > 0 ? Math.min(100, Math.round((t.pomodoros / t.target) * 100)) : 0;
      const dueLabel = t.due === "today" ? "Today" : t.due === "later" ? "Later" : "Inbox";
      const progressLabel = t.target > 0
        ? (t.pomodoros + "/" + t.target)
        : (t.pomodoros ? t.pomodoros + " done" : "Set target");
      const lenLabel = (t.focusMin || Cadence.settings.focus) + "m";
      row.innerHTML =
        '<button class="chk" aria-label="Mark done"></button>' +
        '<div class="body">' +
          '<button class="title">' + Cadence.escapeHtml(t.title) + "</button>" +
          '<div class="meta">' +
            (t.target > 0 ? '<div class="pomo-bar" title="' + progressLabel + '"><span style="width:' + pct + '%"></span></div>' : "") +
            '<button type="button" class="meta-chip progress pomo-hit">' + progressLabel + "</button>" +
            '<button type="button" class="meta-chip len focus-len" title="Focus length">' + lenLabel + "</button>" +
            '<button class="due-chip' + (t.due === "today" ? " today" : "") + '" type="button">' + dueLabel + "</button>" +
          "</div>" +
          (t.archived || t.done ? "" : '<button type="button" class="start-focus">Start focus</button>') +
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
      function selectTask(start) {
        if (t.archived || t.done) return;
        if (!start && Cadence.state.activeTaskId === t.id) {
          // Second tap on the active task unselects it
          Cadence.state.activeTaskId = null;
          Cadence.save(); Cadence.renderTasks(); Cadence.renderTimer();
          Cadence.toast("Unselected");
          return;
        }
        Cadence.state.activeTaskId = t.id;
        if (!Cadence.state.running) {
          if (Cadence.state.mode !== "focus") Cadence.state.mode = "focus";
          Cadence.state.secondsLeft = Cadence.durationFor("focus");
        }
        Cadence.save(); Cadence.renderTasks(); Cadence.renderTimer();
        Cadence.showPage("timer");
        if (start && !Cadence.state.running) Cadence.startTimer();
        else if (!start) Cadence.toast("Selected · " + t.title);
      }
      row.querySelector(".chk").onclick = (e) => {
        e.stopPropagation();
        t.done = !t.done;
        if (t.done && Cadence.state.activeTaskId === t.id) Cadence.state.activeTaskId = null;
        Cadence.save(); Cadence.renderTasks();
      };
      row.querySelector(".title").onclick = () => selectTask(false);
      row.querySelector(".title").ondblclick = (e) => { e.preventDefault(); Cadence.startEdit(row, t); };
      const startBtn = row.querySelector(".start-focus");
      if (startBtn) startBtn.onclick = (e) => { e.stopPropagation(); selectTask(true); };
      row.querySelector(".due-chip").onclick = (e) => {
        e.stopPropagation();
        t.due = t.due === "today" ? "later" : t.due === "later" ? null : "today";
        Cadence.save(); Cadence.renderTasks();
      };
      const pomoHit = row.querySelector(".pomo-hit");
      if (pomoHit) {
        pomoHit.onclick = (e) => {
          e.stopPropagation();
          t.target = t.target >= 12 ? 0 : (t.target || 0) + 1;
          Cadence.save(); Cadence.renderTasks();
        };
      }
      const focusLen = row.querySelector(".focus-len");
      if (focusLen) {
        focusLen.onclick = (e) => {
          e.stopPropagation();
          const cycle = [0, 15, 25, 45, 50, 90];
          const i = cycle.indexOf(t.focusMin || 0);
          t.focusMin = cycle[(i + 1) % cycle.length];
          if (t.id === Cadence.state.activeTaskId && Cadence.state.mode === "focus" && !Cadence.state.running) {
            Cadence.state.secondsLeft = Cadence.durationFor("focus");
            Cadence.renderTimer();
          }
          Cadence.save(); Cadence.renderTasks();
        };
      }
      row.querySelector(".up").onclick = (e) => { e.stopPropagation(); Cadence.moveTask(t.id, -1); };
      row.querySelector(".down").onclick = (e) => { e.stopPropagation(); Cadence.moveTask(t.id, 1); };
      row.querySelector(".archive").onclick = (e) => {
        e.stopPropagation();
        t.archived = !t.archived;
        if (t.archived && Cadence.state.activeTaskId === t.id) Cadence.state.activeTaskId = null;
        Cadence.save(); Cadence.renderTasks();
        Cadence.toast(t.archived ? "Task paused" : "Task resumed");
      };
      row.querySelector(".del").onclick = (e) => { e.stopPropagation(); Cadence.deleteTask(t); };
      row.ondragstart = () => { Cadence.state.dragId = t.id; row.classList.add("dragging"); };
      row.ondragend = () => { Cadence.state.dragId = null; row.classList.remove("dragging"); };
      row.ondragover = (e) => e.preventDefault();
      row.ondrop = (e) => {
        e.preventDefault();
        if (!Cadence.state.dragId || Cadence.state.dragId === t.id) return;
        const from = Cadence.state.tasks.findIndex((x) => x.id === Cadence.state.dragId);
        const to = Cadence.state.tasks.findIndex((x) => x.id === t.id);
        if (from < 0 || to < 0) return;
        const [moved] = Cadence.state.tasks.splice(from, 1);
        Cadence.state.tasks.splice(to, 0, moved);
        Cadence.save(); Cadence.renderTasks();
      };
      if (idx === 0) row.querySelector(".up").disabled = true;
      if (idx === items.length - 1) row.querySelector(".down").disabled = true;
      list.appendChild(row);
    });
  }
  Cadence.startEdit = function(row, t) {
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
      Cadence.save(); Cadence.renderTasks();
    };
    input.onblur = commit;
    input.onkeydown = (e) => {
      if (e.key === "Enter") { e.preventDefault(); input.blur(); }
      if (e.key === "Escape") { input.value = t.title; input.blur(); }
    };
  }
  Cadence.moveTask = function(id, dir) {
    const items = Cadence.visibleTasks();
    const vis = items.findIndex((t) => t.id === id);
    const swap = items[vis + dir];
    if (!swap) return;
    const a = Cadence.state.tasks.findIndex((t) => t.id === id);
    const b = Cadence.state.tasks.findIndex((t) => t.id === swap.id);
    const tmp = Cadence.state.tasks[a];
    Cadence.state.tasks[a] = Cadence.state.tasks[b];
    Cadence.state.tasks[b] = tmp;
    Cadence.save(); Cadence.renderTasks();
  }
  Cadence.deleteTask = function(t) {
    const idx = Cadence.state.tasks.findIndex((x) => x.id === t.id);
    const copy = { ...t };
    Cadence.state.tasks = Cadence.state.tasks.filter((x) => x.id !== t.id);
    if (Cadence.state.activeTaskId === t.id) Cadence.state.activeTaskId = null;
    Cadence.save(); Cadence.renderTasks();
    Cadence.toast("Task deleted", "Undo", () => {
      Cadence.state.tasks.splice(Math.min(idx, Cadence.state.tasks.length), 0, copy);
      Cadence.save(); Cadence.renderTasks();
    });
  }

  
})(window.Cadence);
