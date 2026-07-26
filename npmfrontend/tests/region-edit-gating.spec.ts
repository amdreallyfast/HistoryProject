import { test, expect, Page } from '@playwright/test'
import gatingEvents from './fixtures/events-region-gating.json' with { type: 'json' }

// End-to-end edit-mode assertion for the region validity gate. The Submit button
// follows `regionValid`, which EditRegionMesh publishes from TRIANGULATION success
// (not the winding heuristic). Fixture has three regions:
//   - valid small  -> Submit enables after an edit (control)
//   - clockwise    -> Submit stays disabled even after an edit (untriangulatable)
//   - large valid  -> Submit enables after an edit; the OLD winding pre-gate mis-signed
//                     this huge-but-valid region as clockwise and wrongly blocked it,
//                     so this case is the real bug-3 regression (fails pre-fix).
test.beforeEach(async ({ page }) => {
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(gatingEvents),
    })
  )
  await page.goto('/')
  await page.getByTestId('search-button').click()
  await expect(page.getByTestId('search-result-item')).toHaveCount(gatingEvents.length)
})

async function openEditFor(page: Page, title: string) {
  await page.getByTestId('search-result-item').filter({ hasText: title }).click()
  await page.getByTestId('edit-event-button').click()
  await expect(page.getByTestId('edit-event-title-input')).toBeVisible()
}

test('valid small region enables Submit after an edit', async ({ page }) => {
  await openEditFor(page, 'Valid Small Region')
  const submit = page.getByTestId('submit-event-button')

  // No changes yet => Submit disabled (hasChanges gate).
  await expect(submit).toBeDisabled()

  // Make a real change; the valid region keeps regionValid true, so Submit enables.
  await page.getByTestId('edit-event-title-input').fill('Valid Small Region edited')
  await expect(submit).toBeEnabled()
})

test('clockwise region keeps Submit disabled even after an edit', async ({ page }) => {
  await openEditFor(page, 'Clockwise Region')
  const submit = page.getByTestId('submit-event-button')

  await expect(submit).toBeDisabled()

  // Even with a real change, the untriangulatable (clockwise) region blocks Submit
  // because regionValid is false.
  await page.getByTestId('edit-event-title-input').fill('Clockwise Region edited')
  await expect(submit).toBeDisabled()
})

test('large valid region enables Submit after an edit (bug 3: no winding pre-gate)', async ({ page }) => {
  await openEditFor(page, 'Large Valid Region')
  const submit = page.getByTestId('submit-event-button')

  await expect(submit).toBeDisabled()

  // The old pre-gate on regionWindingSign would mis-classify this large-but-valid
  // region as clockwise, leaving regionValid false and Submit disabled. Triangulation
  // succeeds, so with the pre-gate gone Submit must enable after an edit.
  await page.getByTestId('edit-event-title-input').fill('Large Valid Region edited')
  await expect(submit).toBeEnabled()
})
