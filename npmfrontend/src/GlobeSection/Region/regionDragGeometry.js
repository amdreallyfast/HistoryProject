// Pure geometry helpers for the click-and-drag hot path in EditRegionMesh.
//
// Extracted from EditRegionMesh.useFrame so the logic is unit-testable: Playwright
// cannot practically drive a globe drag, so these functions are where the automated
// coverage for live single-pin tracking lives (see regionDragGeometry.test.js).
//
// Both are called once per animation frame during a drag, so they avoid allocating:
// callers pass in reusable scratch objects and get back plain numbers.

// Reconstruct the live region boundary mid-drag: every marker stays at its
// drag-start position (Redux is deliberately frozen during a drag — see
// sharedDragRotor.js) except the one being dragged, which is rotated by the same
// rotor EditPinMesh applies to that pin. Boundary order is preserved via an
// in-place map, which is what EarClipping's counterclockwise requirement depends on.
//
// `draggedId` is a `locationId` — the single drag-identity key, equal to
// `spherePoint.id` and `regionBoundaries[].id` (stamped in EditPinMesh).
//
// Returns `found: false` when `draggedId` is null/undefined or matches no boundary
// marker. That is the legitimate "the dragged pin is the primary location, which the
// region boundary is independent of" case — but it is ALSO what a pin created without
// a locationId looks like, which is why MouseHandler console.errors on that at drag
// start rather than letting this return quietly stand in for both.
export const buildDraggedBoundary = (regionBoundaries, draggedId, quaternion, scratchVec) => {
  if (draggedId == null) {
    return { baseVertices: null, found: false }
  }

  let found = false
  const baseVertices = regionBoundaries.map((boundaryMarker) => {
    if (boundaryMarker.id == draggedId) {
      found = true
      scratchVec.set(boundaryMarker.x, boundaryMarker.y, boundaryMarker.z).applyQuaternion(quaternion)
      return [scratchVec.x, scratchVec.y, scratchVec.z]
    }
    return [boundaryMarker.x, boundaryMarker.y, boundaryMarker.z]
  })

  if (!found) {
    return { baseVertices: null, found: false }
  }
  return { baseVertices, found: true }
}

// Bounding sphere over only the LIVE PREFIX of the pre-allocated position buffer.
//
// EditRegionMesh writes into fixed-size buffers (MAX_VERTICES = 4096) and tracks how
// much is live in activeVertexCount. THREE's geometry.computeBoundingSphere() walks
// the whole buffer including the zeroed tail, which sits at the globe center — so the
// resulting sphere was both needlessly expensive (4096 vertices instead of ~100) and
// wildly oversized. Oversized is harmless for culling, but recomputing it every frame
// of a drag is not.
//
// Uses the axis-aligned-bounding-box center as the sphere center (same approach as
// THREE.BufferGeometry.computeBoundingSphere) so results stay comparable.
// Returns plain numbers rather than a THREE.Sphere to keep this dependency-free and
// allocation-free; the caller copies into a long-lived Sphere.
export const computeActiveBoundingSphere = (positionArray, activeVertexCount) => {
  if (!activeVertexCount || activeVertexCount < 1) {
    return { center: { x: 0, y: 0, z: 0 }, radius: 0 }
  }

  const activeLength = activeVertexCount * 3

  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  for (let i = 0; i < activeLength; i += 3) {
    const x = positionArray[i]
    const y = positionArray[i + 1]
    const z = positionArray[i + 2]
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (z < minZ) minZ = z
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
    if (z > maxZ) maxZ = z
  }

  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const cz = (minZ + maxZ) / 2

  let maxRadiusSq = 0
  for (let i = 0; i < activeLength; i += 3) {
    const dx = positionArray[i] - cx
    const dy = positionArray[i + 1] - cy
    const dz = positionArray[i + 2] - cz
    const distSq = (dx * dx) + (dy * dy) + (dz * dz)
    if (distSq > maxRadiusSq) {
      maxRadiusSq = distSq
    }
  }

  return { center: { x: cx, y: cy, z: cz }, radius: Math.sqrt(maxRadiusSq) }
}
