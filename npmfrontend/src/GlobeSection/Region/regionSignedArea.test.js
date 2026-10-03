import { describe, it, expect } from "vitest"
import {
  regionSignedArea,
  classifyRegionWinding,
  regionWinding,
  REGION_WINDING_EPSILON,
  generateRegionMesh,
} from "./regionMeshGeometry"
import { ConvertLatLongToXYZ } from "../convertLatLongXYZ"

const MESH_RADIUS = 5.1
const toXYZ = (pairs) => pairs.map(([lat, long]) => ConvertLatLongToXYZ(lat, long, MESH_RADIUS))

// The same fixture region used as the winding oracle in tests/region-winding.spec.ts.
// EarClipping triangulates it, so by definition this orientation is the valid one.
const CCW = toXYZ([[42.0, 12.0], [42.0, 13.0], [43.0, 13.0], [43.0, 12.0]])
const CW = [...CCW].reverse()

const triangulates = (verts) => {
  try { generateRegionMesh(verts, MESH_RADIUS); return true } catch { return false }
}

describe("regionSignedArea sign convention", () => {
  // THE anchor test. Which sign means "valid" is not something to derive from the axis
  // convention and hope — it is defined by what EarClipping accepts. If this ever fails,
  // the sign in regionSignedArea is backwards, and every gate built on it is inverted.
  it("is positive for exactly the orientation EarClipping accepts", () => {
    expect(triangulates(CCW)).toBe(true)
    expect(regionSignedArea(CCW)).toBeGreaterThan(0)

    expect(triangulates(CW)).toBe(false)
    expect(regionSignedArea(CW)).toBeLessThan(0)
  })

  it("flips sign and preserves magnitude when the ring is reversed", () => {
    expect(regionSignedArea(CW)).toBeCloseTo(-regionSignedArea(CCW), 12)
  })

  it("is independent of the radius the points were built at", () => {
    const sameRingBigger = toXYZ([[42.0, 12.0], [42.0, 13.0], [43.0, 13.0], [43.0, 12.0]])
      .map(([x, y, z]) => [x * 1000, y * 1000, z * 1000])
    expect(regionSignedArea(sameRingBigger)).toBeCloseTo(regionSignedArea(CCW), 12)
  })

  it("reports area in steradians, bounded by the whole sphere", () => {
    const area = regionSignedArea(CCW)
    // A 1-degree-square patch near 42N is a small fraction of the sphere's 4π.
    expect(area).toBeGreaterThan(0)
    expect(area).toBeLessThan(0.01)
  })

  it("converges to the analytic area of a spherical cap", () => {
    // Checks the magnitude against real geometry rather than against another
    // implementation of the same idea. A cap above latitude φ has area 2π(1 − sin φ).
    //
    // The ring is an inscribed polygon, not the smooth circle of latitude, so it encloses
    // slightly LESS than the cap — by ~0.13% at 72 points, which is the inscribed-polygon
    // deficit and not an error in the algorithm. Refining the ring must therefore shrink
    // that gap, which is the real property worth asserting.
    const capAt = (latDeg) => 2 * Math.PI * (1 - Math.sin((latDeg * Math.PI) / 180))
    const ringAt = (stepDeg) => {
      const ring = []
      for (let long = -180; long < 180; long += stepDeg) ring.push([60, long])
      return Math.abs(regionSignedArea(toXYZ(ring)))
    }

    const analytic = capAt(60)
    const coarse = ringAt(5)   // 72 points
    const fine = ringAt(1)     // 360 points

    // Both are in the right place...
    expect(coarse).toBeCloseTo(analytic, 2)
    expect(fine).toBeCloseTo(analytic, 3)

    // ...and refining the ring strictly reduces the deficit, converging from below.
    expect(coarse).toBeLessThan(analytic)
    expect(fine).toBeLessThan(analytic)
    expect(analytic - fine).toBeLessThan(analytic - coarse)
  })

  it("treats a ring lying exactly on a great circle as zero area", () => {
    // Every vertex of the equator is coplanar with the globe's centre, so every fan
    // triangle's triple product is exactly zero.
    //
    // CAVEAT, measured: this is sampling-dependent. At 10° spacing it comes out 0, but
    // three points 120° apart on the same equator give 2π, because the Van Oosterom-Strackee
    // denominator goes negative once vertices are far enough apart and flips the atan2
    // branch. Both answers are defensible for a shape that encloses no definite side, which
    // is why great-circle rings are deliberately excluded from the cross-tier contract
    // fixture — a sampling-dependent answer is not a contract. This test pins the
    // closely-spaced case only.
    const equator = []
    for (let long = -180; long < 180; long += 10) equator.push([0, long])

    expect(regionSignedArea(toXYZ(equator))).toBeCloseTo(0, 12)
    expect(classifyRegionWinding(toXYZ(equator))).toBe(regionWinding.degenerate)
  })
})

