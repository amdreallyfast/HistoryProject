import { test, expect } from '@playwright/test'
import fixtureEvents from './fixtures/events.json' with { type: 'json' }

// Image sharing (claudePlans/8): revisions share an unchanged image.
//  - Submitting an edit that keeps the image sends a reference (ExistingImageId), not the bytes.
//  - GetAllRevisions sends a shared image's bytes once (newest revision); older revisions with
//    the same EventImage.Id are filled in on the client and still show the image.

const base = fixtureEvents[0]
const imageBytes = base.EventImage.ImageBinary
const rev = (revision: number, title: string, bytes: string) => ({
  ...structuredClone(base),
  Id: `00000000-0000-0000-0000-00000000000${revision}`,
  Revision: revision,
  Title: title,
  EventImage: { Id: 'img-shared', ImageBinary: bytes },
})

test('editing only the title sends the image by reference, not its bytes', async ({ page }) => {
  const latest = rev(1, 'Original title', imageBytes)
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([latest]) })
  )
  await page.route('**/api/HistoricalEvent/GetAllRevisions/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([latest]) })
  )
  let posted: any = null
  await page.route('**/api/HistoricalEvent/Create', async (route) => {
    posted = route.request().postDataJSON()
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ Id: 'x' }) })
  })

  await page.goto('/')
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()
  await page.getByTestId('edit-event-button').click()
  await page.getByPlaceholder('Title').fill('Edited title')
  await page.getByTestId('submit-event-button').click()

  await expect.poll(() => posted).not.toBeNull()
  expect(posted.ExistingImageId).toBe('img-shared')
  expect(posted.EventImage.ImageBinary).toBe('')
})

test('an older revision that shares the image still shows it', async ({ page }) => {
  // Newest first, as the backend returns them. Only the newest carries the bytes.
  const revisions = [rev(2, 'Second', imageBytes), rev(1, 'First', '')]
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([revisions[0]]) })
  )
  await page.route('**/api/HistoricalEvent/GetAllRevisions/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(revisions) })
  )

  await page.goto('/')
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()
  await page.getByTestId('revision-row').filter({ hasText: 'Rev 1' }).click()

  await expect(page.getByTestId('details-event-title')).toHaveText('First')
  await expect(page.getByTestId('display-event-image')).toHaveAttribute('src', /^data:image\/png;base64,/)
})

// Revision history used React Query defaults, refetching on every window focus; the HAR capture
// showed 4 extra 35-51 s reloads (11.7 MB each) after one submit. Revisions only change when
// someone submits, and a submit refreshes them itself.
async function simulateWindowRefocus(page) {
  await page.evaluate(() => {
    const set = (v: string) => Object.defineProperty(document, 'visibilityState', { value: v, configurable: true })
    set('hidden'); document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
    set('visible'); document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
    window.dispatchEvent(new Event('focus'))
  })
}

test('revision history is not refetched when the window regains focus, or right after a submit', async ({ page }) => {
  const latest = rev(1, 'Original title', imageBytes)
  let revisionFetches = 0
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([latest]) })
  )
  await page.route('**/api/HistoricalEvent/GetAllRevisions/**', (route) => {
    revisionFetches++
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([latest]) })
  })
  await page.route('**/api/HistoricalEvent/Create', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ Id: 'x' }) })
  )

  await page.goto('/')
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()
  await expect(page.getByTestId('revision-row')).toHaveCount(1)
  expect(revisionFetches).toBe(1)

  await simulateWindowRefocus(page)
  await page.waitForTimeout(500)
  expect(revisionFetches).toBe(1)

  // Submit: EditEvent fetches the revisions once to confirm; the list shouldn't fetch again.
  await page.getByTestId('edit-event-button').click()
  await page.getByPlaceholder('Title').fill('Edited title')
  await page.getByTestId('submit-event-button').click()
  await expect(page.getByTestId('revision-row')).toHaveCount(1)
  await page.waitForTimeout(500)
  expect(revisionFetches).toBe(2)
})
