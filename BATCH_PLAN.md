# Batch Implementation Plan — WebTerminal Revival

## Research Summary

**Stack:** Create React App 3.4.1 (broken on Node ≥17), React 16, jQuery +
`jquery.terminal` 2.17, lodash, GitHub Pages deploy.

**Key findings:**
- `src/lib/fs.js`: fake FS indexed by depth level (not a tree) — sibling dirs collide, re-entering a dir loses its contents; `cd ..` never updates path; `mkdir` returns `undefined` on duplicate
- `src/commands/counter.service.js`: parallel-array design where index → command name is just a comment, already mismatched (index 2 = `ls` in one file, `cd` in another); several tasks pre-marked Completed
- `src/commands/files.js`: `ls`/`cd`/`mkdir` never call `setStatusTrue()`
- `src/commands/basic.js`: `help` advertises 8 commands that don't exist; `pwd` is hardcoded to `/home/imabp`; `uname` uses deprecated `navigator.appVersion`
- `package.json`: `install` and `npm` listed as runtime deps (accidents); `react-scripts` 3.4.1 is CRA which fails on modern Node; `homepage` points to upstream fork
- README: still KWOC 2020 upstream template with upstream maintainer, placeholder clone URL, typos
- Deploy workflow: fires on every branch push; uses outdated `actions/checkout@v2.3.1`; no CI for PRs

**Files and their owners (no overlaps):**

| Unit | Files |
|------|-------|
| 1 — Toolchain | `package.json`, `vite.config.js`(new), `index.html`, `src/index.js`, `.gitignore`, `.eslintrc.cjs`(new), `.prettierrc`(new) |
| 2 — CI/CD + Branding | `.github/workflows/build_and_deploy.yml`, `.github/workflows/ci.yml`(new), `README.md` |
| 3 — Filesystem | `src/lib/fs.js`, `src/lib/fs.test.js`(new) |
| 4 — Command System | `src/commands/counter.service.js`, `src/commands/basic.js`, `src/commands/files.js`, `src/commands/index.js`, `src/commands/commands.test.js`(new) |

---

## Filesystem API Contract (shared between units 3 and 4)

Unit 3 must implement this exact interface; unit 4 must consume it:

```js
class FileSystem {
  // Initial tree:
  // / -> home -> user -> Documents/ (empty), Downloads/ (empty), readme.txt (with content)

  pwd()           // returns string like '/home/user'
  ls()            // returns string[] of names in cwd
  cd(arg)         // arg: dirname | '..' | '~' | ''(same as '~'); returns {ok:bool, message:string}
  mkdir(name)     // returns {ok:bool, message:string}
  touch(name)     // creates empty file; returns {ok:bool, message:string}
  cat(name)       // returns {ok:bool, message:string} — message is file content on success
  cp(src, dst)    // returns {ok:bool, message:string}
  rm(name)        // returns {ok:bool, message:string}
}

export default FileSystem
```

---

## Work Units

### Unit 1 — Toolchain + Lint Infrastructure
**Files:** `package.json`, `vite.config.js` (new), `index.html`, `src/index.js`, `.gitignore`, `.eslintrc.cjs` (new), `.prettierrc` (new)

Migrate Create React App → Vite. Upgrade React 16 → 18 (use `createRoot`). Clean package.json (remove `install` and `npm` as runtime deps; remove old `@testing-library` deps; keep `jquery`, `jquery.terminal`, `lodash`, `react`, `react-dom`). Add devDeps: `vite`, `@vitejs/plugin-react`, `vitest`, `@vitest/ui`, `eslint`, `eslint-plugin-react`, `prettier`. Create `vite.config.js` with `base: '/WebTerminal/'`. Update `index.html` to use Vite's `<script type="module" src="/src/index.jsx">` pattern (rename entry to `.jsx`). Update `src/index.js` → `src/index.jsx` using React 18 `createRoot`. Add npm scripts: `"dev": "vite"`, `"build": "vite build"`, `"preview": "vite preview"`, `"test": "vitest run"`, `"lint": "eslint src"`. Add `.eslintrc.cjs` with react-app rules. Add `.prettierrc` with sensible defaults. Update `.gitignore` to add `/dist` and remove `/build`.

### Unit 2 — CI/CD + Branding
**Files:** `.github/workflows/build_and_deploy.yml`, `.github/workflows/ci.yml` (new), `README.md`

Fix `build_and_deploy.yml`: trigger only on push to `master`; bump `actions/checkout` to `v4`; add `actions/setup-node@v4` with `node-version: '22'`; change build step to `npm ci && npm run build`; update Pages deploy action to `JamesIves/github-pages-deploy-action@v4`; change `folder: build` → `folder: dist`.

