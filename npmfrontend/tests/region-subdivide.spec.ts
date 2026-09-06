import { test, expect, Page } from '@playwright/test'
import fixtureEvents from './fixtures/events.json' with { type: 'json' }

// Subdivide doubles the region boundary ring in one press, inserting a point on the
// great-circle arc between each adjacent pair. The geometry itself is unit-tested in
// src/GlobeSection/Region/regionSubdivide.test.js; these specs cover the wiring — that
// the button reaches Redux, the coordinate list re-renders, Submit unlocks, and the cap
// is enforced.
//
// The fixture event carries a 4-point region, so the "Where" panel shows 5 rows
// (1 primary + 4 boundary) and each press doubles the boundary count: 4 -> 8 -> 16 ...

const FIXTURE_BOUNDARY_POINTS = fixtureEvents[0].Region.length
const rowsFor = (boundaryPoints: number) => boundaryPoints + 1 // + the primary location

test.beforeEach(async ({ page }) => {
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtureEvents) })
  )
  await page.route('**/api/HistoricalEvent/GetAllRevisions/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtureEvents) })
  )
  await page.goto('/')
})

async function openEditMode(page: Page) {
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()
  await page.getByTestId('edit-event-button').click()
  await expect(page.getByPlaceholder('Title')).toBeVisible()
}

test('one press doubles the boundary points listed in the Where panel', async ({ page }) => {
  await openEditMode(page)

  const rows = page.getByTestId('region-location-row')
  await expect(rows).toHaveCount(rowsFor(FIXTURE_BOUNDARY_POINTS))

  await page.getByTestId('subdivide-region-button').click()

  await expect(rows).toHaveCount(rowsFor(FIXTURE_BOUNDARY_POINTS * 2))
})

test('the button label reports the pending transition', async ({ page }) => {
  await openEditMode(page)

  const subdivide = page.getByTestId('subdivide-region-button')
  await expect(subdivide).toHaveText(`Subdivide (${FIXTURE_BOUNDARY_POINTS} → ${FIXTURE_BOUNDARY_POINTS * 2})`)

  await subdivide.click()

  await expect(subdivide).toHaveText(`Subdivide (${FIXTURE_BOUNDARY_POINTS * 2} → ${FIXTURE_BOUNDARY_POINTS * 4})`)
})

test('subdividing enables Submit and keeps the region valid', async ({ page }) => {
  await openEditMode(page)

  const submit = page.getByTestId('submit-event-button')
  // No edits yet => disabled by the hasChanges gate.
  await expect(submit).toBeDisabled()

  await page.getByTestId('subdivide-region-button').click()

  // hasChanges sees the new boundary length, and regionValid stays true because the
  // interleaved midpoints preserve the counterclockwise winding EarClipping requires.
  // If subdivision ever flipped the winding, this would stay disabled.
  await expect(submit).toBeEnabled()
})

test('the button disables at the boundary-point cap', async ({ page }) => {
  await openEditMode(page)

  const subdivide = page.getByTestId('subdivide-region-button')
  const rows = page.getByTestId('region-location-row')

  // Press until the next doubling would exceed regionInfo.maxBoundaryPoints (128).
  let points = FIXTURE_BOUNDARY_POINTS
  while (points * 2 <= 128) {
    await subdivide.click()
    points *= 2
    await expect(rows).toHaveCount(rowsFor(points))
  }

  expect(points).toBe(128)
  await expect(subdivide).toBeDisabled()
  await expect(subdivide).toHaveText('Subdivide (max 128)')
})
