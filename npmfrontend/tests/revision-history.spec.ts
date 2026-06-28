import { test, expect } from '@playwright/test'
import fixtureEvents from './fixtures/events.json' with { type: 'json' }

// The revision history (RevisionStack) renders in display mode for the selected event,
// fetching GetAllRevisions. Each row is a 2-column layout: "Rev N — author" on the left and
// the UTC submittal time on the right. The fixture event carries RevisionDateTime so the
// right column has something deterministic to show.

test.beforeEach(async ({ page }) => {
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtureEvents) })
  )
  await page.route('**/api/HistoricalEvent/GetAllRevisions/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtureEvents) })
  )
  await page.goto('/')
})

test('revision history shows the label and UTC submittal time in two columns', async ({ page }) => {
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()

  const row = page.getByTestId('revision-row').first()
  await expect(row).toBeVisible()
  await expect(row).toContainText('Rev 1 — test')
  await expect(page.getByTestId('revision-date').first()).toHaveText('2026-06-28 14:30 UTC')
})
