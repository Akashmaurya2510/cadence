/* Cadence module */
(function (Cadence) {
"use strict";
Cadence.audioCtx = null;
  Cadence.ctx = function() {
    if (!Cadence.audioCtx) Cadence.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return Cadence.audioCtx;
  }
  Cadence.volScale = function() {
    const v = Cadence.settings.volume || 2;
    return v === 1 ? 0.45 : v === 3 ? 1.35 : 1;
  }
  Cadence.tone = function(ac, freq, start, dur, type, gain) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    const scaled = gain * Cadence.volScale();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(scaled, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(start); o.stop(start + dur + 0.02);
  }
  Cadence.playSound = function(choice) {
    if (!Cadence.settings.sound) return;
    try {
      const ac = Cadence.ctx();
      const t0 = ac.currentTime;
      const kind = choice || Cadence.settings.soundChoice || "chime";
      if (kind === "bell") {
        Cadence.tone(ac, 523, t0, 0.55, "sine", 0.14);
        Cadence.tone(ac, 784, t0 + 0.08, 0.7, "sine", 0.1);
        Cadence.tone(ac, 1046, t0 + 0.18, 0.9, "sine", 0.08);
      } else if (kind === "wood") {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = "triangle"; o.frequency.setValueAtTime(180, t0);
        o.frequency.exponentialRampToValueAtTime(60, t0 + 0.12);
        g.gain.setValueAtTime(0.22, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
        o.connect(g); g.connect(ac.destination);
        o.start(t0); o.stop(t0 + 0.16);
        Cadence.tone(ac, 140, t0 + 0.16, 0.1, "triangle", 0.12);
      } else {
        [0, 0.16, 0.32].forEach((t, i) => Cadence.tone(ac, i === 2 ? 880 : 660, t0 + t, 0.14, "sine", 0.16));
      }
    } catch (e) { /* ignore */ }
  }
  Cadence.playTick = function() {
    if (!Cadence.settings.tickSound || Cadence.state.mode !== "focus") return;
    if (document.visibilityState === "hidden") return;
    try {
      const ac = Cadence.ctx();
      Cadence.tone(ac, 920, ac.currentTime, 0.03, "square", 0.025);
    } catch (e) { /* ignore */ }
  }
  Cadence.vibrate = function() {
    if (!Cadence.settings.vibrate || !navigator.vibrate) return;
    try { navigator.vibrate([40, 80, 40]); } catch (e) { /* ignore */ }
  }
  Cadence.notify = function(title, body) {
    if (!Cadence.settings.notify || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try { new Notification(title, { body, silent: true }); } catch (e) { /* ignore */ }
  }

  
})(window.Cadence);
