import { test, expect, Page } from '@playwright/test'
import gatingEvents from './fixtures/events-region-gating.json' with { type: 'json' }

// Search results are ordered by title.
//
// Before this, nothing sorted them, so they rendered in whatever order `allEvents` held —
// and that order changes on edit: `upsertEventRevisions` rebuilds the array as
// `[...others, ...revisions]`, which moves the event you just submitted to the BOTTOM of the
// list. Editing an event made it appear to jump away from where you were working.
//
// The fixture is deliberately stored in an order that is NOT title order, so a passing
// assertion means sorting actually happened rather than the input looking already-sorted.
const FIXTURE_ORDER = gatingEvents.map(e => e.Title)
const TITLE_ORDER = [...FIXTURE_ORDER].sort((a, b) => a.localeCompare(b))

test.beforeEach(async ({ page }) => {
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(gatingEvents) })
  )
})

async function search(page: Page) {
  await page.goto('/')
  await page.getByTestId('search-button').click()
  await expect(page.getByTestId('search-result-item')).toHaveCount(gatingEvents.length)
}

test('results are listed in title order, not fixture order', async ({ page }) => {
  await search(page)

  expect(TITLE_ORDER).not.toEqual(FIXTURE_ORDER)   // guards the premise of this test
  await expect(page.getByTestId('search-result-item')).toHaveText(TITLE_ORDER)
})

test('an edited event sorts to its new title instead of jumping to the bottom', async ({ page }) => {
  // "Valid Small Region" sorts LAST of the three. Rename it to something that sorts FIRST:
  // if the list were still ordered by edit history it would end up at the bottom, which is
  // the exact behaviour this fixes.
  const target = gatingEvents.find(e => e.Title === 'Valid Small Region')!
  const renamed = { ...target, Revision: 2, Title: 'Aaa Renamed First' }

  await page.route('**/api/HistoricalEvent/Create', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
  )
  // The success path re-fetches GetAllRevisions authoritatively; return both revisions.
  await page.route('**/api/HistoricalEvent/GetAllRevisions/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([target, renamed]) })
  )

  await search(page)
  await page.getByTestId('search-result-item').filter({ hasText: 'Valid Small Region' }).click()
  await page.getByTestId('edit-event-button').click()
  await page.getByPlaceholder('Title').fill('Aaa Renamed First')

  const submit = page.getByTestId('submit-event-button')
  await expect(submit).toBeEnabled()
  await submit.click()

  await expect(page.getByTestId('details-event-title')).toHaveText('Aaa Renamed First')

  // Sorted by the NEW title, so it moves from last to first.
  const expected = ['Aaa Renamed First', 'Clockwise Region', 'Large Valid Region']
  await expect(page.getByTestId('search-result-item')).toHaveText(expected)

  // ...and it is still the selected row. Highlighting is keyed on eventId rather than list
  // position, so moving does not lose the selection.
  await expect(page.getByTestId('search-result-item').first()).toHaveClass(/font-bold/)
})
