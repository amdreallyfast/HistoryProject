import { test, expect } from '@playwright/test'
import fixtureEvents from './fixtures/events.json' with { type: 'json' }

// On Submit, the event must become the active selection: the details panel shows it and
// its search-result row is highlighted. Crucially this must hold even if the backend
// Create call fails, because selection is driven from the local optimistic event, not the
// network response (the bug behind "UI appeared to load the event but region/image
// missing"). New-event creation needs a globe raycast to place the pin and isn't
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

test('editing and submitting keeps the event selected with its data', async ({ page }) => {
  await page.route('**/api/HistoricalEvent/Create', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
  )
  await page.goto('/')
  await openEditMode(page)

  await page.getByPlaceholder('Title').fill('Edited Selected Title')
  const submit = page.getByTestId('submit-event-button')
  await expect(submit).toBeEnabled()
  await submit.click()

  // Back in display mode, the just-submitted event is the active selection.
  await expect(page.getByTestId('details-event-title')).toHaveText('Edited Selected Title')
  await expect(page.getByTestId('display-event-image')).toBeVisible()
  // Its search-result row is highlighted (bold variant).
  await expect(page.getByTestId('search-result-item')).toHaveClass(/font-bold/)
})

test('selection survives a failed Create (network-independent)', async ({ page }) => {
  // Simulate a network disruption: the Create request fails.
  await page.route('**/api/HistoricalEvent/Create', (route) => route.abort())
  await page.goto('/')
  await openEditMode(page)

  await page.getByPlaceholder('Title').fill('Title Despite Network Failure')
  const submit = page.getByTestId('submit-event-button')
  await expect(submit).toBeEnabled()
  await submit.click()

  // Even though the backend call failed, the event is still selected and shows its data
  // (region/image) from the local optimistic event.
  await expect(page.getByTestId('details-event-title')).toHaveText('Title Despite Network Failure')
  await expect(page.getByTestId('display-event-image')).toBeVisible()
})
