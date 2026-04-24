# EarClipping Algorithm Reference and Implementation Guide

This skill gives you a complete understanding of the Ear Clipping polygon triangulation algorithm as implemented in `npmfrontend/src/GlobeSection/Region/regionMeshGeometry.js`. Read it before modifying any code in the `EarClipping` class.

## Algorithm Overview

Ear clipping triangulates a simple polygon by repeatedly finding and removing "ears." An ear is a triple of consecutive vertices where the middle vertex (the ear tip) has an interior angle less than 180° and the triangle it forms with its two neighbors contains no other polygon vertices. Clip the ear tip, replace the three vertices with the two remaining ones, and repeat until only a triangle remains. Guaranteed to terminate by **Meisters' Two Ears Theorem**: any simple polygon with ≥ 4 vertices always has at least two non-overlapping ears.

Source references:
- `references/TriangulationByEarClipping.pdf` — Eberly (Geometric Tools), the authoritative paper
- `references/EarClippingTriangulation.html` — Olovsson 2021, a readable Python-based walkthrough of Eberly's algorithm

## Key Definitions

- **Ear**: a triple of consecutive vertices (V_prev, V_tip, V_next) where (1) V_tip is convex and (2) the triangle V_prev–V_tip–V_next contains no other polygon vertices.
- **Ear tip**: the middle vertex V_tip of an ear — the vertex that gets removed when the ear is clipped.
- **Convex vertex**: interior angle < π (less than 180°). On a CCW polygon, this is a left turn.
- **Reflex vertex**: interior angle > π (greater than 180°). On a CCW polygon, this is a right turn.
- **Diagonal**: the edge V_prev–V_next that forms after clipping V_tip. For a valid ear this diagonal lies entirely inside the polygon.

## Algorithm Steps

Precondition: vertices are in **counter-clockwise (CCW)** order. The interior of the polygon is to the left as you traverse the boundary.

1. Build the active polygon: a list of all n vertices.
2. While the active polygon has more than 3 vertices:
   a. Scan vertices in order, examining each consecutive triple (V_prev, V_tip, V_next).
   b. **Convexity check**: V_tip must be convex (interior angle < π).
   c. **Empty check**: no other vertex of the polygon may lie inside the triangle V_prev–V_tip–V_next.
   d. If both pass: the triple is an ear. Emit triangle (V_prev, V_tip, V_next). Remove V_tip from the active polygon. Restart the scan.
   e. If either fails: advance to the next vertex and try again.
3. Emit the remaining 3-vertex polygon as the final triangle.

Output: n−2 triangles for a polygon with n vertices.

## 2D → 3D Adaptation

The papers define the algorithm for 2D polygons in the XY plane. This implementation works on 3D coordinates of points located on a sphere surface (globe vertices). Two tests required adaptation:

### Convexity test (2D → 3D)

2D paper: check the sign of the z-component of the cross product of the incoming and outgoing edges at V_tip. Positive z = left turn = convex (for a CCW polygon).

3D implementation (`#isEar`): compute the 3D cross product BC × BA at vertex B, then check whether the vector B + crossProduct is farther from the origin than B alone (`crossProductPoint.lengthSq() > B.lengthSq()`). For points on a sphere, a convex vertex has the cross product pointing outward from the sphere center — the cross product adds to B's distance from the origin. A reflex vertex has it pointing inward, reducing the distance.

### Point-in-triangle test (2D → 3D)

2D paper: use signed-area (cross product sign) or barycentric coordinates to check which side of each edge the query point falls on.

3D implementation (`#pointInTriangle` + `#pointInCone`): uses three 3D cone tests. A point P is inside triangle ABC if it falls within the angular cone at each vertex:
- Cone at A: P is angularly inside the wedge between rays A→C and A→B.
- Cone at B: P is angularly inside the wedge between rays B→A and B→C.
- Cone at C: P is angularly inside the wedge between rays C→B and C→A.

The cone membership test (`#pointInCone`) works by normalizing all three direction vectors (BA, BC, and B→p) and comparing dot products: the direction to P must be angularly closer to each edge of the cone than the edges are to each other (`cosThetaBAToPoint > cosThetaCone && cosThetaBCToPoint > cosThetaCone`).

## Implementation Mapping

