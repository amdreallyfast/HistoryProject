import { describe, it, expect } from "vitest"
import * as THREE from "three"
import { buildDraggedBoundary, computeActiveBoundingSphere } from "./regionDragGeometry"

// Automated coverage for the click-and-drag hot path. Playwright cannot practically
// drive a globe drag (it would have to synthesize mouse movement over a WebGL canvas
// and read back mesh state), so the drag logic is tested here as pure functions.

const identity = new THREE.Quaternion()
// Quarter turn about +Y: maps (1,0,0) -> (0,0,-1). Easy to assert exactly.
const quarterTurnY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)

const boundary = [
  { id: "a", x: 1, y: 0, z: 0 },
  { id: "b", x: 0, y: 1, z: 0 },
  { id: "c", x: 0, y: 0, z: 1 },
]

describe("buildDraggedBoundary", () => {
  it("rotates only the dragged marker and leaves the others untouched", () => {
    const scratch = new THREE.Vector3()
    const { baseVertices, found } = buildDraggedBoundary(boundary, "a", quarterTurnY, scratch)

    expect(found).toBe(true)
    // "a" rotated a quarter turn about +Y.
    expect(baseVertices[0][0]).toBeCloseTo(0)
    expect(baseVertices[0][1]).toBeCloseTo(0)
    expect(baseVertices[0][2]).toBeCloseTo(-1)
    // "b" and "c" stay at their drag-start positions.
    expect(baseVertices[1]).toEqual([0, 1, 0])
    expect(baseVertices[2]).toEqual([0, 0, 1])
  })

  it("preserves boundary order (EarClipping depends on the CCW ordering)", () => {
    const scratch = new THREE.Vector3()
    const { baseVertices } = buildDraggedBoundary(boundary, "b", identity, scratch)

    // Identity rotation => output must be the input, in the same order.
    expect(baseVertices).toEqual([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ])
  })

  // The regression this whole TODO item is about: before the identity keys were
  // unified, a pin with no locationId still moved (EditPinMesh matched on mesh uuid)
  // while this lookup found nothing and the polygon silently froze. The lookup still
  // reports found:false — that is correct and unavoidable — but it must do so
  // unambiguously so the caller returns instead of triangulating a bogus boundary.
  it("reports found:false for an id that matches no boundary marker", () => {
    const scratch = new THREE.Vector3()
    const { baseVertices, found } = buildDraggedBoundary(boundary, "not-a-boundary-id", quarterTurnY, scratch)

    expect(found).toBe(false)
    expect(baseVertices).toBeNull()
  })

  it("reports found:false for a missing id without touching the boundary", () => {
    const scratch = new THREE.Vector3()

    for (const missing of [undefined, null]) {
      const { baseVertices, found } = buildDraggedBoundary(boundary, missing, quarterTurnY, scratch)
      expect(found).toBe(false)
      expect(baseVertices).toBeNull()
    }

    // The input boundary is never mutated in place.
    expect(boundary[0]).toEqual({ id: "a", x: 1, y: 0, z: 0 })
  })

  it("does not allocate a vector per call (uses the caller's scratch)", () => {
    const scratch = new THREE.Vector3()
    buildDraggedBoundary(boundary, "c", quarterTurnY, scratch)

    // Proof the scratch was the vector actually written through: it holds the
    // rotated value of "c" after the call.
    expect(scratch.x).toBeCloseTo(1)
    expect(scratch.z).toBeCloseTo(0)
  })
})

describe("computeActiveBoundingSphere", () => {
  it("ignores the zeroed tail of the pre-allocated buffer", () => {
    // Mirrors the real geometry: a fixed 4096-vertex buffer with only a small live
    // prefix. The old geometry.computeBoundingSphere() walked the whole thing, so the
    // zeroed tail at the origin dragged the sphere out to cover the globe center.
    const MAX_VERTICES = 4096
    const buffer = new Float32Array(MAX_VERTICES * 3)

    // 8 live vertices in a tight cluster far from the origin (a small region sitting
    // on the globe surface, radius ~50 in this project's units).
    const liveCount = 8
    for (let i = 0; i < liveCount; i++) {
      buffer[i * 3 + 0] = 50 + (i % 2)
      buffer[i * 3 + 1] = 50
      buffer[i * 3 + 2] = 50
    }

    const { center, radius } = computeActiveBoundingSphere(buffer, liveCount)

    expect(center.x).toBeCloseTo(50.5)
    expect(center.y).toBeCloseTo(50)
    expect(center.z).toBeCloseTo(50)
    // Tight around the 8 live vertices...
    expect(radius).toBeCloseTo(0.5)
    // ...and nowhere near the ~86 it would take to also reach the zeroed tail.
    expect(radius).toBeLessThan(1)
  })

  it("encloses every active vertex", () => {
    const verts = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 3, 0],
      [0, 0, -2],
    ]
    const buffer = new Float32Array(verts.flat())
    const { center, radius } = computeActiveBoundingSphere(buffer, verts.length)

    const c = new THREE.Vector3(center.x, center.y, center.z)
    for (const [x, y, z] of verts) {
      expect(new THREE.Vector3(x, y, z).distanceTo(c)).toBeLessThanOrEqual(radius + 1e-6)
    }
  })

  it("matches THREE's own computeBoundingSphere when the buffer is fully active", () => {
    const verts = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 3, 0],
      [0, 0, -2],
    ]
    const buffer = new Float32Array(verts.flat())

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(buffer, 3))
    geometry.computeBoundingSphere()

    const { center, radius } = computeActiveBoundingSphere(buffer, verts.length)

    expect(center.x).toBeCloseTo(geometry.boundingSphere.center.x)
    expect(center.y).toBeCloseTo(geometry.boundingSphere.center.y)
    expect(center.z).toBeCloseTo(geometry.boundingSphere.center.z)
    expect(radius).toBeCloseTo(geometry.boundingSphere.radius)
  })

  it("returns a zero sphere for an empty region", () => {
    const buffer = new Float32Array(300)
    expect(computeActiveBoundingSphere(buffer, 0)).toEqual({ center: { x: 0, y: 0, z: 0 }, radius: 0 })
  })
})
