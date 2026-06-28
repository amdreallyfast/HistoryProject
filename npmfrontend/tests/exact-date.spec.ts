import { test, expect } from '@playwright/test'
import fixtureEvents from './fixtures/events.json' with { type: 'json' }

// "Exact date" mode stores a single point in time via the begin==end proxy (no boolean
// column): the editors mirror the earliest bound into the latest bound so the persisted
// event/source has LB==UB. These specs drive that round trip end-to-end against mocked
// API calls. Each test mocks GetFirst100 with a single tailored event so `.first()`
// always selects it.

// A genuine range: earliest 100/1/1 .. latest 200/12/31.
const rangeEvent = () => structuredClone(fixtureEvents[0])

// A single exact point: year 603 only (month/day unknown) with begin==end.
function exactEvent() {
  const e = structuredClone(fixtureEvents[0])
  e.LBYear = 603; e.LBMonth = null; e.LBDay = null
  e.UBYear = 603; e.UBMonth = null; e.UBDay = null
  return e
}

// Exact event that also carries a source with an exact publication date (700 == 700).
function exactEventWithSource() {
  const e = exactEvent()
  e.Sources = [{
    Title: 'Exact Source',
    ISBN: null,
    Where: null,
    PublicationLBYear: 700, PublicationLBMonth: null, PublicationLBDay: null,
    PublicationUBYear: 700, PublicationUBMonth: null, PublicationUBDay: null,
    Authors: [],
  }]
  return e
}

function mockGetFirst100(page, events) {
  return page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(events) })
  )
}

async function selectEvent(page) {
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()
}

async function openEditMode(page) {
  await selectEvent(page)
  await page.getByTestId('edit-event-button').click()
  await expect(page.getByTestId('event-exact-date-checkbox')).toBeVisible()
}

test('event time opens in range mode when begin != end', async ({ page }) => {
  await mockGetFirst100(page, [rangeEvent()])
  await page.goto('/')
  await openEditMode(page)

  await expect(page.getByTestId('event-exact-date-checkbox')).not.toBeChecked()
  await expect(page.getByTestId('event-latest-subsection')).toBeVisible()
})

test('event time opens in exact mode when begin == end', async ({ page }) => {
  await mockGetFirst100(page, [exactEvent()])
  await page.goto('/')
  await openEditMode(page)

  await expect(page.getByTestId('event-exact-date-checkbox')).toBeChecked()
  await expect(page.getByTestId('event-latest-subsection')).toHaveCount(0)
})

test('display shows an exact date plainly, with no "(exact)" suffix', async ({ page }) => {
  await mockGetFirst100(page, [exactEvent()])
  await page.goto('/')
  await selectEvent(page)

  // exactEvent is year 603 only → "603 AD", shown as-is with no "(exact)" label.
  await expect(page.getByText('603 AD')).toBeVisible()
  await expect(page.getByText('(exact)')).toHaveCount(0)
})

test('checking "Exact date" persists begin==end on submit (year-only partial date)', async ({ page }) => {
  let createBody: any = null
  await page.route('**/api/HistoricalEvent/Create', async (route) => {
    createBody = route.request().postDataJSON()
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
  })
  await mockGetFirst100(page, [rangeEvent()])
  await page.goto('/')
  await openEditMode(page)

  // Switch to exact mode; the latest inputs disappear, leaving the earliest row unique.
  await page.getByTestId('event-exact-date-checkbox').check()
  await expect(page.getByTestId('event-latest-subsection')).toHaveCount(0)

  // Enter a year only and clear month/day — required fields unchanged, this must submit.
  await page.getByPlaceholder('YYYY (ex: -500)').fill('603')
  await page.getByPlaceholder('MM (optional)').fill('')
  await page.getByPlaceholder('DD (optional)').fill('')

  const submit = page.getByTestId('submit-event-button')
  await expect(submit).toBeEnabled()
  await submit.click()

  await expect.poll(() => createBody).not.toBeNull()
  // The begin==end proxy: earliest and latest bounds are equal in the posted event.
  expect(createBody.LBYear).toBe(603)
  expect(createBody.UBYear).toBe(603)
  expect(createBody.LBMonth).toBeNull()
  expect(createBody.UBMonth).toBeNull()
  expect(createBody.LBDay).toBeNull()
  expect(createBody.UBDay).toBeNull()
})

test('source publication opens in exact mode when begin == end', async ({ page }) => {
  await mockGetFirst100(page, [exactEventWithSource()])
  await page.goto('/')
  await openEditMode(page)

  await expect(page.getByTestId('source-exact-date-checkbox')).toBeChecked()
  await expect(page.getByTestId('source-latest-subsection')).toHaveCount(0)
})
