/* Cadence module */
(function (Cadence) {
"use strict";
Cadence.resumeTimerIfNeeded = function() {
    const endsAt = Cadence.state._restoreEndsAt;
    const wasRunning = Cadence.state._restoreRunning;
    Cadence.state._restoreEndsAt = null;
    Cadence.state._restoreRunning = false;
    if (!wasRunning || !endsAt) return;
    const rem = Math.ceil((endsAt - Date.now()) / 1000);
    if (rem <= 0) {
      // Timer finished while away — complete the phase
      Cadence.state.running = false;
      Cadence.state.endsAt = null;
      Cadence.state.secondsLeft = 0;
      try { Cadence.completePhase(); } catch (e) { Cadence.state.secondsLeft = Cadence.durationFor(Cadence.state.mode); Cadence.save(); }
      return;
    }
    Cadence.state.endsAt = endsAt;
    Cadence.state.secondsLeft = rem;
    Cadence.state.running = true;
    clearInterval(Cadence.state.timerId);
    Cadence.state.timerId = setInterval(Cadence.tick, 200);
    Cadence.renderTimer();
    Cadence.scheduleZen();
    Cadence.save();
  }

  // Flush timer Cadence.state when tab/app is backgrounded or closed
  window.addEventListener("pagehide", () => { try { Cadence.save(); } catch (e) { /* ignore */ } });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      try { Cadence.save(); } catch (e) { /* ignore */ }
    }
  });

  const hadData = Cadence.load();
  const hash = (location.hash || "").replace("#", "");
  try { Cadence.renderAll(); } catch (e) { console.error(e); Cadence.toast("Something went wrong rendering. Try Settings → Clear, or import a backup."); }
  Cadence.resumeTimerIfNeeded();
  if (hash === "reports" || hash === "log") Cadence.showPage(hash);

  if (!localStorage.getItem(Cadence.TOUR_KEY)) {
    localStorage.setItem(Cadence.CHANGELOG_SEEN_KEY, Cadence.APP_VERSION);
    Cadence.startTour(false);
  } else if (hadData) {
    Cadence.openChangelog(false);
  } else {
    localStorage.setItem(Cadence.CHANGELOG_SEEN_KEY, Cadence.APP_VERSION);
  }

})(window.Cadence);
