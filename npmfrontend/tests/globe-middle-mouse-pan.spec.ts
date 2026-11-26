import { test, expect, Page } from '@playwright/test'
import fixtureEvents from './fixtures/events.json' with { type: 'json' }

// Middle-button drag pans the camera (left/right/up/down); the mouse wheel is the only zoom.
// Previously middle-drag zoomed (three.js OrbitControls default MIDDLE = DOLLY), duplicating
// the wheel. Uses window.__globeTest (GlobeTestHook, non-production builds only).

type XYZ = { x: number; y: number; z: number }

declare global {
  interface Window {
    __globeTest?: {
      cameraPosition(): XYZ
      cameraTarget(): XYZ | null
      pinClientXY(locationId: string): { x: number; y: number } | null
    }
  }
}

const distance = (a: XYZ, b: XYZ) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

async function camera(page: Page) {
  return page.evaluate(() => ({ pos: window.__globeTest!.cameraPosition(), target: window.__globeTest!.cameraTarget()! }))
}

async function canvasCenter(page: Page) {
  const box = (await page.locator('canvas').boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

async function middleDrag(page: Page, from: { x: number; y: number }, delta: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y)
  await page.waitForTimeout(150)
  await page.mouse.down({ button: 'middle' })
  await page.mouse.move(from.x + delta.x, from.y + delta.y, { steps: 15 })
  await page.mouse.up({ button: 'middle' })
  await page.waitForTimeout(150)
}

test.beforeEach(async ({ page }) => {
  for (const path of ['GetFirst100', 'GetAllRevisions/**']) {
    await page.route(`**/api/HistoricalEvent/${path}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtureEvents) })
    )
  }
  await page.goto('/')
  await page.waitForFunction(() => window.__globeTest?.cameraTarget() != null)
})

test('middle-button drag pans: camera and target move together, distance unchanged', async ({ page }) => {
  const before = await camera(page)

  await middleDrag(page, await canvasCenter(page), { x: 120, y: 60 })

  const after = await camera(page)
  expect(distance(after.target, before.target)).toBeGreaterThan(0.1)   // moved sideways
  expect(Math.abs(distance(after.pos, after.target) - distance(before.pos, before.target))).toBeLessThan(1e-3) // not a zoom
})

test('middle-button drag up/down pans too (no longer zooms)', async ({ page }) => {
  const before = await camera(page)

  await middleDrag(page, await canvasCenter(page), { x: 0, y: 120 })

  const after = await camera(page)
  expect(distance(after.target, before.target)).toBeGreaterThan(0.1)
  expect(Math.abs(distance(after.pos, after.target) - distance(before.pos, before.target))).toBeLessThan(1e-3)
})

test('the mouse wheel still zooms', async ({ page }) => {
  const before = await camera(page)
  const c = await canvasCenter(page)
  await page.mouse.move(c.x, c.y)
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(300)

  const after = await camera(page)
  expect(Math.abs(distance(after.pos, after.target) - distance(before.pos, before.target))).toBeGreaterThan(0.1)
})

test('middle-button drag starting on a pin in edit mode pans instead of moving the pin', async ({ page }) => {
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()
  await page.getByTestId('edit-event-button').click()
  await expect(page.getByPlaceholder('Title')).toBeVisible()

  const rows = page.getByTestId('region-location-row')
  const primaryId = await rows.first().getAttribute('id')
  const pin = await page.evaluate((id) => window.__globeTest!.pinClientXY(id!), primaryId)
  const rowsBefore = await rows.allTextContents()
  const before = await camera(page)

  await middleDrag(page, pin!, { x: 80, y: 40 })

  expect(await rows.allTextContents()).toEqual(rowsBefore)
  expect(distance((await camera(page)).target, before.target)).toBeGreaterThan(0.1)
})
