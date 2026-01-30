// ==UserScript==
// @name         Confluence Numbered Headings (Edit Mode Only, Cross‑Browser, No Duplication)
// @namespace    https://gist.github.com/Bruzzlee/4184b98903493226493a211d0444f0a0
// @version      3.1.1
// @description  Auto-number headings in Confluence Cloud while editing. Full overwrite, no duplicates, Chrome/Firefox compatible. Top-right overlay.
// @match        https://*.atlassian.net/wiki/*
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  /***********************
   * Configuration
   ***********************/
  const START_LEVEL = 1;    // Start numbering at this heading level (1..6)
  const INCLUDE_H1  = true; // Include H1 numbering when START_LEVEL=1
  const SHOW_FLOAT  = true; // Show small floating "#" button

  // New: control the top-right placement (tweak if your toolbar height differs)
  const TOP_OFFSET   = 88;   // px below the top app/toolbar area
  const RIGHT_OFFSET = 16;   // px from the right edge

  /***********************
   * Utilities
   ***********************/
  const isEditUrl = () => /\/edit(?:-v2)?\//.test(location.pathname);

  function waitFor(selector, root = document, timeout = 20000) {
    return new Promise((resolve, reject) => {
      const first = root.querySelector(selector);
      if (first) return resolve(first);

      const obs = new MutationObserver(() => {
        const el = root.querySelector(selector);
        if (el) { obs.disconnect(); resolve(el); }
      });
      obs.observe(root, { childList: true, subtree: true });

      setTimeout(() => { obs.disconnect(); reject(new Error(`Timeout: ${selector}`)); }, timeout);
    });
  }

  function findEditorRoot() {
    return (
      document.querySelector("div.ProseMirror[contenteditable='true']") ||
      document.querySelector("[data-testid*='editor'][contenteditable='true']") ||
      document.querySelector("[data-editor-root='true']") ||
      null
    );
  }

  function getHeadings(root) {
    return Array.from(root.querySelectorAll("h1,h2,h3,h4,h5,h6"));
  }

  function stripLeadingNumbering(txt) {
    if (!txt) return "";
    return txt.replace(/^\s*\d+(?:\.\d+)*\.\s*/, "");
  }

  function computeNumberingLabels(headings) {
    const counters = [0, 0, 0, 0, 0, 0];
    const results = [];

    for (const h of headings) {
      const lvl = Math.max(1, Math.min(6, parseInt(h.tagName.substring(1), 10)));
      for (let i = lvl; i < 6; i++) counters[i] = 0;
      counters[lvl - 1]++;
      const parts = counters.slice(START_LEVEL - 1, lvl).filter(n => n > 0);
      results.push({ el: h, label: parts.join(".") + ". " });
    }
    return results;
  }

  function setHeadingContent(h, numberLabel, cleanText) {
    while (h.firstChild) h.removeChild(h.firstChild);

    if (numberLabel) {
      const num = document.createElement("span");
      num.setAttribute("data-tm-number", "true");
      // No custom styles: inherit heading font, color, weight, background, etc.
      num.textContent = numberLabel;
      h.appendChild(num);
    }

    h.appendChild(document.createTextNode(cleanText));
  }

  function getCleanHeadingText(h) {
    h.querySelectorAll("span.ProseMirror-widget").forEach(el => el.remove());
    const br = h.querySelector("br.ProseMirror-trailingBreak");
    if (br) br.remove();
    const raw = (h.textContent || "").trim();
    return stripLeadingNumbering(raw);
  }

  function renumber(root) {
    const all = getHeadings(root)
      .filter(h => (INCLUDE_H1 || h.tagName !== "H1"))
      .filter(h => parseInt(h.tagName.substring(1), 10) >= START_LEVEL);

    const labels = computeNumberingLabels(all);

    for (const { el, label } of labels) {
      const cleanText = getCleanHeadingText(el);
      setHeadingContent(el, label, cleanText);
    }
  }

  function removeAllNumbers(root) {
    const all = getHeadings(root);
    for (const h of all) {
      const cleanText = getCleanHeadingText(h);
      setHeadingContent(h, "", cleanText);
    }
  }

  function installHotkeys(root) {
    window.addEventListener("keydown", (e) => {
      const key = (e.key || "").toLowerCase();

      if (e.ctrlKey && e.altKey && !e.shiftKey && key === "n") {
        e.preventDefault();
        renumber(root);
      }
      if (e.ctrlKey && e.altKey && e.shiftKey && key === "n") {
        e.preventDefault();
        removeAllNumbers(root);
      }
    }, { capture: true });
  }

  // ************* CHANGED: top-right overlay *************
  function addFloatingButton(root) {
    if (!SHOW_FLOAT) return;

    let btn = document.getElementById("tm-number-btn");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "tm-number-btn";
      btn.textContent = "#";

      Object.assign(btn.style, {
        position: "fixed",
        top: `${TOP_OFFSET}px`,
        right: `${RIGHT_OFFSET}px`,
        width: "40px",
        height: "40px",
        borderRadius: "20px",
        border: "1px solid #C1C7D0",
        background: "#FFFFFF",
        color: "#172B4D",
        boxShadow: "0 2px 6px rgba(0,0,0,.20)",
        cursor: "pointer",
        fontSize: "18px",
        zIndex: 2147483647, // on top of Confluence overlays
        transition: "transform 120ms ease"
      });

      btn.title = "Number headings (Ctrl+Alt+N) • Remove (Ctrl+Alt+Shift+N)";
      btn.addEventListener("mouseenter", () => { btn.style.transform = "scale(1.06)"; });
      btn.addEventListener("mouseleave", () => { btn.style.transform = "scale(1)"; });
      btn.addEventListener("click", () => renumber(root));

      document.body.appendChild(btn);
    }

    // Optional: nudge button down if a Confluence sticky banner appears at the very top.
    // You can tweak this if your tenant shows larger top banners occasionally.
    const maybeNudgeForBanner = () => {
      // If there’s a top global banner, push button slightly further down.
      // Cheap heuristic: look for any fixed element aligned to top:0 with height > 48.
      try {
        const fixedTopEls = Array.from(document.querySelectorAll("body *"))
          .filter(n => {
            const s = getComputedStyle(n);
            return s.position === "fixed" && s.top === "0px" && n.offsetHeight > 48 && n.offsetWidth > 200;
          });
        const extra = fixedTopEls.length ? 12 : 0;
        btn.style.top = `${TOP_OFFSET + extra}px`;
      } catch { /* ignore */ }
    };

    // Run once and on resize (lightweight)
    maybeNudgeForBanner();
    window.addEventListener("resize", maybeNudgeForBanner, { passive: true });
  }

  // Remove overlay button if not in edit mode
  function removeFloatingButton() {
    const btn = document.getElementById("tm-number-btn");
    if (btn) btn.remove();
  }
  // ******************************************************

  async function boot() {
    if (!isEditUrl()) return;
    try {
      await waitFor("div.ProseMirror[contenteditable='true'], [data-testid*='editor'][contenteditable='true'], [data-editor-root='true']");
      const root = findEditorRoot();
      if (!root) return;

      installHotkeys(root);
      addFloatingButton(root);
    } catch (e) {
      console.warn("Confluence Numbered Headings: editor not detected.", e);
    }
  }

  // --- Enhancement: Detect SPA navigation to edit mode ---
  let lastPath = location.pathname;
  function checkEditMode() {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      if (isEditUrl()) {
        setTimeout(boot, 100); // slight delay for DOM update
      } else {
        removeFloatingButton();
      }
    }
  }
  setInterval(checkEditMode, 500); // check every 500ms

  // Initial run
  boot();
})();
