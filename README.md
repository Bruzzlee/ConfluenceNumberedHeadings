# Confluence Numbered Headings

Auto-number headings in Confluence Cloud while editing. This userscript renumbers headings in the editor (no duplicates, full overwrite), provides a small floating `#` button, and works cross-browser (Tampermonkey/Greasemonkey/Violentmonkey).

Files added
 `confluence-numbered-headings.user.js` — the userscript to install.

Inspired by earlier community work on Confluence heading numbering, but reimplemented and extended independently.
   Preferred: open the file `confluence-numbered-headings.user.js` in the browser (or host it somewhere reachable) and click "Install" in your userscript manager.
   Alternative (local): open your userscript manager dashboard, create a new script, and paste the contents of `confluence-numbered-headings.user.js`.

1. Install a userscript manager in your browser:
   - Chrome / Edge / Chromium: Tampermonkey (recommended)
   - Firefox: Violentmonkey or Tampermonkey
   - Other browsers: use a compatible userscript manager

2. Install the script:
   - Preferred: open the file `confluence-numbered-headings-3.1.1.user.js` in the browser (or host it somewhere reachable) and click "Install" in your userscript manager.
   - Alternative (local): open your userscript manager dashboard, create a new script, and paste the contents of `confluence-numbered-headings-3.1.1.user.js`.

Usage

- Open a Confluence Cloud page and click "Edit" (the script runs in edit mode only).
- Use the floating `#` button (top-right) to renumber headings.
- Keyboard shortcuts:
  - `Ctrl+Alt+N` — Number headings
  - `Ctrl+Alt+Shift+N` — Remove numbering

Configuration

Edit the top of the userscript to tweak behavior:

- `START_LEVEL` (1..6): heading level to start numbering from (default `1`).
- `INCLUDE_H1` (true/false): whether to include `H1` when `START_LEVEL = 1` (default `true`).
- `SHOW_FLOAT` (true/false): show/hide the floating `#` button (default `true`).
- `TOP_OFFSET` and `RIGHT_OFFSET`: pixel offsets to position the floating button; adjust if your Confluence toolbar or tenant UI differs.

Notes

- The script overwrites heading text nodes (it strips any leading numeric label before reapplying an updated label), so it avoids accumulating duplicate numbers.
- It detects single-page-app navigation and attaches when you open the editor.

Support

If you encounter issues, please open an issue or update the script locally. The script is provided as-is; no warranty.
