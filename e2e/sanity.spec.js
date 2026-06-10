import { test, expect } from '@playwright/test'

// Basic sanity tests against the production build. These exercise the real
// xterm.js boot path — the class of failure that unit tests on the pure-logic
// modules cannot catch (e.g. a blank page from a renderer init bug).
//
// Output assertions go through window.__terminalText, a plain-text hook the
// terminal component maintains specifically for these tests (xterm renders
// into canvas/DOM structures that are unreliable to scrape).

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

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await expect(page.locator('.xterm')).toBeVisible()
  await page.waitForFunction(() => Array.isArray(window.__terminalText))
  await page.locator('.xterm').click()
})

test('terminal boots and shows the greeting', async ({ page }) => {
  await waitForOutput(page, 'WebTerminal')
  await waitForOutput(page, 'Type')
  // xterm rendered its DOM
  await expect(page.locator('.xterm')).toBeVisible()
})

test('echo prints back its argument', async ({ page }) => {
  await run(page, 'echo hello-from-e2e')
  await waitForOutput(page, 'hello-from-e2e')
})

test('help lists commands and tracks completion', async ({ page }) => {
  await run(page, 'echo done')
  await run(page, 'help')
  await waitForOutput(page, 'ls')
  await waitForOutput(page, 'mkdir')
  await waitForOutput(page, 'cat')
  // echo was run above, so at least one command must be marked completed
  await waitForOutput(page, 'Completed')
})

test('filesystem navigation works end-to-end', async ({ page }) => {
  await run(page, 'ls')
  await waitForOutput(page, 'Documents')
  await waitForOutput(page, 'readme.txt')

  await run(page, 'cd Documents')
  await run(page, 'pwd')
  await waitForOutput(page, '/home/user/Documents')

  await run(page, 'cd ..')
  await run(page, 'cat readme.txt')
  // unique to readme.txt's content (the greeting also says "Welcome to WebTerminal")
  await waitForOutput(page, 'see available commands')
})

test('mkdir creates a directory visible to ls', async ({ page }) => {
  await run(page, 'mkdir e2e-dir')
  await run(page, 'ls')
  await waitForOutput(page, 'e2e-dir')
})

test('unknown command reports an error instead of crashing', async ({ page }) => {
  await run(page, 'definitely-not-a-command')
  await page.waitForFunction(() =>
    (window.__terminalText || []).some((l) =>
      /command .* not found|command not found/i.test(l)
    )
  )
  // terminal still responsive afterwards
  await run(page, 'echo still-alive')
  await waitForOutput(page, 'still-alive')
})

test('tab completion completes a command in place', async ({ page }) => {
  // 'ec' has exactly one candidate ('echo'); Tab should complete the buffer
  await page.keyboard.type('ec')
  await page.keyboard.press('Tab')
  await page.keyboard.type(' tab-done')
  await page.keyboard.press('Enter')
  // the executed command line is recorded verbatim — completion must have
  // turned 'ec' into 'echo' before we appended the argument
  await page.waitForFunction(() =>
    (window.__terminalText || []).includes('echo tab-done')
  )
  await waitForOutput(page, 'tab-done')
})
