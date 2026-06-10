import { test, expect } from '@playwright/test'

// Mobile sanity tests. These run only in the 'mobile' Playwright project
// (Pixel 7 emulation: isMobile, hasTouch, coarse pointer), which is what
// gates the touch-only chrome — the KeyBar and command chips.
//
// Output assertions go through window.__terminalText, the same plain-text
// hook the desktop suite uses: every echoed output line and every executed
// command line is pushed there.

async function run(page, command) {
  await page.keyboard.type(command)
  await page.keyboard.press('Enter')
}

function waitForOutput(page, text) {
  return page.waitForFunction(
    (t) => (window.__terminalText || []).some((l) => l.includes(t)),
    text
  )
}

// An executed command line is recorded verbatim; trim() guards against an
// implementation recording a chip's trailing space (chips insert '<cmd> ')
function waitForExecuted(page, command) {
  return page.waitForFunction(
    (c) => (window.__terminalText || []).some((l) => l.trim() === c),
    command
  )
}

test.beforeEach(async ({ page }) => {
  // Chips reflect not-yet-completed commands and progress persists in
  // localStorage — clear it before any page script runs so every test
  // starts from a deterministic, nothing-completed state
  await page.addInitScript(() => localStorage.clear())
  // ?touch=1 is belt-and-braces: device emulation already provides
  // (pointer: coarse), and the query param forces the mobile chrome too
  await page.goto('./?touch=1')
  await expect(page.locator('.xterm')).toBeVisible()
  await page.waitForFunction(() => Array.isArray(window.__terminalText))
})

test('mobile chrome renders: app shell, terminal, key bar and chips', async ({ page }) => {
  const appShell = page.getByTestId('app-shell')
  await expect(appShell).toBeVisible()
  await expect(page.locator('.xterm')).toBeVisible()
  await expect(page.getByTestId('key-bar')).toBeVisible()
  await expect(page.getByTestId('command-chips')).toBeVisible()
  // light layout sanity: the shell occupies real space (VisualViewport
  // handler sizes it) — fine-grained keyboard-resize behaviour is not
  // testable under emulation
  const box = await appShell.boundingBox()
  expect(box.height).toBeGreaterThan(0)
})

test('key bar Tab completes the command in place', async ({ page }) => {
  await page.locator('.xterm').tap()
  // 'ec' has exactly one candidate ('echo'); the key-bar Tab button must
  // feed the shell exactly like pressing Tab on a keyboard
  await page.keyboard.type('ec')
  await page.getByTestId('key-tab').tap()
  await page.keyboard.type(' mob')
  await page.keyboard.press('Enter')
  await waitForExecuted(page, 'echo mob')
  await waitForOutput(page, 'mob')
})

test('key bar up-arrow recalls history', async ({ page }) => {
  await page.locator('.xterm').tap()
  await run(page, 'echo first')
  await waitForExecuted(page, 'echo first')
  await page.getByTestId('key-up').tap()
  await page.keyboard.press('Enter')
  // the recalled command executes a second time
  await page.waitForFunction(
    () =>
      (window.__terminalText || []).filter((l) => l.trim() === 'echo first')
        .length >= 2
  )
})

test('chip inserts the command without running it', async ({ page }) => {
  await page.locator('.xterm').tap()
  const chip = page.getByTestId('chip-pwd')
  await expect(chip).toBeVisible()
  await chip.tap()
  // chips only insert 'pwd ' into the input buffer — nothing executed yet
  const executed = await page.evaluate(() =>
    (window.__terminalText || []).some((l) => l.trim() === 'pwd')
  )
  expect(executed).toBe(false)
  // Enter runs the inserted buffer
  await page.keyboard.press('Enter')
  await waitForExecuted(page, 'pwd')
  await waitForOutput(page, '/home/user')
})

test('chips reflect progress: completed command loses its chip', async ({ page }) => {
  await expect(page.getByTestId('chip-echo')).toBeVisible()
  await page.locator('.xterm').tap()
  await run(page, 'echo done')
  await waitForOutput(page, 'done')
  // echo is now completed, so its chip must drop out of the suggestions
  await expect(page.getByTestId('chip-echo')).toBeHidden()
})

test('tapping the app shell focuses the terminal for typing', async ({ page }) => {
  await page.getByTestId('app-shell').tap()
  await run(page, 'ls')
  await waitForExecuted(page, 'ls')
  await waitForOutput(page, 'Documents')
})
