// Visual check: edit-mode cursors over the region and a pin, with REAL mouse input and the OS
// cursor captured. Run: npm run visual:cursors   (output in visual-output/edit-cursors/)
//
// Asserts the cursor the page sets at each step, and saves enlarged captures plus strip.png
// (region hover, region pressed, pin hover, pin pressed, empty globe) to look at.
// Expected look (approved 2026-11-25): hollow four-way arrows, solid four-way arrows, open hand,
// closed hand, normal arrow.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { openSession, FRONTEND_DIR } from '../harness.mjs'

// Same separated-pins event as tests/globe-edit-cursors.spec.ts.
const events = JSON.parse(readFileSync(join(FRONTEND_DIR, 'tests/fixtures/events.json'), 'utf8'))
events[0].SpecificLocation = { Latitude: 33, Longitude: -5 }
events[0].Region = [[30, 0], [30, 25], [50, 25], [50, 0]].map(([la, lo], i) => ({ Latitude: la, Longitude: lo, OrderIndex: i }))

const session = await openSession({
  name: 'edit-cursors',
  mockApi: async (page) => {
    for (const path of ['GetFirst100', 'GetAllRevisions/**']) {
      await page.route(`**/api/HistoricalEvent/${path}`, (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(events) }))
    }
  },
})

const failures = []
try {
  const { page, mouse, capture } = session
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()
  await page.getByTestId('edit-event-button').click()
  await page.getByPlaceholder('Title').waitFor()

  const pageCursor = () => page.locator('canvas').evaluate((c) => {
    const v = c.style.cursor
    return v.startsWith('url(') ? (decodeURIComponent(v).includes('fill="#ffffff"') ? 'hollow arrows' : 'solid arrows') : (v || 'default')
  })
  const shots = []
  async function check(name, expected) {
    const actual = await pageCursor()
    if (actual !== expected) failures.push(`${name}: expected ${expected}, page set ${actual}`)
    shots.push(await capture.aroundPointer(name))
    console.log(`${actual === expected ? 'ok  ' : 'FAIL'} ${name.padEnd(18)} ${actual}`)
  }

  capture.screen('overview')

  const region = await page.evaluate(() => window.__globeTest.latLongClientXY(40, 12.5))
  await mouse.moveTo({ x: region.x - 30, y: region.y }) // approach: the next move is real motion
  await mouse.moveTo(region)
  await check('1-region-hover', 'hollow arrows')
  await mouse.down()
  await check('2-region-pressed', 'solid arrows')
  await mouse.up()

  const pinId = await page.getByTestId('region-location-row').nth(2).getAttribute('id') // (30, 25) corner
  const pin = await page.evaluate((id) => window.__globeTest.pinClientXY(id), pinId)
  await mouse.moveTo({ x: pin.x + 30, y: pin.y + 30 })
  await mouse.moveTo(pin)
  await check('3-pin-hover', 'grab')
  await mouse.down()
  await check('4-pin-pressed', 'grabbing')
  await mouse.up()

  const box = await page.locator('canvas').boundingBox()
  await mouse.moveTo({ x: box.x + box.width / 2, y: box.y + box.height - 60 })
  await check('5-empty-globe', 'default')

  console.log(`\nstrip: ${capture.strip('strip', shots)}`)
} finally {
  await session.close()
}

if (failures.length) {
  console.error(`\n${failures.length} cursor check(s) failed:\n  ${failures.join('\n  ')}`)
  process.exit(1)
}
