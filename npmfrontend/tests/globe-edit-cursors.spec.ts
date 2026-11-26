import { test, expect, Page } from '@playwright/test'
import fixtureEvents from './fixtures/events.json' with { type: 'json' }

// Edit-mode hover cursors (TODO "Globe: edit-mode hover cursors for region and pins"):
//  region: hollow four-way arrows on hover, solid while pressed/dragging (custom SVG cursors)
//  pin:    grab on hover, grabbing while pressed/dragging
//  elsewhere, and in display mode: the default cursor
// Uses its own event with well-separated pins (see DESIGN.md "3D canvas interactions").

type XY = { x: number; y: number }
declare global {
  interface Window {
    __globeTest?: { pinClientXY(id: string): XY | null; latLongClientXY(lat: number, long: number): XY | null }
  }
}

const events = structuredClone(fixtureEvents)
events[0].SpecificLocation = { Latitude: 33, Longitude: -5 }
events[0].Region = [
  { Latitude: 30, Longitude: 0, OrderIndex: 0 },
  { Latitude: 30, Longitude: 25, OrderIndex: 1 },
  { Latitude: 50, Longitude: 25, OrderIndex: 2 },
  { Latitude: 50, Longitude: 0, OrderIndex: 3 },
]

const cursor = (page: Page) => page.locator('canvas').evaluate((c) => (c as HTMLCanvasElement).style.cursor)
// The SVG is URL-encoded in the cursor value: hollow = white fill, solid = black fill.
const HOLLOW_ARROWS = /^url\("data:image\/svg\+xml,.*fill%3D%22%23ffffff%22.*\) 12 12, move$/
const SOLID_ARROWS = /^url\("data:image\/svg\+xml,.*fill%3D%22%23000000%22.*\) 12 12, move$/

async function hover(page: Page, at: XY) {
  await page.mouse.move(at.x, at.y)
  await page.waitForTimeout(150) // let the per-frame hover raycast run
}

async function canvasCenter(page: Page): Promise<XY> {
  const box = (await page.locator('canvas').boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test.beforeEach(async ({ page }) => {
  for (const path of ['GetFirst100', 'GetAllRevisions/**']) {
    await page.route(`**/api/HistoricalEvent/${path}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(events) })
    )
  }
  await page.goto('/')
  await page.waitForFunction(() => window.__globeTest !== undefined)
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()
})

test('display mode keeps the default cursor, even over the region', async ({ page }) => {
  await hover(page, (await page.evaluate(() => window.__globeTest!.latLongClientXY(40, 12.5)))!)
  expect(await cursor(page)).toBe('')
})

test.describe('edit mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.getByTestId('edit-event-button').click()
    await expect(page.getByPlaceholder('Title')).toBeVisible()
  })

  test('region: hollow arrows on hover, solid while pressed, hollow again after release', async ({ page }) => {
    const region = (await page.evaluate(() => window.__globeTest!.latLongClientXY(40, 12.5)))!
    await hover(page, region)
    expect(await cursor(page)).toMatch(HOLLOW_ARROWS)

    await page.mouse.down()
    await expect.poll(() => cursor(page)).toMatch(SOLID_ARROWS)
    await page.mouse.up()
    await expect.poll(() => cursor(page)).toMatch(HOLLOW_ARROWS)
  })

  test('pin: grab on hover, grabbing while pressed', async ({ page }) => {
    const pinId = await page.getByTestId('region-location-row').nth(2).getAttribute('id') // the (30, 25) corner
    const pin = (await page.evaluate((id) => window.__globeTest!.pinClientXY(id!), pinId))!
    await hover(page, pin)
    expect(await cursor(page)).toBe('grab')

    await page.mouse.down()
    await expect.poll(() => cursor(page)).toBe('grabbing')
    await page.mouse.up()
    await expect.poll(() => cursor(page)).toBe('grab')
  })

  test('empty globe: default cursor, also while dragging to rotate', async ({ page }) => {
    const c = await canvasCenter(page)
    await hover(page, c)
    expect(await cursor(page)).toBe('')
    await page.mouse.down()
    await page.mouse.move(c.x + 40, c.y, { steps: 5 })
    expect(await cursor(page)).toBe('')
    await page.mouse.up()
  })

  test('leaving edit mode restores the default cursor', async ({ page }) => {
    await hover(page, (await page.evaluate(() => window.__globeTest!.latLongClientXY(40, 12.5)))!)
    expect(await cursor(page)).toMatch(HOLLOW_ARROWS)
    await page.getByRole('button', { name: /cancel/i }).click()
    await expect.poll(() => cursor(page)).toBe('')
  })
})
