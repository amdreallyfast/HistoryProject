import { describe, it, expect, vi } from "vitest"
import * as THREE from "three"
import { subdivideRegionBoundaries } from "./regionSubdivide"
import { generateRegionMesh } from "./regionMeshGeometry"
import { createSpherePointFromLatLong } from "../createSpherePoint"
import { globeInfo, regionInfo } from "../constValues"

const RADIUS = globeInfo.radius

// A ring matching what the editor actually produces: 8 points at defaultRegionRadius
// degrees of latitude around an origin. Mirrors createDefaultRegionBoundaries in
// EditableRegion.jsx closely enough to be representative.
const makeDefaultRing = (originLat = 10, originLong = -15) => {
  const ring = []
  const origin = createSpherePointFromLatLong(originLat, originLong, RADIUS)
  const offset = createSpherePointFromLatLong(originLat + regionInfo.defaultRegionRadius, originLong, RADIUS)

  const axis = new THREE.Vector3(origin.x, origin.y, origin.z).normalize()
  const offsetVec = new THREE.Vector3(offset.x, offset.y, offset.z)

  for (let radians = 0; radians < Math.PI * 2; radians += Math.PI / 4) {
    const rotated = offsetVec.clone().applyAxisAngle(axis, radians)
    ring.push({
      id: `p${ring.length}`,
      x: rotated.x,
      y: rotated.y,
      z: rotated.z,
    })
  }
  return ring
}

const toVec = (p) => new THREE.Vector3(p.x, p.y, p.z)

describe("subdivideRegionBoundaries", () => {
  it("doubles the point count", () => {
    const ring = makeDefaultRing()
    expect(subdivideRegionBoundaries(ring, RADIUS)).toHaveLength(ring.length * 2)
  })

  it("interleaves midpoints, preserving the original order", () => {
    const ring = makeDefaultRing()
    const result = subdivideRegionBoundaries(ring, RADIUS)

    // Originals land on even indices, in their original sequence — this is what keeps the
    // counterclockwise winding EarClipping requires.
    for (let i = 0; i < ring.length; i++) {
      expect(result[i * 2]).toBe(ring[i])
    }
  })

  it("closes the ring: the last inserted point bridges last -> first", () => {
    const ring = makeDefaultRing()
    const result = subdivideRegionBoundaries(ring, RADIUS)

    const last = toVec(ring[ring.length - 1])
    const first = toVec(ring[0])
    const bridge = toVec(result[result.length - 1])

    expect(bridge.angleTo(last)).toBeCloseTo(bridge.angleTo(first), 10)
  })

  // The claim the "no bulge" reasoning rests on: the inserted point is on the great-circle
  // arc between its neighbours, not merely somewhere between them.
  it("places each new point at the great-circle arc midpoint", () => {
    const ring = makeDefaultRing()
    const result = subdivideRegionBoundaries(ring, RADIUS)

    for (let i = 0; i < ring.length; i++) {
      const a = toVec(ring[i])
      const b = toVec(ring[(i + 1) % ring.length])
      const mid = toVec(result[(i * 2) + 1])

      // Equidistant in ANGLE from both neighbours...
      expect(mid.angleTo(a)).toBeCloseTo(mid.angleTo(b), 10)
      // ...and exactly half the arc, so it is on the arc rather than off to one side.
      expect(mid.angleTo(a) * 2).toBeCloseTo(a.angleTo(b), 10)
      // ...and coplanar with the origin, a and b (the great circle's plane).
      const planeNormal = new THREE.Vector3().crossVectors(a, b).normalize()
      expect(mid.clone().normalize().dot(planeNormal)).toBeCloseTo(0, 10)
    }
  })

  it("puts new points on the sphere surface", () => {
    const ring = makeDefaultRing()
    const result = subdivideRegionBoundaries(ring, RADIUS)

    for (const point of result) {
      expect(toVec(point).length()).toBeCloseTo(RADIUS, 6)
    }
  })

  it("never moves or mutates an existing point", () => {
    const ring = makeDefaultRing()
    const snapshot = ring.map((p) => ({ ...p }))

    subdivideRegionBoundaries(ring, RADIUS)

    expect(ring).toEqual(snapshot)
  })

  // Every boundary point needs a unique id: it is the single drag-identity key, so a pin
  // without one cannot be dragged and its polygon will not track (see EditPinMesh).
  it("gives every point a unique id", () => {
    const result = subdivideRegionBoundaries(makeDefaultRing(), RADIUS)
    const ids = result.map((p) => p.id)

    expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("survives repeated subdivision up to the cap", () => {
    let ring = makeDefaultRing()
    for (let i = 0; i < 4; i++) {
      ring = subdivideRegionBoundaries(ring, RADIUS)
    }

    expect(ring).toHaveLength(128)
    expect(new Set(ring.map((p) => p.id)).size).toBe(128)
  })

  it("returns the input untouched when there is no region", () => {
    expect(subdivideRegionBoundaries([], RADIUS)).toEqual([])
    const twoPoints = [{ id: "a", x: RADIUS, y: 0, z: 0 }, { id: "b", x: 0, y: RADIUS, z: 0 }]
    expect(subdivideRegionBoundaries(twoPoints, RADIUS)).toBe(twoPoints)
  })

  // The NaN guard. Antipodal neighbours have no unique arc midpoint, and the naive
  // midpoint is the zero vector -> sphereRadius/0 = Infinity -> 0*Infinity = NaN. A NaN
  // position makes the mesh's boundingSphere NaN and Three.js culls it silently.
  it("skips antipodal neighbours instead of emitting NaN", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => { })

    const antipodal = [
      { id: "a", x: RADIUS, y: 0, z: 0 },
      { id: "b", x: -RADIUS, y: 0, z: 0 },  // exactly opposite "a"
      { id: "c", x: 0, y: RADIUS, z: 0 },
    ]

    const result = subdivideRegionBoundaries(antipodal, RADIUS)

    for (const point of result) {
      expect(Number.isFinite(point.x)).toBe(true)
      expect(Number.isFinite(point.y)).toBe(true)
      expect(Number.isFinite(point.z)).toBe(true)
      expect(Number.isFinite(point.lat ?? 0)).toBe(true)
      expect(Number.isFinite(point.long ?? 0)).toBe(true)
    }

    // The a->b pair is skipped, so 3 originals + 2 usable midpoints, not 6.
    expect(result).toHaveLength(5)
    expect(consoleError).toHaveBeenCalled()

    consoleError.mockRestore()
  })
})

// Integration check: the whole point of preserving order is that the result still
// triangulates. If subdivision ever flipped the winding, EarClipping would throw here.
describe("subdivided boundaries still triangulate", () => {
  it("generateRegionMesh succeeds on a ring subdivided up to the cap", () => {
    let ring = makeDefaultRing()

    for (let i = 0; i < 4; i++) {
      ring = subdivideRegionBoundaries(ring, RADIUS)
      const baseVertices = ring.map((p) => [p.x, p.y, p.z])
      expect(() => generateRegionMesh(baseVertices, RADIUS)).not.toThrow()
    }
  })
})
