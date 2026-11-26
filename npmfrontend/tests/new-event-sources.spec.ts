import { test, expect, type Page } from '@playwright/test'

// Regression: starting a new event showed the sources of the event edited before it. The
// sources editor only reloaded its slice when the event HAD sources, so a new event (no
// sources) kept the previous ones.

const sourceTitleInputs = (page: Page) => page.getByPlaceholder(/^Title \(max/)

async function startNewEvent(page: Page) {
  await page.getByRole('button', { name: 'Create New Event' }).click()
  const at = (await page.evaluate(() => window.__globeTest!.latLongClientXY(40, 12.5)))!
  await page.mouse.click(at.x, at.y)
  await expect(page.getByTestId('submit-event-button')).toBeVisible()
}

test('a new event starts with no sources after cancelling one that had a source', async ({ page }) => {
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  )
  await page.goto('/')
  await page.waitForFunction(() => window.__globeTest !== undefined)

  await startNewEvent(page)
  await expect(sourceTitleInputs(page)).toHaveCount(0)
  await page.getByRole('button', { name: '+', exact: true }).click()
  await sourceTitleInputs(page).first().fill('Leftover source')
  await expect(sourceTitleInputs(page)).toHaveCount(1)
  await page.getByRole('button', { name: 'Cancel' }).click()

  await startNewEvent(page)
  await expect(sourceTitleInputs(page)).toHaveCount(0)
})
