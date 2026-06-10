import { test, expect } from '@playwright/test'

test('tab completes a command name prefix', async ({ page }) => {
  await page.goto('./')
  await expect(page.locator('.terminal')).toBeVisible()
  await page.locator('.terminal').click()

  await page.keyboard.type('ec')
  await page.keyboard.press('Tab')

  // jquery.terminal renders the current input line inside the .cmd element
  await expect(page.locator('.cmd')).toContainText('echo')
})