Add `ci.yml` that runs on PRs: `actions/checkout@v4`, `setup-node@v4`, `npm ci`, `npm run lint`, `npm run build` (test step: `npm run test -- --run` once vitest is available).

Update `README.md`: fix clone URL placeholder → `lem0n4id/WebTerminal`; fix "BROSWER" → "BROWSER" typo; replace KWOC 2020 section with standard contributing section; replace upstream maintainer block with current maintainer; update demo link to `lem0n4id.github.io/WebTerminal`; replace "Built With" section to reflect current stack (React, Vite, jQuery Terminal); remove the outdated KWOC banner image reference.

### Unit 3 — Filesystem Rewrite + Tests
**Files:** `src/lib/fs.js`, `src/lib/fs.test.js` (new)

Rewrite `src/lib/fs.js` as a tree with nodes `{ name, type: 'dir'|'file', content, children }` (children is a plain object). Implement all methods per the API contract above. Seed the tree: root `/` → `home` → `user` → `Documents/` (empty dir), `Downloads/` (empty dir), `readme.txt` (content: "Welcome to WebTerminal! Type 'help' to get started."). `pwd()` returns the current path string. `cd('')` and `cd('~')` go to `/home/user`. Write `src/lib/fs.test.js` with Vitest tests covering: initial pwd is `/home/user`; ls returns expected files; mkdir creates dir; mkdir duplicate returns error; cd into valid dir works; cd '..' goes up; cd '~' goes home; touch creates file; cat reads file content; cat non-existent returns error; rm removes file; cp copies file.

Note: To run tests in your worktree without unit 1 having landed, install vitest yourself: `npm install --save-dev vitest && npx vitest run src/lib/fs.test.js`

### Unit 4 — Command System Overhaul + Tests
**Files:** `src/commands/counter.service.js`, `src/commands/basic.js`, `src/commands/files.js`, `src/commands/index.js`, `src/commands/commands.test.js` (new)

**counter.service.js** — Replace the parallel-array design with a single `commands` map keyed by command name:
```js
{ echo: { done: false }, pwd: { done: false }, ls: { done: false }, ... }
```
Methods: `getStatus(name)` → colored string; `setDone(name)`; `getStatusLine(name)` for help display; `allCommands()` → array of names; `completedCount()`.

**basic.js** — Fix all existing commands: `pwd` reads from fs `pwd()` method; `uname` returns `'Linux'` (drop `navigator.appVersion`); fix `echo` to echo the text without the tutorial noise after counter hits done; keep tutorial hints only for first use. Add missing commands: `ifconfig` (mock output with fake IP), `tty` (returns `/dev/pts/0`), `date` (already exists, keep), `history` (note: `jquery.terminal` has built-in `$$('#terminal').terminal().history()` — expose it or just show last 10 commands via a stored array), `clear` (call `context.clear()`). Fix `help` to iterate the commands map instead of hardcoded echo calls; mark tasks done correctly.

**files.js** — Wire to the new FileSystem API (per contract above). Call `counter.setDone()` for `ls`, `cd`, `mkdir`. Add `touch`, `cat`, `cp`, `rm` commands wired to FileSystem. Echo `result.message` for all. Add educational hints for first use of each command.

**index.js** — Pass `FileSystem` instance into both `basic` and `fs` command factories so both share the same fs instance.

**commands.test.js** — Unit tests for counter service: initial state all undone; `setDone` marks done; `getStatus` returns correct colored string; `completedCount` increments.

Note: To run tests in your worktree: `npm install --save-dev vitest && npx vitest run src/commands/commands.test.js`

---

## E2E Test Recipe

For all units:
```
1. npm install
2. npm run build
   (If CRA/OpenSSL error: your worktree may not have unit 1 landed. 
    For units 3+4, skip the full build check — run unit tests instead.)
3. For units 3 and 4: npx vitest run --reporter=verbose
4. Success = no errors, dist/ produced (or tests pass)
```

There is no automated browser test. Verifying terminal UX requires visual inspection — mark as "skip e2e browser test, unit tests are sufficient" for units 3 and 4.

---

## Worker Instructions Template

```
After you finish implementing the change:
1. **Code review** — Invoke the `Skill` tool with `skill: "code-review"` to find correctness bugs. Fix any findings before continuing.
2. **Run unit tests** — Run: `npm install && npx vitest run` (if vitest not in package.json yet, install it: `npm install --save-dev vitest`). Fix failures.
3. **Test end-to-end** — Follow the e2e recipe from this prompt.
4. **Commit and push** — Commit all changes with a clear message, push the branch, and create a PR using the GitHub MCP tools (mcp__github__create_pull_request) since `gh` CLI is not available. Target branch: `master` of `lem0n4id/WebTerminal`.
5. **Report** — End with a single line: `PR: <url>` so the coordinator can track it.
```
