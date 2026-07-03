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

test('clicking an older revision loads its details and moves the highlight', async ({ page }) => {
  // GetFirst100 returns the latest revision (Rev 2); GetAllRevisions returns both, with
  // distinct titles so we can tell which one is loaded into the display panel.
  const revOne = { ...fixtureEvents[0], Revision: 1, Title: 'First Revision' }
  const revTwo = { ...fixtureEvents[0], Revision: 2, Title: 'Second Revision' }
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([revTwo]) })
  )
  await page.route('**/api/HistoricalEvent/GetAllRevisions/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([revOne, revTwo]) })
  )
  await page.goto('/')

  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()

  // Default selection is the latest revision.
  await expect(page.getByTestId('details-event-title')).toHaveText('Second Revision')
  await expect(page.getByTestId('revision-row').filter({ hasText: 'Rev 2' })).toHaveClass(/bg-gray-600/)

  // Clicking the older revision loads its details and shifts the highlight to it.
  await page.getByTestId('revision-row').filter({ hasText: 'Rev 1' }).click()
  await expect(page.getByTestId('details-event-title')).toHaveText('First Revision')
  await expect(page.getByTestId('revision-row').filter({ hasText: 'Rev 1' })).toHaveClass(/bg-gray-600/)
  await expect(page.getByTestId('revision-row').filter({ hasText: 'Rev 2' })).not.toHaveClass(/bg-gray-600/)
})
