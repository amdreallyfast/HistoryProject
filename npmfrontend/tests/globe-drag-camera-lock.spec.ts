import { test, expect, Page } from '@playwright/test'
import fixtureEvents from './fixtures/events.json' with { type: 'json' }

// In edit mode, a press that starts on an editable pin or the editable region freezes the
// camera until release (CameraDragLock), so dragging them never also rotates the globe.
// Everything else (empty globe, display mode) still rotates the camera as before.
//
// These tests aim at meshes in the 3D scene through window.__globeTest (GlobeTestHook,
// non-production builds only). The fixture event sits around Rome, which faces the camera
// at startup, so its pins and region are visible without rotating first.

type XY = { x: number; y: number }
type XYZ = { x: number; y: number; z: number }

declare global {
  interface Window {
    __globeTest?: {
      cameraPosition(): XYZ
      pinClientXY(locationId: string): XY | null
      latLongClientXY(lat: number, long: number): XY | null
    }
  }
}

// MouseHandler only starts a drag after the button has been held this long.
const DRAG_START_DELAY_MS = 300

// The shared fixture's region is 1°×1° with the primary pin almost on top of a boundary pin,
// so on screen the pins overlap and a press can grab the wrong one. Use a larger region here
// with every pin well apart, and the primary pin outside the region so the region's center
// is clear to press. Boundary order stays counterclockwise (see CLAUDE.md, Testing).
const events = structuredClone(fixtureEvents)
events[0].SpecificLocation = { Latitude: 33, Longitude: -5 }
events[0].Region = [
  { Latitude: 30, Longitude: 0, OrderIndex: 0 },
  { Latitude: 30, Longitude: 25, OrderIndex: 1 },
  { Latitude: 50, Longitude: 25, OrderIndex: 2 },
  { Latitude: 50, Longitude: 0, OrderIndex: 3 },
]

test.beforeEach(async ({ page }) => {
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(events) })
  )
  await page.route('**/api/HistoricalEvent/GetAllRevisions/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(events) })
  )
  await page.goto('/')
  await page.waitForFunction(() => window.__globeTest !== undefined)
})

async function openEditMode(page: Page) {
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()
  await page.getByTestId('edit-event-button').click()
  await expect(page.getByPlaceholder('Title')).toBeVisible()
}

const cameraPosition = (page: Page) => page.evaluate(() => window.__globeTest!.cameraPosition())

const distance = (a: XYZ, b: XYZ) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

// Press at `from`, hold past the drag threshold, move to `from + delta`, release.
async function drag(page: Page, from: XY, delta: XY) {
  await page.mouse.move(from.x, from.y)
  // Let the per-frame raycast register what's under the cursor before pressing.
  await page.waitForTimeout(150)
  await page.mouse.down()
  await page.waitForTimeout(DRAG_START_DELAY_MS)
  await page.mouse.move(from.x + delta.x, from.y + delta.y, { steps: 15 })
  await page.waitForTimeout(100)
  await page.mouse.up()
  await page.waitForTimeout(100)
}

