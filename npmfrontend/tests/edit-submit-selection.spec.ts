import { test, expect } from '@playwright/test'
import fixtureEvents from './fixtures/events.json' with { type: 'json' }

// Submit is confirm-before-commit: while Create is in flight a scrim ("Submitting...")
// covers the edit panel; only on success does the event get appended/selected and the
// panel close. A failure keeps the panel open with an inline error and commits nothing
// (no phantom event). New-event creation needs a globe raycast to place the pin and isn't
// headlessly drivable, so these specs exercise the edit path (selection logic is shared).

test.beforeEach(async ({ page }) => {
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtureEvents) })
  )
  await page.route('**/api/HistoricalEvent/GetAllRevisions/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtureEvents) })
  )
})

async function openEditMode(page) {
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()
  await page.getByTestId('edit-event-button').click()
  await expect(page.getByPlaceholder('Title')).toBeVisible()
}

test('entering edit mode pre-fills the summary textarea', async ({ page }) => {
  await page.goto('/')
  await openEditMode(page)

  // The fixture event's Summary must populate the (uncontrolled) textarea on load.
  // Regression guard: it was set via .innerHTML, which leaves a <textarea> blank.
  await expect(page.getByPlaceholder(/^Summary/)).toHaveValue('A fixture event for Playwright tests.')
})

test('successful submit shows the overlay, then the new revision in place (instant history)', async ({ page }) => {
  // Delay the Create response so the pending overlay is observable.
  await page.route('**/api/HistoricalEvent/Create', async (route) => {
    await new Promise((r) => setTimeout(r, 700))
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
  })
  // After Create, the success path re-fetches GetAllRevisions authoritatively. Return two
  // revisions (the original + the edited Rev 2) so we can assert the in-place update and
  // that the revision-history list is correct immediately (seeded from this same fetch).
  const revTwo = { ...fixtureEvents[0], Revision: 2, Title: 'Edited Selected Title', RevisionDateTime: '2026-06-29T10:00:00Z' }
  await page.route('**/api/HistoricalEvent/GetAllRevisions/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([fixtureEvents[0], revTwo]) })
  )
  await page.goto('/')
  await openEditMode(page)

  await page.getByPlaceholder('Title').fill('Edited Selected Title')
  const submit = page.getByTestId('submit-event-button')
  await expect(submit).toBeEnabled()
  await submit.click()

  // While the request is in flight the panel stays open under the scrim.
  await expect(page.getByTestId('submit-overlay')).toBeVisible()

  // After it resolves: edit mode exits, the overlay is gone, and the authoritative latest
  // revision is the active selection (details panel shows its title, image renders, search
  // row highlighted).
  await expect(page.getByTestId('details-event-title')).toHaveText('Edited Selected Title')
  await expect(page.getByTestId('submit-overlay')).toHaveCount(0)
  await expect(page.getByTestId('display-event-image')).toBeVisible()
  await expect(page.getByTestId('search-result-item')).toHaveClass(/font-bold/)

  // The revision-history list shows BOTH revisions immediately (no separate refetch wait),
  // with the new Rev 2 highlighted as the current revision.
  await expect(page.getByTestId('revision-row')).toHaveCount(2)
  await expect(page.getByTestId('revision-row').filter({ hasText: 'Rev 2' })).toHaveClass(/bg-gray-600/)
})

test('a failed Create keeps the edit panel open with an error and commits nothing', async ({ page }) => {
  await page.route('**/api/HistoricalEvent/Create', (route) =>
    route.fulfill({ status: 500, contentType: 'text/plain', body: 'Server error' })
  )
  await page.goto('/')
  await openEditMode(page)

  await page.getByPlaceholder('Title').fill('Title That Fails To Save')
  const submit = page.getByTestId('submit-event-button')
  await expect(submit).toBeEnabled()
  await submit.click()

  // Panel stays open (Title input still visible), the scrim is cleared, and the backend
  // reason is surfaced inline.
  await expect(page.getByTestId('submit-error')).toBeVisible()
  await expect(page.getByTestId('submit-error')).toContainText('500')
  await expect(page.getByPlaceholder('Title')).toBeVisible()
  await expect(page.getByTestId('submit-overlay')).toHaveCount(0)
  // Nothing was appended/selected → no phantom entry in the search list.
  await expect(page.getByTestId('search-result-item')).toHaveCount(1)
})
