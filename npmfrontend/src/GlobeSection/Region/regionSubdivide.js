import { createSpherePointFromXYZ } from "../createSpherePoint"

// Doubling a region boundary: insert a new point on the arc between each adjacent pair.
//
// The new point is the chord midpoint (A+B)/2 pushed back out to the sphere. Because the
// chord midpoint is a linear combination of A and B, it lies in the plane through the
// globe origin containing both, so renormalising it lands EXACTLY on the great-circle arc
// midpoint — equidistant in angle from A and B. The authored boundary curve is therefore
// unchanged; this is purely additive. Existing points are passed through by reference, so
// their ids and coordinates are untouched.
//
// Output order is [p0, m01, p1, m12, ... pN, mN0] — the original ring order with midpoints
// interleaved, which preserves the counterclockwise winding EarClipping requires.
//
// createSpherePointFromXYZ does both jobs needed for each midpoint: rescales onto the
// sphere, and assigns the `id` that drag identity depends on (see EditPinMesh — a boundary
// point without an id cannot be dragged and its polygon will not track).

// Degenerate-pair threshold. The midpoint of two ANTIPODAL points is the zero vector, and
// rescaleToRadius would compute sphereRadius/0 = Infinity, then 0 * Infinity = NaN. A NaN
// position is worse than a throw: it propagates into the geometry buffer, makes the mesh's
// boundingSphere NaN, and every frustum test then fails, so the mesh silently disappears
// with a clean console. Reject near-antipodal too — a very short midpoint vector means a
// huge scale factor and catastrophic precision loss.
//
// Expressed as a fraction of sphereRadius so it scales with the globe.
const MIN_MIDPOINT_LENGTH_FRACTION = 1e-6

export const subdivideRegionBoundaries = (regionBoundaries, sphereRadius) => {
  if (!Array.isArray(regionBoundaries) || regionBoundaries.length < 3) {
    return regionBoundaries
  }

  const minMidpointLength = sphereRadius * MIN_MIDPOINT_LENGTH_FRACTION
  const minMidpointLengthSq = minMidpointLength * minMidpointLength

  const subdivided = []
  for (let i = 0; i < regionBoundaries.length; i++) {
    const current = regionBoundaries[i]
    // Wrap: the last point pairs with the first, closing the ring.
    const next = regionBoundaries[(i + 1) % regionBoundaries.length]

    subdivided.push(current)

    const midX = (current.x + next.x) / 2
    const midY = (current.y + next.y) / 2
    const midZ = (current.z + next.z) / 2
    const midLengthSq = (midX * midX) + (midY * midY) + (midZ * midZ)

    if (midLengthSq < minMidpointLengthSq) {
      // Antipodal or near-antipodal neighbours: there is no meaningful arc midpoint
      // (every great circle through them is equally valid). Skip this pair rather than
      // emit a NaN point. Yields fewer than 2N points for this press, which is strictly
      // better than a region that vanishes without explanation.
      console.error({
        "regionSubdivide.subdivideRegionBoundaries": "adjacent boundary points are antipodal or nearly so; no arc midpoint exists, skipping this pair",
        from: current.id,
        to: next.id,
      })
      continue
    }

    subdivided.push(createSpherePointFromXYZ(midX, midY, midZ, sphereRadius))
  }

  return subdivided
}
