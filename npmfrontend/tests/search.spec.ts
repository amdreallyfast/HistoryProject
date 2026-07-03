import { test, expect } from '@playwright/test'
import fixtureEvents from './fixtures/events.json' with { type: 'json' }

// The search flow's only backend call is GET .../api/HistoricalEvent/GetFirst100
// (src/api/historyEventApi.js -> getFirst100). Intercept it at the network layer
// so neither the WebAPI nor a database needs to run.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixtureEvents),
    })
  )
  await page.goto('/')
})

test('search form is visible on load', async ({ page }) => {
  await expect(page.getByTestId('search-input')).toBeVisible()
  await expect(page.getByTestId('search-button')).toBeVisible()
})

test('clicking Search returns results', async ({ page }) => {
  await page.getByTestId('search-button').click()
  await expect(page.getByTestId('search-result-item').first()).toBeVisible()
})

test('empty search still loads results without crashing', async ({ page }) => {
  // The current implementation ignores the text box and always loads GetFirst100,
  // so an empty search should surface results rather than error out.
  await page.getByTestId('search-button').click()
  await expect(page.getByTestId('search-result-item')).toHaveCount(fixtureEvents.length)
})

test('result items show the event title', async ({ page }) => {
  await page.getByTestId('search-button').click()
  await expect(page.getByTestId('search-result-item').first()).toHaveText('Test Event One')
})

test('clicking a result shows the event in the details panel', async ({ page }) => {
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()
  await expect(page.getByTestId('details-event-title')).toHaveText('Test Event One')
})
