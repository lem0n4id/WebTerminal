# WebTerminal — Improvement & Implementation Plan

A revival plan for this project: an interactive browser terminal that teaches basic
Linux commands through guided tasks. The audit below reflects the state of the code
as of June 2026.

## Current state (audit)

**Stack:** Create React App (`react-scripts` 3.4.1), React 16, jQuery +
`jquery.terminal` 2.17, lodash, deployed to GitHub Pages via a workflow that runs on
every push.

### Blockers — the project doesn't run today

| # | Problem | Detail |
|---|---------|--------|
| 1 | Won't build on modern Node | `react-scripts` 3.4.1 fails on Node ≥ 17 (OpenSSL md4 error). CRA itself is deprecated/unmaintained. |
| 2 | Junk dependencies | `install` and `npm` are listed as runtime dependencies (accidental `npm install install npm` at some point). Old deps carry many known vulnerabilities. |
| 3 | Wrong deployment target | `package.json` `homepage` and the README point to `imabp.github.io/WebTerminal` (the original upstream), not this fork. The deploy workflow also fires on **every branch push**, not just the default branch. |

### Functional bugs

| # | Bug | Where |
|---|-----|-------|
| 4 | The fake filesystem is level-based, not a tree: `_.find(this.fs, {level})` means two directories at the same depth collide, and `cd` pushes a **new empty entry** every time — re-entering a directory loses anything you `mkdir`-ed in it | `src/lib/fs.js` |
| 5 | `cd` with no argument returns "directoy not present" (also a typo) instead of going home | `src/lib/fs.js` |
| 6 | `mkdir` on an existing directory returns `undefined` (echoes nothing useful) | `src/lib/fs.js` |
| 7 | `pwd` is hardcoded to `/home/imabp` and never reflects `cd` | `src/commands/basic.js` |
| 8 | Task-status indexes are mismatched: `help` shows `cd` at index 2, but `counter.service.js` maps index 2 → `ls`. The initial counter array also marks `pwd`/`ls`/`cd`/`cd ..` as "Completed" before the user types anything | `src/commands/basic.js`, `src/commands/counter.service.js` |
| 9 | `ls`, `cd`, `mkdir` never call `counter.setStatusTrue()`, so those tasks can never be completed | `src/commands/files.js` |
| 10 | `help` advertises commands that don't exist: `cat`, `touch`, `cp`, `rm`, `cd ~`, `ifconfig`, `tty`, `history` | `src/commands/basic.js` |
| 11 | `uname` uses the deprecated `navigator.appVersion` and reports the *visitor's* OS — confusing in a Linux tutorial; it should report `Linux` | `src/commands/basic.js` |

### Hygiene

- README is still the upstream template: KWOC 2020 contribution banner, `github_username/repo`
  placeholder in the clone URL, "BROSWER" typo, upstream maintainer contact.
- No tests, no lint config beyond CRA defaults, no CI quality gates (the only workflow
  is deploy-on-push).
- jQuery and React are mixed via a class component and a raw DOM ref — workable, but
  it blocks React-idiomatic features and keeps two UI paradigms alive.

---

## Implementation plan

Ordered so each phase leaves the project in a working, shippable state.

### Phase 1 — Make it build, own the fork (~half a day)

Goal: `npm install && npm run dev` works on current Node; deploys land on *this*
fork's GitHub Pages.

1. Migrate CRA → **Vite** (`vite` + `@vitejs/plugin-react`); set `base: '/WebTerminal/'`
   for GitHub Pages. Delete `react-scripts`.
2. Upgrade React 16 → 18 (`createRoot`); keep `jquery.terminal` as-is for now (latest
   version still works — replacing it is Phase 4, optional).
3. Remove junk deps (`install`, `npm`, unused testing libs); run `npm audit fix`.
4. Fix `package.json` `homepage`, README links/branding, and the greeting/prompt text
   to this fork's identity.
5. Rework the workflow: deploy only on push to `master`; bump `actions/checkout` to v4
   and the Pages deploy action to a current version; add Node 22 via `actions/setup-node`.

### Phase 2 — Fix the core mechanics (~1 day)

Goal: every command shown in `help` exists and works; progress tracking is truthful.

1. **Rewrite `src/lib/fs.js` as a real tree**: nodes `{ name, type: 'dir'|'file', children, content }`,
   a `cwd` path array, and methods `ls`, `cd` (incl. `..`, `~`, no-arg, absolute/relative
   paths), `mkdir`, `touch`, `cat`, `cp`, `rm`, `pwd`. Seed it with a small home
   directory (`Documents/`, `Downloads/`, a `readme.txt` to `cat`).
2. **Replace the parallel-array counter** with a single map keyed by command name:
   `{ echo: { done: false, description: '...' } }`. `help` renders from this map, so
   the list and the statuses can never drift apart again (fixes bugs 8–9 and the
   index-comment maintenance burden).
3. Implement the missing commands (`cat`, `touch`, `cp`, `rm`, `ifconfig` and `tty`
   with plausible mock output, `history` from jquery.terminal's built-in history).
4. `pwd` reads from the filesystem's `cwd`; `uname` returns `Linux`.
5. Mark tasks complete from one place (a wrapper around command dispatch) instead of
   per-command `setStatusTrue` calls.

### Phase 3 — Quality gates (~half a day)

1. Add **Vitest** unit tests for the filesystem and the task tracker (these are pure
   logic — easy wins; the bugs in this audit would all have been caught by them).
2. Add ESLint + Prettier with a CI workflow that runs lint + test + build on PRs.
3. Add a smoke test that boots the app and runs `help` (Playwright or
   @testing-library, whichever feels lighter).

### Phase 4 — Product improvements (pick & choose)

Roughly in order of value-per-effort:

1. **Persist progress** in `localStorage` so learners keep their task state across visits.
2. **Guided lesson flow**: a visible progress bar / `tasks` command, and "next up" hints
   driven by the task map instead of hardcoded strings inside each command.
3. **Tab completion** for commands and paths (jquery.terminal supports a `completion`
   callback; wire it to the fs tree).
4. **Replace jquery.terminal with xterm.js or a small custom React terminal** — drops
   jQuery entirely, shrinks the bundle, and makes the UI fully React. Only worth it
   after Phases 1–3; the current embed works.
5. `man <command>` pages, themes (light/dark), and mobile keyboard support.

### Out of scope (deliberately)

- A real shell/PTY backend — the project's value is a safe, zero-setup sandbox.
- Pipes, redirection, permissions — nice someday, but not before the basics work.

## Suggested first milestone

Phases 1 + 2 together (~1.5 days of focused work) turn this from a non-building
archive into a working, honest tutorial deployed on your own Pages URL. Everything
in Phases 3–4 is incremental from there.
