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
  expect(posted.EventImage).toBeUndefined()
})

// Revision history entries carry no image bytes, only EventImage.Id; the image is fetched by Id
// (GetImage, raw bytes) when shown, and revisions sharing an image share one download.
const pngBuffer = Buffer.from(imageBytes, 'base64')

test('revisions without bytes fetch their image by Id, once per shared image', async ({ page }) => {
  // Search results still carry the latest image inline; the revision list doesn't.
  const latestInSearch = rev(2, 'Second', imageBytes)
  const revisions = [rev(2, 'Second', ''), rev(1, 'First', '')]
  let imageFetches = 0
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([latestInSearch]) })
  )
  await page.route('**/api/HistoricalEvent/GetAllRevisions/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(revisions) })
  )
  await page.route('**/api/HistoricalEvent/GetImage/img-shared', (route) => {
    imageFetches++
    return route.fulfill({ status: 200, contentType: 'image/png', body: pngBuffer })
  })

  await page.goto('/')
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()
  await expect(page.getByTestId('display-event-image')).toHaveAttribute('src', /^data:image\/png;base64,/)

  await page.getByTestId('revision-row').filter({ hasText: 'Rev 1' }).click()
  await expect(page.getByTestId('details-event-title')).toHaveText('First')
  await expect(page.getByTestId('display-event-image')).toHaveAttribute('src', `data:image/png;base64,${imageBytes}`)

  await page.getByTestId('revision-row').filter({ hasText: 'Rev 2' }).click()
  await expect(page.getByTestId('details-event-title')).toHaveText('Second')
  await expect(page.getByTestId('display-event-image')).toBeVisible()

  // Editing an old revision previews its (fetched) image.
  await page.getByTestId('revision-row').filter({ hasText: 'Rev 1' }).click()
  await page.getByTestId('edit-event-button').click()
  await expect(page.getByTestId('edit-image-preview')).toHaveAttribute('src', `data:image/png;base64,${imageBytes}`)

  expect(imageFetches).toBe(1)
})

test('after submitting a new image, the new revision shows it without downloading it back', async ({ page }) => {
  const latest = rev(1, 'Original title', '')
  let imageFetches = 0
  let created = false
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([latest]) })
  )
  await page.route('**/api/HistoricalEvent/GetAllRevisions/**', (route) => {
    const newRev = { ...rev(2, 'With new image', ''), EventImage: { Id: 'img-new', ImageBinary: '' } }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(created ? [newRev, latest] : [latest]) })
  })
  await page.route('**/api/HistoricalEvent/GetImage/**', (route) => {
    imageFetches++
    return route.fulfill({ status: 204 })
  })
  await page.route('**/api/HistoricalEvent/Create', (route) => {
    created = true
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ Id: 'r2', EventId: latest.EventId, Revision: 2, EventImageId: 'img-new' }) })
  })

  await page.goto('/')
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()
  await page.getByTestId('edit-event-button').click()
  const fetchesBeforeUpload = imageFetches
  await page.getByTestId('image-upload-input').setInputFiles('tests/fixtures/images/colloseumStockPhoto.png')
  await expect(page.getByTestId('edit-image-preview')).toBeVisible()
  await page.getByPlaceholder('Title').fill('With new image')
  await page.getByTestId('submit-event-button').click()

  await expect(page.getByTestId('details-event-title')).toHaveText('With new image')
  await expect(page.getByTestId('display-event-image')).toHaveAttribute('src', /^data:image\/png;base64,/)
  expect(imageFetches).toBe(fetchesBeforeUpload)
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
