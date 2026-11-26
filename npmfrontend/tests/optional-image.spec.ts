import { test, expect } from '@playwright/test'
import fixtureEvents from './fixtures/events.json' with { type: 'json' }

// No image is EventImage: null from the backend and no EventImage in a Create payload
// (claudePlans/9), not an empty-bytes wrapper.

const imageless = {
  ...structuredClone(fixtureEvents[0]),
  Id: '00000000-0000-0000-0000-0000000000a1',
  Title: 'Imageless event',
  EventImage: null,
}

test('an event with EventImage null shows "No image" and edits without an EventImage', async ({ page }) => {
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([imageless]) })
  )
  await page.route('**/api/HistoricalEvent/GetAllRevisions/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([imageless]) })
  )
  let imageRequests = 0
  await page.route('**/api/HistoricalEvent/GetImage/**', (route) => {
    imageRequests++
    return route.fulfill({ status: 404 })
  })
  let posted: any = null
  await page.route('**/api/HistoricalEvent/Create', async (route) => {
    posted = route.request().postDataJSON()
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ Id: 'x', EventImageId: null }) })
  })
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(err.message))

  await page.goto('/')
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()
  await expect(page.getByText('No image')).toBeVisible()

  await page.getByTestId('edit-event-button').click()
  await page.getByPlaceholder('Title').fill('Imageless, edited')
  await page.getByTestId('submit-event-button').click()

  await expect.poll(() => posted).not.toBeNull()
  expect(posted.Title).toBe('Imageless, edited')
  expect(posted).not.toHaveProperty('EventImage')
  expect(posted).not.toHaveProperty('ExistingImageId')
  expect(imageRequests).toBe(0)
  expect(pageErrors).toEqual([])
})
