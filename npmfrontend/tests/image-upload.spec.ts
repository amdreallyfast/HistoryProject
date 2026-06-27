import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import fixtureEvents from './fixtures/events.json' with { type: 'json' }

// Real fixture images. The PNG/JPEG are genuine images; atomBohrModel.svg is a real
// SVG; perfectlyNormalPng.png is HTML+script wearing a .png name (bytes start
// "<!DOCTYPE html>") — the case that proves validation is byte-based, not extension.
const imagesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'images')
const GOOD_PNG = join(imagesDir, 'colloseumStockPhoto.png')
const GOOD_JPG = join(imagesDir, 'colloseumStockPhoto.jpg')
const REAL_SVG = join(imagesDir, 'atomBohrModel.svg')
const DISGUISED = join(imagesDir, 'perfectlyNormalPng.png')

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

// Select the fixture event and open it for editing.
async function openEditMode(page) {
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()
  await page.getByTestId('edit-event-button').click()
  await expect(page.getByTestId('image-upload-input')).toBeVisible()
}

test('backend image bytes are rebuilt into a displayable data URL', async ({ page }) => {
  // The fixture event carries EventImage.ImageBinary (base64 PNG). backendToFrontend
  // must sniff the magic bytes and reconstruct a data:image/png URL for <img>.
  await page.getByTestId('search-button').click()
  await page.getByTestId('search-result-item').first().click()
  const src = await page.getByTestId('display-event-image').getAttribute('src')
  expect(src).toMatch(/^data:image\/png;base64,/)
})

test('a valid PNG upload shows a preview and no error', async ({ page }) => {
  await openEditMode(page)
  await page.getByTestId('image-upload-input').setInputFiles(GOOD_PNG)
  await expect(page.getByTestId('edit-image-preview')).toBeVisible()
  await expect(page.getByTestId('image-upload-error')).toHaveCount(0)
})

test('a valid JPEG upload shows a preview and no error', async ({ page }) => {
  await openEditMode(page)
  await page.getByTestId('image-upload-input').setInputFiles(GOOD_JPG)
  await expect(page.getByTestId('edit-image-preview')).toBeVisible()
  await expect(page.getByTestId('image-upload-error')).toHaveCount(0)
})

test('a real SVG is rejected with an inline error', async ({ page }) => {
  await openEditMode(page)
  await page.getByTestId('image-upload-input').setInputFiles(REAL_SVG)
  await expect(page.getByTestId('image-upload-error')).toBeVisible()
})

test('HTML disguised as .png is rejected (byte-based, not extension-based)', async ({ page }) => {
  await openEditMode(page)
  await page.getByTestId('image-upload-input').setInputFiles(DISGUISED)
  await expect(page.getByTestId('image-upload-error')).toBeVisible()
})

test('submitting a valid image posts non-empty ImageBinary to Create', async ({ page }) => {
  let createBody: any = null
  await page.route('**/api/HistoricalEvent/Create', async (route) => {
    createBody = route.request().postDataJSON()
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
  })

  await openEditMode(page)
  await page.getByTestId('image-upload-input').setInputFiles(GOOD_PNG)
  await expect(page.getByTestId('edit-image-preview')).toBeVisible()

  const submit = page.getByTestId('submit-event-button')
  await expect(submit).toBeEnabled()
  await submit.click()

  await expect.poll(() => createBody).not.toBeNull()
  // frontendToBackend must send the stripped base64 (no data: prefix) — a PNG signature
  // begins "iVBOR" in base64.
  expect(createBody.EventImage.ImageBinary.length).toBeGreaterThan(0)
  expect(createBody.EventImage.ImageBinary.startsWith('iVBOR')).toBe(true)
  // The creation-of-source flag (fixture = true) must survive the edit round trip.
  expect(createBody.EventIsCreationOfSource).toBe(true)
})