| Algorithm concept | Class method | Notes |
|---|---|---|
| Main loop | `#triangulate()` | Scans with `startIndex`; resets to 0 on each successful clip; advances +1 on failure |
| Convexity test | `#isEar(A, B, C)` | 3D cross product vs sphere center; B is the candidate ear tip |
| Empty test | `#noOtherPointsInTriangle(A, B, C)` | Iterates ALL remaining points (no reflex-only optimization) |
| Point-in-triangle | `#pointInTriangle(p, A, B, C)` | Three calls to `#pointInCone`, all must return true |
| Cone membership | `#pointInCone(p, A, B, C)` | B is the cone vertex; cone spans between rays B→A and B→C |
| Clip step | inline in `#triangulate()` | `slice()` concat removes index2 (the ear tip) from `this.#points` |
| Record output | `#makeTriangle(i1, i2, i3)` | Pushes triangle index triple; also records all 3 edges in `#lineIndicesDict` |

### `#triangulate()` scan logic

```
startIndex = 0
while points.length > 3:
    index1 = (startIndex + 0) % points.length   // V_prev
    index2 = (startIndex + 1) % points.length   // V_tip (candidate ear)
    index3 = (startIndex + 2) % points.length   // V_next
    if isEar(A, B, C) && noOtherPointsInTriangle(A, B, C):
        makeTriangle(...)
        remove index2 from points
        startIndex = 0             // restart
    else:
        startIndex += 1
        if startIndex > points.length * 2: throw   // safety guard
final triangle: points[0], points[1], points[2]
```

The "restart from 0" on success differs from the HTML reference's "always advance" approach. Both are correct; the restart-from-0 approach is slightly simpler to reason about.

### `#isEar(A, B, C)` — convexity at B

```
BA = A - B
BC = C - B
crossProduct = BC × BA            // 3D cross product
crossProductPoint = B + crossProduct
convex = crossProductPoint.lengthSq() > B.lengthSq()
```

B is the candidate ear tip. The cross product is computed with BC as the first argument and BA as the second (note order: BC × BA, not BA × BC). This produces a vector pointing outward from the sphere center for a CCW polygon with a convex vertex at B.

### `#pointInCone(p, A, B, C)` — P inside cone at B between BA and BC

```
BA = normalize(A - B)
BC = normalize(C - B)
Bp = normalize(p - B)
cosThetaCone      = BA · BC    // cos of the angle between the two edge directions
cosThetaBAToPoint = BA · Bp   // cos of angle from edge BA to direction toward p
cosThetaBCToPoint = BC · Bp   // cos of angle from edge BC to direction toward p
inCone = (cosThetaBAToPoint > cosThetaCone) && (cosThetaBCToPoint > cosThetaCone)
```

Higher cosine = smaller angle. Both conditions together require that P is angularly closer to each boundary edge than the edges are to each other — i.e., P is angularly inside the wedge. Boundary points (exactly on an edge direction) are excluded (strict `>`).

## Invariants and Edge Cases

**Required preconditions** (violating any may cause incorrect output or infinite loops):
- Input vertices are in **CCW order** (the class comment confirms this).
- All vertices are on or near a common sphere surface (the convexity test uses sphere-centric distance; it will misbehave for flat or planar polygons centered at the origin).
- The polygon is **simple** (no self-intersections, no holes). The Two Ears Theorem only guarantees progress for simple polygons.
- Minimum 3 vertices (enforced by the constructor's `throw`).

**Safety guard**: if `startIndex > points.length * 2`, the loop has made more than two complete passes without clipping a single ear. This indicates the polygon violates the simple-polygon precondition (or a floating-point degeneracy). The implementation throws an `Error` at this point.

**No hole support**: this implementation does not bridge holes. If you need to triangulate a polygon with holes, the bridge technique described in Section 3 of `TriangulationByEarClipping.pdf` is required as a preprocessing step.

**Line output**: `#lineIndicesDict` tracks every edge in both directions (`a,b` and `b,a`) to prevent duplicates. The final `geometry.lines` is extracted by iterating the dict keys and skipping every other one (since each edge has two dict entries). This produces one `[a, b]` pair per unique edge.

**No reflex-vertex optimization**: unlike Eberly's O(n²)-optimized version, the empty test iterates all remaining polygon vertices, not just reflex ones. For the globe region polygons this codebase uses, n is small enough that this is not a performance concern.
