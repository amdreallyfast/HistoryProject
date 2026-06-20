import { test, expect } from '@playwright/test'

test('page loads with the History Project title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/History/i)
})

test('the Three.js globe canvas is visible', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible()
})
