/* Cadence module */
(function (Cadence) {
"use strict";
Cadence.renderTimer = function() {
    const total = Cadence.durationFor(Cadence.state.mode) || 1;
    const mm = Cadence.pad(Math.floor(Cadence.state.secondsLeft / 60));
    const ss = Cadence.pad(Cadence.state.secondsLeft % 60);
    Cadence.$("timeDisplay").textContent = mm + ":" + ss;
    Cadence.$("stateLabel").textContent = Cadence.state.running ? "In progress" : "Ready";
    const nxt = Cadence.nextModeAfter(Cadence.state.mode, Cadence.state.focusCount);
    Cadence.$("upNext").textContent = "Up next: " + Cadence.MODE_LABEL[nxt];
    const today = Cadence.countRange(Cadence.startOfDay(), Cadence.startOfDay() + 86400000);
    Cadence.$("todayLine").textContent = today + " session" + (today === 1 ? "" : "s") + " today · goal " + Cadence.settings.dailyGoal;
    const ms = Cadence.$("miniStats");
    if (ms) {
      const st = Cadence.streak();
      ms.innerHTML =
        '<span class="mini-stat"><strong>' + st + "d</strong> Cadence.streak</span>" +
        '<span class="mini-stat"><strong>' + today + "/" + Cadence.settings.dailyGoal + "</strong> today</span>";
    }
    document.body.setAttribute("data-mode", Cadence.state.mode);
    Cadence.applyTheme();
    Cadence.ringProgress.style.strokeDashoffset = Cadence.CIRC * (1 - Cadence.state.secondsLeft / total);
    Cadence.$("playIcon").innerHTML = Cadence.state.running
      ? '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>'
      : '<path d="M8 5v14l11-7z"/>';
    Cadence.$("playBtn").setAttribute("aria-label", Cadence.state.running ? "Pause" : "Start");
    Cadence.$("ringStage").classList.toggle("breathing", Cadence.state.running);
    const modeShort = Cadence.MODE_LABEL[Cadence.state.mode] || "Focus";
    if (Cadence.state.running) {
      document.title = mm + ":" + ss + " · " + modeShort + " · Cadence";
    } else {
      document.title = "Cadence";
    }
    // Active task on ring
    const at = Cadence.state.activeTaskId && Cadence.state.tasks.find((t) => t.id === Cadence.state.activeTaskId);
    const atl = Cadence.$("activeTaskLabel");
    if (atl) {
      if (at && Cadence.state.mode === "focus") {
        atl.hidden = false;
        atl.textContent = at.title + (at.focusMin ? " · " + at.focusMin + "m" : "");
      } else {
        atl.hidden = true;
      }
    }
    // Ends-at estimate
    const ea = Cadence.$("endsAt");
    if (ea) {
      if (Cadence.state.running && Cadence.state.endsAt) {
        const d = new Date(Cadence.state.endsAt);
        ea.hidden = false;
        ea.textContent = "Ends ~" + Cadence.pad(d.getHours()) + ":" + Cadence.pad(d.getMinutes());
      } else {
        ea.hidden = true;
      }
    }
    // Break suggestions
    const bs = Cadence.$("breakSuggest");
    if (bs) {
      if (!Cadence.state.running && (Cadence.state.mode === "short" || Cadence.state.mode === "long") && !Cadence.state.zen) {
        bs.hidden = false;
        const idea = Cadence.BREAK_IDEAS[(Cadence.state.focusCount + Cadence.state.mode.length) % BREAK_IDEAS.length];
        Cadence.$("breakText").textContent = idea;
      } else if (Cadence.state.running && (Cadence.state.mode === "short" || Cadence.state.mode === "long")) {
        bs.hidden = false;
      } else {
        bs.hidden = true;
      }
    }
    document.querySelectorAll(".mode-switch button").forEach((b) => b.classList.toggle("on", b.dataset.mode === Cadence.state.mode));
    Cadence.renderPips();
  }

  
})(window.Cadence);