describe("classifyRegionWinding", () => {
  it("separates counterclockwise, clockwise and degenerate", () => {
    expect(classifyRegionWinding(CCW)).toBe(regionWinding.counterclockwise)
    expect(classifyRegionWinding(CW)).toBe(regionWinding.clockwise)
  })

  it("calls a collinear ring degenerate rather than clockwise", () => {
    // Points along a single meridian enclose no area. Telling the user this is "wound
    // clockwise" would be actively misleading — there is no orientation to be wrong about.
    const collinear = toXYZ([[10, 0], [20, 0], [30, 0], [40, 0]])
    expect(classifyRegionWinding(collinear)).toBe(regionWinding.degenerate)
    expect(Math.abs(regionSignedArea(collinear))).toBeLessThanOrEqual(REGION_WINDING_EPSILON)
  })

  it("calls duplicated points degenerate", () => {
    const duplicates = toXYZ([[10, 10], [10, 10], [10, 10]])
    expect(classifyRegionWinding(duplicates)).toBe(regionWinding.degenerate)
  })

  it("treats fewer than three points as degenerate", () => {
    expect(classifyRegionWinding(toXYZ([[10, 10], [10, 11]]))).toBe(regionWinding.degenerate)
    expect(classifyRegionWinding([])).toBe(regionWinding.degenerate)
  })

  it("never returns a non-finite area for a non-finite vertex", () => {
    // A NaN vertex must not poison the sum into NaN, which would make every comparison
    // false and silently classify as counterclockwise.
    const poisoned = [[1, 0, 0], [0, 1, 0], [NaN, 0, 1]]
    expect(Number.isFinite(regionSignedArea(poisoned))).toBe(true)
    expect(classifyRegionWinding(poisoned)).toBe(regionWinding.degenerate)
  })
})

describe("the known limit: orientation is not simplicity", () => {
  // The `twist` fixture from tests/region-winding.spec.ts — an 8-point ring where one
  // point was dragged across its neighbours. Still globally counterclockwise, but it
  // crosses itself, so EarClipping finds no ear and throws.
  //
  // This test exists to pin the gap rather than hide it: the backend check accepts this
  // region. Acceptable because DisplayRegion/EditableRegion wrap the mesh in an
  // ErrorBoundary, so such a region fails to draw instead of taking the page down. If this
  // ever needs closing, the only sufficient fix is porting EarClipping to the backend.
  const twist = toXYZ([
    [42.5, 13.5], [43.21, 13.21], [42.36, 14.23], [43.21, 11.79],
    [42.5, 11.5], [41.14, 13.55], [41.5, 12.5], [42.0, 10.74],
  ])

  it("accepts a self-intersecting ring that EarClipping rejects", () => {
    expect(classifyRegionWinding(twist)).toBe(regionWinding.counterclockwise)
    expect(triangulates(twist)).toBe(false)
  })
})
