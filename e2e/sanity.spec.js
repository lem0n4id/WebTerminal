import { test, expect } from '@playwright/test'

// Basic sanity tests against the production build. These exercise the real
// jquery.terminal boot path — the class of failure that unit tests on the
// pure-logic modules cannot catch (e.g. the blank-page plugin-attach bug).

async function run(page, command) {
  await page.keyboard.type(command)
  await page.keyboard.press('Enter')
}

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await expect(page.locator('.terminal')).toBeVisible()
  await page.locator('.terminal').click()
})

test('terminal boots and shows the greeting', async ({ page }) => {
  const output = page.locator('.terminal-output')
  await expect(output).toContainText('WebTerminal')
  await expect(output).toContainText('Type')
  await expect(page.locator('.terminal')).toContainText('user@localhost')
})

test('echo prints back its argument', async ({ page }) => {
  await run(page, 'echo hello-from-e2e')
  await expect(page.locator('.terminal-output')).toContainText('hello-from-e2e')
})

test('help lists commands and tracks completion', async ({ page }) => {
  await run(page, 'echo done')
  await run(page, 'help')
  const output = page.locator('.terminal-output')
  await expect(output).toContainText('ls')
  await expect(output).toContainText('mkdir')
  await expect(output).toContainText('cat')
  // echo was run above, so at least one command must be marked completed
  await expect(output).toContainText('Completed')
})

test('filesystem navigation works end-to-end', async ({ page }) => {
  const output = page.locator('.terminal-output')

  await run(page, 'ls')
  await expect(output).toContainText('Documents')
  await expect(output).toContainText('readme.txt')

  await run(page, 'cd Documents')
  await run(page, 'pwd')
  await expect(output).toContainText('/home/user/Documents')

  await run(page, 'cd ..')
  await run(page, 'cat readme.txt')
  await expect(output).toContainText('Welcome to WebTerminal')
})

test('mkdir creates a directory visible to ls', async ({ page }) => {
  const output = page.locator('.terminal-output')

  await run(page, 'mkdir e2e-dir')
  await run(page, 'ls')
  await expect(output).toContainText('e2e-dir')
})

test('unknown command reports an error instead of crashing', async ({ page }) => {
  await run(page, 'definitely-not-a-command')
  await expect(page.locator('.terminal-output')).toContainText(
    /command .* not found|definitely-not-a-command/i
  )
  // terminal still responsive afterwards
  await run(page, 'echo still-alive')
  await expect(page.locator('.terminal-output')).toContainText('still-alive')
})
