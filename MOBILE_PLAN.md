# Mobile Support Plan — WebTerminal

Research-backed plan for making the app work well on phones. Desktop behavior is
unchanged. Synthesized June 2026 from a 5-angle research pass (xterm.js mobile
issues, comparable products, touch-terminal UI patterns, keyboard-safe layouts,
PWA); key sources cited inline.

## What the research found

### 1. xterm.js gives us nothing on mobile — by design
Mobile support is explicitly out of scope for the maintainers ("you basically
need to implement your own keyboard or at least some bar with the relevant
characters" — [#5377](https://github.com/xtermjs/xterm.js/issues/5377),
[#1101](https://github.com/xtermjs/xterm.js/issues/1101)). Known problems:
- **iOS**: the soft keyboard only opens when `term.focus()` runs inside a real
  user-gesture handler — programmatic focus outside a tap does nothing.
- **Android (GBoard)**: predictive text writes ahead of the cursor, backspace
  fights an intermediate composition buffer, and Chrome "doesn't reliably fire
  regular key events" ([#2403](https://github.com/xtermjs/xterm.js/issues/2403),
  [#3600](https://github.com/xtermjs/xterm.js/issues/3600), citing CodeMirror's
  IME analysis). xterm already sets `autocorrect/autocapitalize/spellcheck=off`
  (verified in our installed v6 source) — it helps but doesn't fully fix GBoard.
- **Supported escape hatch**: `Terminal.input(data, wasUserInput?)` (verified
  present in our v6 typings) — built for exactly the on-screen-keys use case
  ([PR #3578](https://github.com/xtermjs/xterm.js/pull/3578)).

**Our structural advantage**: the shell is simulated in `src/lib/shell.js`. We
own the entire input path and don't need per-keystroke fidelity like a real
PTY — `handleData` can accept multi-char IME chunks and normalize them.

### 2. No web competitor does this well — the patterns come from native apps
sandbox.bio ships zero mobile affordances (verified in their repo);
copy.sh/v86 has open "android keyboard not working" issues; vscode.dev has no
browser-only terminal at all. The proven patterns are native:
- **Termux extra-keys row**: default layout
  `[ESC / - HOME UP END PGUP] [TAB CTRL ALT LEFT DOWN RIGHT PGDN]`, sticky
  modifiers, swipe-up alternates ([wiki](https://wiki.termux.com/wiki/Touch_Keyboard)).
- **Blink SmartKeys**: bar shows only with the soft keyboard, hides for
  hardware keyboards ([docs.blink.sh](https://docs.blink.sh/)).
- **Termius gestures**: double-tap = Tab, long-press-drag = cursor, pinch =
  font size ([docs](https://docs.termius.com/terminal/mobile-terminal)).
- **Swift Playgrounds**: tappable suggestion chips that *insert* code (the
  learner still executes it) — the right model for an educational app.

Doing mobile well is a genuine differentiator in the "learn Linux in the
browser" niche.

### 3. The keyboard-safe layout recipe (works on both platforms today)
- iOS Safari **never** resizes the layout viewport for the keyboard;
  `position:fixed` bars float mid-screen. The fix is the **VisualViewport API**
  (iOS 13+/Chrome 61+, universal): on `resize` + `scroll`, set the app box's
  height to `visualViewport.height` and translate by `offsetTop`
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport)).
- Android: add `interactive-widget=resizes-content` to the viewport meta and
  the layout viewport shrinks natively (Chrome 108+;
  [Chrome blog](https://developer.chrome.com/blog/viewport-resize-behavior)).
  iOS ignores it (WebKit bug 259770 open) — hence the JS path above.
- Use `100dvh` (not `100vh`) as the base height; none of the vh units react to
  the keyboard, only to the URL bar ([bram.us](https://www.bram.us/2021/07/08/the-large-small-and-dynamic-viewports/)).
- Skip the VirtualKeyboard API (`keyboard-inset-*`) as the primary mechanism —
  Chromium-only ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API)).

### 4. Ergonomics numbers (cited)
- Touch targets: ≥44×44 pt (Apple HIG) / 48×48 dp (Material); WCAG 2.2 AA
  floor is 24×24 px ([w3.org](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)).
- Keep terminal font ≥16px or iOS auto-zooms on focus
  ([css-tricks](https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/)).
  We're at 16px — keep it.
- Do NOT add `user-scalable=no`/`maximum-scale=1` — WCAG 1.4.4 violation and
  axe flags it ([W3C ACT b4f0c3](https://www.w3.org/WAI/standards-guidelines/act/rules/b4f0c3/)).
- `overscroll-behavior: none` kills pull-to-refresh (Safari 16+ too);
  `-webkit-tap-highlight-color: transparent` and `-webkit-touch-callout: none`
  on chrome (not on output — keep it copyable).

### 5. PWA facts (2026)
- Installability = HTTPS + valid manifest; service worker NOT required since
  Chrome 108 ([Chrome blog](https://developer.chrome.com/blog/update-install-criteria)).
  Lighthouse's PWA category was removed in v12 — verify via DevTools
  Application panel.
- `vite-plugin-pwa` derives `scope`/`start_url` from Vite's `base`, so our
  `/WebTerminal/` subpath needs no special handling (verified in plugin source).
- Default workbox glob is `js,css,html` only — add `svg,png,ico,woff2`.
- iOS installed web apps are alive and well (EU removal reversed in 2024);
  manual Share → Add to Home Screen; keep `apple-touch-icon`.

---

## Implementation plan

### Phase 1 — Keyboard-safe layout + input plumbing (the foundation)
**Files:** `index.html`, `src/css/style.css`, `src/components/terminal.jsx`, `src/lib/shell.js` (+ tests)
1. Viewport meta: `width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content`.
2. App container: `100dvh` (fallback `100%`), `overflow: hidden`, `overscroll-behavior: none` on html/body; flex column = terminal output (flex 1) + bottom bars (flex none).
3. VisualViewport hook (`useVisualViewport`): on `resize`/`scroll`, set container height to `vv.height`, translate by `vv.offsetTop`, call `fitAddon.fit()`, keep scrolled to bottom. No-op on desktop.
4. `term.focus()` must run inside the tap handler on the container (iOS gesture rule); use `preventScroll` where focus is programmatic.
5. Shell hardening for IME: make `handleData` chunk-safe (iterate code points, treat `\x7f` runs, CR/LF variants); already mostly true — add unit tests for multi-char chunks.

### Phase 2 — Helper-key bar + command chips (the differentiator)
**Files:** new `src/components/KeyBar.jsx`, new `src/components/CommandChips.jsx`, `terminal.jsx`, `src/css/style.css` (+ tests)
1. **KeyBar** (Termux/Blink pattern): one sticky row — `Tab ↑ ↓ ~ / - .` — real `<button>`s ≥44px, driving `shell.handleData()` directly (equivalent of `term.input()`; we own the shell). Buttons must NOT steal focus from the terminal (`onPointerDown` + `preventDefault`).
2. Show the bar only on coarse pointers (`matchMedia('(pointer: coarse)')`), Blink-style; always-on is acceptable v1.
3. **CommandChips** (Swift Playgrounds pattern): a scrollable chip row of 3–4 *next* commands from `CounterService` (not-yet-done tasks, in tutorial order). Tap **inserts** into the prompt — never auto-runs — preserving the learning loop. Chips update on command completion.
4. Accessibility: chips/bar are native buttons with labels; enable xterm `screenReaderMode: true` (canvas output is otherwise invisible to AT).

### Phase 3 — PWA
**Files:** `vite.config.js`, `index.html`, `public/` icons, delete legacy `public/manifest.json`
1. `vite-plugin-pwa`: `registerType: 'autoUpdate'`, manifest (name, short_name "WebTerm", `display: standalone`, theme/background `#000000`), workbox glob incl. images/fonts.
2. Add a maskable 512² icon (40%-radius safe zone); keep `apple-touch-icon` + `apple-mobile-web-app-status-bar-style: black`.
3. App is backend-free → fully offline once precached.

### Phase 4 — Mobile e2e + polish
**Files:** `playwright.config.js`, `e2e/mobile.spec.js`, CI
1. Add a Playwright **mobile project** (`devices['Pixel 7']`, `hasTouch: true`): KeyBar visible, Tab button completes `ec`→`echo`, chip inserts text, tap focuses terminal. (Soft keyboards can't be emulated — test our components + a faked `visualViewport` for the pinning math.)
2. Run the mobile project in the existing CI e2e job (same browser install).
3. Stretch (only if wanted later): double-tap = Tab gesture, long-press copy menu, pinch font sizing — Termius patterns, real-device territory.

### Suggested batch decomposition (if run as parallel units)
1. Phase 1 (layout + shell hardening) — independent.
2. Phase 2 (KeyBar + chips) — touches `terminal.jsx`; coordinate or sequence after 1.
3. Phase 3 (PWA) — fully independent.
4. Phase 4 (mobile e2e) — last, tests the result of 1+2.

### Out of scope (deliberately)
- The password-input hack for GBoard (rejected upstream for a11y; our
  chunk-tolerant shell + chips/bar reduce typing dependence anyway).
- VirtualKeyboard API as primary (Chromium-only).
- Gesture suite v1 (needs real-device iteration; bar+chips deliver the value).
