import { describe, it, expect } from "vitest"
import { computePinZoomScale } from "./pinZoomScale"
import { pinZoomScaleInfo, globeInfo, regionInfo, pinMeshInfo, editRegionMeshInfo } from "./constValues"

describe("computePinZoomScale", () => {
  it("is exactly 1.0 at the reference distance (default view is unchanged)", () => {
    // The whole point of anchoring referenceDistance to the camera's initial Z: the app
    // must look identical on load, with the scaling only kicking in once you zoom.
    expect(computePinZoomScale(pinZoomScaleInfo.referenceDistance, pinZoomScaleInfo)).toBe(1)
  })

  // Distances below stay inside the unclamped band
  // [referenceDistance * minScale, referenceDistance * maxScale] so they exercise the
  // curve rather than the rails.
  it("shrinks as the camera approaches and grows as it recedes", () => {
    const near = computePinZoomScale(6, pinZoomScaleInfo)
    const mid = computePinZoomScale(11, pinZoomScaleInfo)
    const far = computePinZoomScale(14, pinZoomScaleInfo)

    expect(near).toBeLessThan(mid)
    expect(mid).toBeLessThan(far)
  })

  it("holds constant apparent size at exponent 1.0 (scale is linear in distance)", () => {
    // Doubling the camera distance doubles the world size, which is what keeps the
    // on-screen size fixed.
    const a = computePinZoomScale(6, pinZoomScaleInfo)
    const b = computePinZoomScale(12, pinZoomScaleInfo)
    expect(b / a).toBeCloseTo(2)
  })

  it("clamps at both ends", () => {
    // Camera buried at the globe center, and camera far outside the star field.
    expect(computePinZoomScale(0.001, pinZoomScaleInfo)).toBe(pinZoomScaleInfo.minScale)
    expect(computePinZoomScale(100000, pinZoomScaleInfo)).toBe(pinZoomScaleInfo.maxScale)
  })

  it("never returns a non-finite scale for degenerate camera positions", () => {
    // A NaN scale propagates into matrixWorld and silently makes the mesh vanish, which
    // would look like "the pins disappeared" rather than an error.
    for (const distance of [0, -1, NaN, Infinity]) {
      const scale = computePinZoomScale(distance, pinZoomScaleInfo)
      expect(Number.isFinite(scale)).toBe(true)
      expect(scale).toBeGreaterThan(0)
    }
  })

  it("compresses the range at exponent < 1 (pins also shrink on screen)", () => {
    const linear = computePinZoomScale(13, pinZoomScaleInfo)
    const compressed = computePinZoomScale(13, { ...pinZoomScaleInfo, exponent: 0.5 })

    expect(compressed).toBeLessThan(linear)
    // Still above 1.0 — zooming out enlarges, just less aggressively.
    expect(compressed).toBeGreaterThan(1)
  })
})

// Zoom scaling shrinks a pin's radial standoff along with the rest of it. Basing pins on
// the globe surface therefore made them sink under the edit region fill (which floats at
// a fixed offset) as soon as the scale dropped far enough — observed as "the boundary
// boxes are rendered behind the edit region mesh" when zoomed in. Pins are now based
// ABOVE the fill, which makes the clearance independent of scale. These lock that in.
describe("edit pins clear the edit region fill at every zoom", () => {
  it("bases pins above the region fill, not on the globe surface", () => {
    expect(pinMeshInfo.radiusOffset).toBeGreaterThan(editRegionMeshInfo.radiusOffset)
  })

  it("keeps the smallest boundary pin above the fill even at minScale", () => {
    // Worst case: the smaller of the two pin types, at the most aggressive shrink.
    const pinBase = globeInfo.radius + pinMeshInfo.radiusOffset
    const fillSurface = globeInfo.radius + editRegionMeshInfo.radiusOffset

    expect(pinBase).toBeGreaterThan(fillSurface)

    // And the pin body still projects outward from that base rather than being buried.
    const shortestStandoff = pinMeshInfo.length * pinMeshInfo.regionPinScale * pinZoomScaleInfo.minScale
    expect(pinBase + shortestStandoff).toBeGreaterThan(fillSurface)
  })

  it("would have failed with surface-based pins (the bug)", () => {
    // Documents the old arrangement: based at the surface, a boundary pin's tip reached
    // only 0.15 and the fill sits at 0.1, so any scale under ~0.67 buried it.
    const oldTipAtScale = (k) => pinMeshInfo.length * pinMeshInfo.regionPinScale * k
    expect(oldTipAtScale(1.0)).toBeGreaterThan(editRegionMeshInfo.radiusOffset)
    expect(oldTipAtScale(0.5)).toBeLessThan(editRegionMeshInfo.radiusOffset)
  })
})

// The regression this feature exists for. Numbers mirror the real geometry so the test
// fails if someone changes globe radius, region radius, or pin scale in a way that
// re-breaks dense boundary editing.
describe("subdivided boundary pins stop overlapping once zoomed in", () => {
  // Boundary circle: defaultRegionRadius is a latitude offset in degrees, so its world
  // radius is globe radius * that angle in radians.
  const boundaryWorldRadius = globeInfo.radius * (regionInfo.defaultRegionRadius * Math.PI / 180)
  const circumference = 2 * Math.PI * boundaryWorldRadius

  // makeBoundingBox: width = (sqrt(3)/2 * 2) * 2, then scaled by regionPinScale.
  const unscaledBoxWidth = (Math.sqrt(3) / 2) * 2 * 2 * pinMeshInfo.regionPinScale

  const spacingFor = (pinCount) => circumference / pinCount

  it("overlaps at 32 pins in the default view (the blocker)", () => {
    const spacing = spacingFor(32)
    const boxWidth = unscaledBoxWidth * computePinZoomScale(pinZoomScaleInfo.referenceDistance, pinZoomScaleInfo)

    // Grab targets are wider than the gap between pins => ambiguous picking.
    expect(boxWidth).toBeGreaterThan(spacing)
  })

  it("separates at 32 pins once zoomed in (the fix)", () => {
    const spacing = spacingFor(32)
    // A close-in inspection distance: still outside the globe surface (radius 5).
    const boxWidth = unscaledBoxWidth * computePinZoomScale(7, pinZoomScaleInfo)

    expect(boxWidth).toBeLessThan(spacing)
  })

  it("the default 8-pin boundary was never the problem", () => {
    const spacing = spacingFor(8)
    const boxWidth = unscaledBoxWidth * computePinZoomScale(pinZoomScaleInfo.referenceDistance, pinZoomScaleInfo)

    expect(boxWidth).toBeLessThan(spacing)
  })
})
