/* Cadence module */
(function (Cadence) {
"use strict";
Cadence.applyAccent = function() {
    const root = document.documentElement;
    const a = Cadence.ACCENTS[Cadence.settings.accent] || null;
    if (!a) {
      root.style.removeProperty("--work");
      root.style.removeProperty("--work-soft");
      root.style.removeProperty("--work-ink");
    } else {
      root.style.setProperty("--work", a.work);
      root.style.setProperty("--work-soft", a.soft);
      root.style.setProperty("--work-ink", a.ink);
    }
    // Refresh mode accent vars via body data-mode (CSS already maps --accent)
    document.body.setAttribute("data-mode", Cadence.state.mode || "focus");
  }
  Cadence.syncThemeUI = function() {
    document.querySelectorAll(".theme-card").forEach((c) => {
      if (c.id === "themeAutoBtn") c.classList.toggle("on", !!Cadence.settings.themeAuto);
      else c.classList.toggle("on", !Cadence.settings.themeAuto && c.dataset.t === Cadence.state.theme);
    });
    document.querySelectorAll(".accent-dot").forEach((d) => {
      d.classList.toggle("on", d.dataset.accent === (Cadence.settings.accent || "default"));
    });
    if (Cadence.$("switchThemeAuto")) {
      Cadence.$("switchThemeAuto").classList.toggle("on", !!Cadence.settings.themeAuto);
      Cadence.$("switchThemeAuto").setAttribute("aria-checked", Cadence.settings.themeAuto ? "true" : "false");
    }
  }
  Cadence.setTheme = function(theme, fromAuto) {
    if (!fromAuto) Cadence.settings.themeAuto = false;
    Cadence.state.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    const color = Cadence.THEME_COLORS[theme] || "#15171b";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", color);
    Cadence.applyAccent();
    Cadence.syncThemeUI();
  }
  Cadence.applyTheme = function() {
    if (Cadence.settings.themeAuto) {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const auto = dark ? "graphite" : "linen";
      Cadence.state.theme = auto;
      document.documentElement.setAttribute("data-theme", auto);
      const color = Cadence.THEME_COLORS[auto] || "#15171b";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", color);
    } else {
      document.documentElement.setAttribute("data-theme", Cadence.state.theme);
      const color = Cadence.THEME_COLORS[Cadence.state.theme] || "#15171b";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", color);
    }
    Cadence.applyAccent();
    Cadence.syncThemeUI();
    document.body.classList.toggle("compact", !!Cadence.settings.compact);
  }

  
})(window.Cadence);
