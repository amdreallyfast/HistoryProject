import { test, expect, type Page } from '@playwright/test'

// A source can't be written before its event happened (claudePlans/10). Rule: the event's
// earliest date must be on or before the source's latest date. Overlap is allowed, and so is
// an event that ends before the source begins.

const eventYear = (page: Page, which: 0 | 1) => page.getByPlaceholder('YYYY (ex: -500)').nth(which)
const sourceYear = (page: Page, which: 0 | 1) => page.getByPlaceholder('YYYY', { exact: true }).nth(which)
const error = (page: Page) => page.getByTestId('source-before-event-error')
const submit = (page: Page) => page.getByTestId('submit-event-button')

test.beforeEach(async ({ page }) => {
  await page.route('**/api/HistoricalEvent/GetFirst100', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  )
  await page.goto('/')
  await page.waitForFunction(() => window.__globeTest !== undefined)
  await page.getByRole('button', { name: 'Create New Event' }).click()
  const at = (await page.evaluate(() => window.__globeTest!.latLongClientXY(40, 12.5)))!
  await page.mouse.click(at.x, at.y)
  await expect(submit(page)).toBeVisible()

  await eventYear(page, 0).fill('1066')
  await eventYear(page, 1).fill('1066')
  await page.getByRole('button', { name: '+', exact: true }).click()
  await page.getByPlaceholder(/^Title \(max/).first().fill('Chronicle')
})

test('a source entirely before the event shows an error and blocks Submit', async ({ page }) => {
  await sourceYear(page, 0).fill('1040')
  await sourceYear(page, 1).fill('1050')

  await expect(error(page)).toBeVisible()
  await expect(submit(page)).toBeDisabled()

  // Moving the event earlier makes the ranges overlap, which is allowed.
  await eventYear(page, 0).fill('1045')
  await expect(error(page)).toHaveCount(0)
  await expect(submit(page)).toBeEnabled()
})

test('a source written after the event is fine', async ({ page }) => {
  await sourceYear(page, 0).fill('1070')
  await sourceYear(page, 1).fill('1080')

  await expect(error(page)).toHaveCount(0)
  await expect(submit(page)).toBeEnabled()
})

test('partial dates: compared by month when months are given', async ({ page }) => {
  const month = (i: number) => page.getByPlaceholder('MM (optional)').nth(i) // 0,1 event; 2,3 source

  // Event Oct 1066; source written in Mar 1066 → before the event.
  await month(0).fill('10')
  await month(1).fill('10')
  await sourceYear(page, 0).fill('1066')
  await month(2).fill('3')
  await sourceYear(page, 1).fill('1066')
  await month(3).fill('3')
  await expect(error(page)).toBeVisible()

  // Drop the source's latest month: "sometime in 1066" could be after October → allowed.
  await month(3).fill('')
  await expect(error(page)).toHaveCount(0)
})
