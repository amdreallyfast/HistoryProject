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

    // "Local twist": an 8-pin region where one pin was dragged across its neighbors.
    // The boundary is still GLOBALLY counterclockwise (winding classifier passes) but
    // crosses itself enough that EarClipping finds no ear and throws. This is the gap
    // the Submit guard must close — winding alone says "valid", yet the region can't be
    // triangulated, so the Submit gate has to track triangulation success, not winding.
    const twist = [
      [42.5, 13.5], [43.21, 13.21], [42.36, 14.23], [43.21, 11.79],
      [42.5, 11.5], [41.14, 13.55], [41.5, 12.5], [42.0, 10.74],
    ].map(([lat, long]) => ConvertLatLongToXYZ(lat, long, MESH_RADIUS))

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
      twistValid: isRegionWindingValid(twist),
      twistTriangulates: triangulates(twist),
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

  // Local twist: winding classifier says VALID, yet EarClipping still throws. Proves the
  // classifier alone can't gate Submit — "did triangulation succeed" is the real signal,
  // which is exactly the regionValid flag EditRegionMesh publishes to drive the gate.
  expect(result.twistValid).toBe(true)
  expect(result.twistTriangulates).toBe(false)
})

// The OTHER direction of the same lesson (bug 3): the winding heuristic can also
// FALSELY REJECT a perfectly valid region. `writeRegionMesh` used to pre-gate on
// `isRegionWindingValid` before even attempting triangulation, so a region the
// heuristic mis-signs as clockwise was dropped (red + Submit blocked) even though
// EarClipping triangulates it fine. This test pins a concrete example and is the
// regression guard for removing that pre-gate — triangulation is the sole gate now.
test('winding heuristic falsely rejects a valid large region (regression for the dropped pre-gate)', async ({ page }) => {
  await page.goto('/')

  const result = await page.evaluate(async () => {
    const dyn = (p: string) => import(/* @vite-ignore */ p)
    const { ConvertLatLongToXYZ } = await dyn('/src/GlobeSection/convertLatLongXYZ.jsx')
    const { isRegionWindingValid, regionWindingSign, generateRegionMesh } =
      await dyn('/src/GlobeSection/Region/regionMeshGeometry.js')

    const MESH_RADIUS = 5.1
    // A huge but simple counterclockwise quadrilateral (40S..40N, 120W..120E).
    // regionWindingSign sums UN-normalized vertex vectors for its centroid, so over
    // this large extent the centroid-dot flips negative even though the boundary is
    // the same CCW orientation EarClipping accepts.
    const large = [
      [-40.0, -120.0], [-40.0, 120.0], [40.0, 120.0], [40.0, -120.0],
    ].map(([lat, long]) => ConvertLatLongToXYZ(lat, long, MESH_RADIUS))

    const triangulates = (verts: number[][]) => {
      try { generateRegionMesh(verts, MESH_RADIUS); return true } catch { return false }
    }

    return {
      sign: regionWindingSign(large),
      valid: isRegionWindingValid(large),
      triangulates: triangulates(large),
    }
  })

  // Heuristic mis-classifies it as clockwise (sign < 0 => would have blocked Submit)...
  expect(result.sign).toBeLessThan(0)
  expect(result.valid).toBe(false)
  // ...yet EarClipping triangulates it fine, so it is genuinely a valid region. Gating
  // on triangulation (not this heuristic) is what stops the false rejection.
  expect(result.triangulates).toBe(true)
})