async function canvasCenter(page: Page): Promise<XY> {
  const box = (await page.locator('canvas').boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

async function boundaryRowIds(page: Page): Promise<string[]> {
  // Row 0 is the primary location; the rest are region boundary points.
  const ids = await page.getByTestId('region-location-row').evaluateAll((rows) => rows.map((r) => r.id))
  return ids.slice(1)
}

async function rowTexts(page: Page): Promise<string[]> {
  return page.getByTestId('region-location-row').allTextContents()
}

test('dragging a pin moves the pin but not the camera, even with focus elsewhere', async ({ page }) => {
  await openEditMode(page)
  // Focus somewhere other than the canvas first (the original Ctrl bug's trigger).
  await page.getByPlaceholder('Title').click()

  // The (30, 25) corner: farthest from the primary pin.
  const pinId = (await boundaryRowIds(page))[1]
  const pin = await page.evaluate((id) => window.__globeTest!.pinClientXY(id), pinId)
  expect(pin).not.toBeNull()

  const before = await cameraPosition(page)
  const rowBefore = await page.locator(`[id="${pinId}"]`).textContent()

  await drag(page, pin!, { x: 60, y: 40 })

  expect(distance(await cameraPosition(page), before)).toBeLessThan(1e-6)
  await expect(page.locator(`[id="${pinId}"]`)).not.toHaveText(rowBefore!)
})

test('dragging the region moves the region but not the camera', async ({ page }) => {
  await openEditMode(page)

  // Middle of the test region (lat 30-50, long 0-25).
  const region = await page.evaluate(() => window.__globeTest!.latLongClientXY(40, 12.5))
  expect(region).not.toBeNull()

  const before = await cameraPosition(page)
  const rowsBefore = await rowTexts(page)

  await drag(page, region!, { x: 50, y: 30 })

  expect(distance(await cameraPosition(page), before)).toBeLessThan(1e-6)
  // Every boundary point moved with the region.
  const rowsAfter = await rowTexts(page)
  for (let i = 1; i < rowsBefore.length; i++) {
    expect(rowsAfter[i]).not.toBe(rowsBefore[i])
  }
})

test('in edit mode, dragging empty globe still rotates the camera', async ({ page }) => {
  await openEditMode(page)

  const before = await cameraPosition(page)
  // Canvas center is lat 0 / long 0: open ocean, far from the fixture region.
  await drag(page, await canvasCenter(page), { x: 80, y: 0 })

  expect(distance(await cameraPosition(page), before)).toBeGreaterThan(0.1)

  // And the lock was released: a second drag rotates again.
  const mid = await cameraPosition(page)
  await drag(page, await canvasCenter(page), { x: -80, y: 0 })
  expect(distance(await cameraPosition(page), mid)).toBeGreaterThan(0.1)
})

test('after dragging a pin, dragging empty globe rotates the camera again', async ({ page }) => {
  await openEditMode(page)

  const pinId = (await boundaryRowIds(page))[1]
  const pin = await page.evaluate((id) => window.__globeTest!.pinClientXY(id), pinId)
  await drag(page, pin!, { x: 40, y: 20 })

  const before = await cameraPosition(page)
  await drag(page, await canvasCenter(page), { x: 80, y: 0 })
  expect(distance(await cameraPosition(page), before)).toBeGreaterThan(0.1)
})

test('in display mode, dragging over an event region still rotates the camera', async ({ page }) => {
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()

  // Not in edit mode, so the lock must not apply even when the press lands on the event's
  // displayed region. Aim at the region's middle.
  const region = await page.evaluate(() => window.__globeTest!.latLongClientXY(40, 12.5))
  const before = await cameraPosition(page)
  await drag(page, region!, { x: 0, y: 80 })
  expect(distance(await cameraPosition(page), before)).toBeGreaterThan(0.1)
})

// Fast presses: press in the same instant the cursor arrives, with no time for the per-frame
// hover raycast to catch up. Before press-time raycasting (cursorRaycast.js), these used the
// previous position's result: a press that had just left the region still dragged the region,
// and a press that had just arrived on it rotated the camera instead.

async function fastDrag(page: Page, from: XY, to: XY, delta: XY) {
  // Settle on `from` so the per-frame result describes it...
  await page.mouse.move(from.x, from.y)
  await page.waitForTimeout(150)
  // ...then jump to `to` and press immediately.
  await page.mouse.move(to.x, to.y)
  await page.mouse.down()
  await page.waitForTimeout(DRAG_START_DELAY_MS)
  await page.mouse.move(to.x + delta.x, to.y + delta.y, { steps: 15 })
  await page.waitForTimeout(100)
  await page.mouse.up()
  await page.waitForTimeout(100)
}

test('pressing the instant the cursor reaches the region drags the region, not the camera', async ({ page }) => {
  await openEditMode(page)

  const region = await page.evaluate(() => window.__globeTest!.latLongClientXY(40, 12.5))
  const before = await cameraPosition(page)
  const rowsBefore = await rowTexts(page)

  await fastDrag(page, await canvasCenter(page), region!, { x: 50, y: 30 })

  expect(distance(await cameraPosition(page), before)).toBeLessThan(1e-6)
  const rowsAfter = await rowTexts(page)
  for (let i = 1; i < rowsBefore.length; i++) {
    expect(rowsAfter[i]).not.toBe(rowsBefore[i])
  }
})

test('pressing the instant the cursor leaves the region rotates the camera, not the region', async ({ page }) => {
  await openEditMode(page)

  const region = await page.evaluate(() => window.__globeTest!.latLongClientXY(40, 12.5))
  const before = await cameraPosition(page)
  const rowsBefore = await rowTexts(page)

  await fastDrag(page, region!, await canvasCenter(page), { x: 80, y: 0 })

  expect(distance(await cameraPosition(page), before)).toBeGreaterThan(0.1)
  expect(await rowTexts(page)).toEqual(rowsBefore)
})

// Display mode uses the same press-time raycast to pick which event a click selects.
test('clicking an event on the globe selects it; clicking empty globe deselects', async ({ page }) => {
  await page.getByTestId('search-button').click()
  await expect(page.getByTestId('search-result-item').first()).toBeVisible()
  await expect(page.getByText('No event selected')).toBeVisible()

  const region = await page.evaluate(() => window.__globeTest!.latLongClientXY(40, 12.5))
  // Arrive and click in the same instant (no time for the per-frame hover raycast).
  await page.mouse.move((await canvasCenter(page)).x, (await canvasCenter(page)).y)
  await page.waitForTimeout(150)
  await page.mouse.click(region!.x, region!.y)
  await expect(page.getByTestId('edit-event-button')).toBeVisible()

  const center = await canvasCenter(page)
  await page.mouse.click(center.x, center.y)
  await expect(page.getByText('No event selected')).toBeVisible()
})
