/* LiRA project page: theme toggle, BibTeX copy, nav highlight, optional domain videos, KaTeX. */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---- Theme toggle (system default; manual override remembered per viewer) ---- */
  function systemDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function currentTheme() {
    return root.getAttribute("data-theme") || (systemDark() ? "dark" : "light");
  }
  var toggle = document.getElementById("theme-toggle");
  function syncToggle() {
    toggle.setAttribute("aria-pressed", currentTheme() === "dark" ? "true" : "false");
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("lira-theme", next); } catch (e) { /* storage unavailable */ }
      syncToggle();
    });
    syncToggle();
  }


  /* ---- Copy buttons (BibTeX, reproduce commands) ---- */
  Array.prototype.forEach.call(document.querySelectorAll(".copy-btn"), function (copyBtn) {
    var target = document.getElementById(copyBtn.getAttribute("data-target") || "bibtex-text");
    if (!target) return;
    copyBtn.addEventListener("click", function () {
      var text = target.textContent;
      var label = copyBtn.querySelector("span");
      function done(ok) {
        copyBtn.classList.toggle("copied", ok);
        label.textContent = ok ? "Copied" : "Press Ctrl+C";
        setTimeout(function () { copyBtn.classList.remove("copied"); label.textContent = "Copy"; }, 1800);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        var range = document.createRange();
        range.selectNodeContents(target);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        done(ok);
      }
    });
  });

  /* ---- Active section in the top nav (none until a section is reached) ---- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".topnav a[href^='#']"));
  if (links.length) {
    var navSecs = links.map(function (a) { return { a: a, el: document.getElementById(a.getAttribute("href").slice(1)) }; })
      .filter(function (x) { return x.el; });
    var navTick = false;
    var updateNav = function () {
      navTick = false;
      var line = window.innerHeight * 0.4, cur = null;
      navSecs.forEach(function (x) {
        var r = x.el.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) cur = x.a;
      });
      links.forEach(function (a) { a.classList.toggle("active", a === cur); });
    };
    window.addEventListener("scroll", function () { if (!navTick) { navTick = true; requestAnimationFrame(updateNav); } }, { passive: true });
    window.addEventListener("resize", updateNav);
    updateNav();
  }

  /* ---- Optional rollout videos: static/videos/<domain>.mp4 replaces the tile art if present ---- */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  Array.prototype.forEach.call(document.querySelectorAll(".tile-media[data-video]"), function (slot) {
    var name = slot.getAttribute("data-video");
    if (!name || (window.LIRA_VIDEOS || []).indexOf(name) < 0) return;
    var src = "static/videos/" + name + ".mp4";
    var v = document.createElement("video");
    v.muted = true; v.loop = true; v.playsInline = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("loop", "");
    v.preload = "metadata"; v.poster = "static/videos/" + name + ".jpg";
    var detail = slot.getAttribute("data-detail") || "";
    v.setAttribute("aria-label", (slot.getAttribute("data-label") || "Rollout video") + (detail ? ". " + detail : ""));
    if (detail) slot.title = detail;
    v.addEventListener("loadeddata", function () {
      var art = slot.querySelector("svg.icon");
      if (art) art.style.display = "none";
      slot.appendChild(v);
      if (!reduceMotion) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else { v.controls = true; }
    }, { once: true });
    v.addEventListener("error", function () { /* no video yet: keep tile art */ }, true);
    v.src = src;
  });

  /* ---- KaTeX ---- */
  function renderMath() {
    if (typeof window.renderMathInElement !== "function") return false;
    window.renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\(", right: "\\)", display: false }
      ],
      ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
      throwOnError: false
    });
    return true;
  }
  if (!renderMath()) {
    window.addEventListener("load", renderMath);
  }
})();

