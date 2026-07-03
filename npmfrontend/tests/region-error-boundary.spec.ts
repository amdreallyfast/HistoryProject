import { test, expect } from '@playwright/test'
import badRegionEvents from './fixtures/events-with-bad-region.json' with { type: 'json' }

// A clockwise-wound region makes EarClipping throw ("Iterated all points twice
// with no triangles") from inside the react-three-fiber tree. Before the
// per-region ErrorBoundary, that throw unwound to the React root and blanked the
// whole UI — including the search-results list (the bug found during fixture
// setup). These tests assert the boundary contains the throw to just that one
// region while the rest of the app keeps working.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(badRegionEvents),
    })
  )
  await page.goto('/')
})

test('a malformed (clockwise) region does not blank the app', async ({ page }) => {
  // Capture errors so we can confirm the bad region actually threw (otherwise this
  // test would pass trivially without exercising the boundary).
  const errors: string[] = []
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', (err) => errors.push(err.message))

  await page.getByTestId('search-button').click()

  // The search list still renders every event despite one region crashing
  // EarClipping — the throw did not unwind past the boundary.
  await expect(page.getByTestId('search-result-item')).toHaveCount(badRegionEvents.length)

  // The globe canvas is still mounted (the r3f tree survived).
  await expect(page.locator('canvas')).toBeVisible()

  // Confirm the bad region genuinely triggered the EarClipping throw — i.e. the
  // boundary did real work — and that it was caught rather than blanking the app.
  await expect
    .poll(() => errors.some((t) => t.includes('Iterated all points twice')))
    .toBe(true)
})

test('the valid event is still selectable when a bad region is present', async ({ page }) => {
  await page.getByTestId('search-button').click()

  // First result is the valid event; it still works end-to-end.
  await page.getByTestId('search-result-item').first().click()
  await expect(page.getByTestId('details-event-title')).toHaveText('Test Event One')
})
