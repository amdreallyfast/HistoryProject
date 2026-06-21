import { test, expect } from '@playwright/test'

// "Oracle" test for the winding classifier. It locks isRegionWindingValid to
// EarClipping's ACTUAL behavior: the orientation generateRegionMesh accepts is
// exactly the one the classifier returns true for, and the reversed boundary both
// fails the classifier AND makes generateRegionMesh throw. If these ever diverge,
// the classifier's sign convention is wrong (flip the comparison).
//
// The assertions run inside the browser via page.evaluate, importing the real
// source modules through the Vite dev server. (Importing the app source — which
// pulls in ESM-only `three` — directly into a Playwright Node spec breaks the test
// loader, so we exercise it where Vite already resolves it.)
test('winding classifier agrees with EarClipping (valid CCW vs reversed CW)', async ({ page }) => {
  await page.goto('/')

  const result = await page.evaluate(async () => {
    // Specifiers are passed through a variable so the spec bundler doesn't try to
    // statically resolve these app paths (it can't — they're Vite dev-server URLs).
    const dyn = (p: string) => import(/* @vite-ignore */ p)
    const { ConvertLatLongToXYZ } = await dyn('/src/GlobeSection/convertLatLongXYZ.jsx')
    const { isRegionWindingValid, regionWindingSign, generateRegionMesh } =
      await dyn('/src/GlobeSection/Region/regionMeshGeometry.js')

    const MESH_RADIUS = 5.1
    // Valid (counterclockwise) fixture region; reversing flips the winding to CW.
    const ccw = [
      [42.0, 12.0], [42.0, 13.0], [43.0, 13.0], [43.0, 12.0],
    ].map(([lat, long]) => ConvertLatLongToXYZ(lat, long, MESH_RADIUS))
    const cw = [...ccw].reverse()

    const triangulates = (verts: number[][]) => {
      try { generateRegionMesh(verts, MESH_RADIUS); return true } catch { return false }
    }

    return {
      ccwSign: regionWindingSign(ccw),
      ccwValid: isRegionWindingValid(ccw),
      ccwTriangulates: triangulates(ccw),
      cwSign: regionWindingSign(cw),
      cwValid: isRegionWindingValid(cw),
      cwTriangulates: triangulates(cw),
    }
  })

  // Valid orientation: classifier positive + true, and EarClipping triangulates it.
  expect(result.ccwSign).toBeGreaterThan(0)
  expect(result.ccwValid).toBe(true)
  expect(result.ccwTriangulates).toBe(true)

  // Reversed orientation: classifier negative + false, and EarClipping throws.
  expect(result.cwSign).toBeLessThan(0)
  expect(result.cwValid).toBe(false)
  expect(result.cwTriangulates).toBe(false)
})
