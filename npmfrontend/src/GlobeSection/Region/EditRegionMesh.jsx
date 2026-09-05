import * as THREE from "three"
import { Line } from "@react-three/drei"
import { useLayoutEffect, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { useSelector, useDispatch } from "react-redux"
import { meshNames, editRegionMeshInfo } from "../constValues"
import { editEventStateActions } from "../../AppState/stateSliceEditEvent"
import { generateRegionMesh } from "./regionMeshGeometry"
import { buildDraggedBoundary, computeActiveBoundingSphere } from "./regionDragGeometry"
import { sharedDragRotor } from "../sharedDragRotor"

// Worst-case capacity for the pre-allocated region-mesh buffers. The geometry is
// triangulated (EarClipping) then subdivided (MeshSubdivider, maxEdgeLength 0.5),
// so vertex count grows well past the boundary-pin count. MAX_INDICES is sized at
// ~8 indices/vertex (a triangulated disk yields ~2 triangles/vertex => 6 indices,
// plus margin). Buffers are allocated once and reused; see initGeometryBuffers below.
const MAX_VERTICES = 4096
const MAX_INDICES = MAX_VERTICES * 8

// Scratch objects for the drag hot path. These were allocated fresh inside useFrame
// on every animation frame; at 60Hz that is pure garbage-collector pressure for no
// reason. EditableRegion mounts exactly one EditRegionMesh per edit session, so
// module scope is safe here — but note that assumption if the component ever becomes
// multi-instance.
const scratchVertex = new THREE.Vector3()
const scratchSphereCenter = new THREE.Vector3()

export const EditRegionMesh = ({ sphereRadius }) => {
  // const [originalRegionBoundaries, setOriginalRegionBoundaries] = useState()
  const editState = useSelector((state) => state.editEventReducer)
  const reduxDispatch = useDispatch()
  // Last validity we published to Redux. The ref-guard means setRegionValid only
  // dispatches on a true<->false transition, keeping Redux churn to validity *changes*
  // — one dispatch per commit now, and (when the per-frame single-pin regen lands) a
  // dispatch only when validity flips, not every frame.
  const lastValidRef = useRef(null)
  const setRegionValid = (valid) => {
    if (lastValidRef.current !== valid) {
      lastValidRef.current = valid
      reduxDispatch(editEventStateActions.setRegionValid(valid))
    }
  }
  let regionMeshRef = useRef()
  let regionLinesRef = useRef()
  const [linePoints, setLinePoints] = useState([])
  // Buffer snapshot captured on the first useFrame of a whole-region drag, used
  // to keep the polygon visually live without re-running ear-clipping or
  // allocating new GPU buffers each frame. See useFrame below.
  const dragStartPositionsRef = useRef(null)
  // Last rotor this component actually consumed. MouseHandler rewrites the shared
  // rotor every RAF the cursor is over the globe, but the VALUE only changes when the
  // cursor actually moves. Without this guard a paused cursor mid-drag still cost a
  // full ear-clip + subdivide + buffer rewrite every single frame. `rotorValidRef`
  // starts false on each drag so the first frame always builds.
  const lastRotorRef = useRef(new THREE.Quaternion())
  const rotorValidRef = useRef(false)
  // Whole-region drag: the drag-start bounding sphere. That drag is a rigid rotation
  // about the globe origin, so the sphere can be kept correct by rotating its center
  // and leaving the radius alone — no need to re-derive it from the vertices.
  const dragStartSphereRef = useRef(null)
  // Pre-allocated dynamic GPU buffers (allocated once in initGeometryBuffers, reused
  // on every mesh update via TypedArray.set). activeVertex/IndexCount track how
  // much of each buffer is live so the drag loop and draw range ignore the tail.
  const positionAttrRef = useRef(null)
  const indexAttrRef = useRef(null)
  const activeVertexCountRef = useRef(0)
  const activeIndexCountRef = useRef(0)

  // One-time allocation of the large dynamic buffers, attached to the mesh
  // geometry. Replaces the old per-update `new THREE.Float32BufferAttribute(...)`
  // `Uint32BufferAttribute(...)` that churned GPU memory on every commit.
  const initGeometryBuffers = () => {
    if (positionAttrRef.current != null) {
      return
    }
    const geometry = regionMeshRef.current.geometry
    const positionAttr = new THREE.BufferAttribute(new Float32Array(MAX_VERTICES * 3), 3)
    positionAttr.setUsage(THREE.DynamicDrawUsage)
    const indexAttr = new THREE.BufferAttribute(new Uint32Array(MAX_INDICES), 1)
    indexAttr.setUsage(THREE.DynamicDrawUsage)
    geometry.setAttribute("position", positionAttr)
    geometry.setIndex(indexAttr)
    positionAttrRef.current = positionAttr
    indexAttrRef.current = indexAttr
  }

  // Triangulate `baseVertices` and flatten into buffer-ready primitive arrays.
  // Returns null when the region can't be displayed/submitted — either EarClipping
  // throws (clockwise winding, or a degenerate / self-intersecting boundary) OR the
  // triangulated result exceeds the pre-allocated fixed-size buffers. Triangulation
  // is the single source of truth for validity: there is deliberately no winding
  // pre-check (regionWindingSign's centroid-dot heuristic can flip sign for large /
  // pole-spanning CCW regions and falsely reject them). This mirrors the read-only
  // DisplayRegionMesh, which also just lets triangulation throw.
  const buildRegionBuffers = (baseVertices, meshRadius) => {
    let geometry = null
    try {
      geometry = generateRegionMesh(baseVertices, meshRadius)
    } catch (error) {
      console.warn({ "EditRegionMesh: region failed to triangulate, keeping last valid mesh": error })
      return null
    }

    // Flatten everything into primitive arrays for use with OpenGL buffering.
    let flattenedVertices = geometry.vertices.flat()
    let flattenedMeshIndices = geometry.triangles.flat()

    // Capacity guard: the pre-allocated buffers are fixed-size. A region larger than
    // the worst-case budget can't be written, so it is not submittable — treat it as
    // invalid (fall through to the red / block-Submit path) rather than overflowing
    // the typed array. Bump MAX_VERTICES / MAX_INDICES if this fires.
    if (flattenedVertices.length > MAX_VERTICES * 3 || flattenedMeshIndices.length > MAX_INDICES) {
      console.warn({ "EditRegionMesh.writeRegionMesh": `region mesh exceeds buffer capacity (verts ${flattenedVertices.length / 3}/${MAX_VERTICES}, indices ${flattenedMeshIndices.length}/${MAX_INDICES}); skipping update` })
      return null
    }

    return { geometry, flattenedVertices, flattenedMeshIndices }
  }

  // Copy a built geometry into the pre-allocated GPU buffers. Shared by the valid
  // path and the invalid reversed-fill fallback; the caller sets the mesh color.
  const writeGeometryToBuffers = ({ geometry, flattenedVertices, flattenedMeshIndices }) => {
    initGeometryBuffers()
    let positionAttr = positionAttrRef.current
    let indexAttr = indexAttrRef.current

    // Copy into the pre-allocated buffers instead of allocating fresh
    // BufferAttributes each update. setDrawRange renders only the active index
    // slice; the unused tail of each buffer is ignored.
    positionAttr.array.set(flattenedVertices)
    indexAttr.array.set(flattenedMeshIndices)
    activeVertexCountRef.current = geometry.vertices.length
    activeIndexCountRef.current = flattenedMeshIndices.length
    regionMeshRef.current.geometry.setDrawRange(0, flattenedMeshIndices.length)
    positionAttr.needsUpdate = true
    indexAttr.needsUpdate = true
    writeBoundingSphere()
  }

  // Bound the bounding sphere to the ACTIVE vertices. geometry.computeBoundingSphere()
  // walks all MAX_VERTICES including the zeroed tail sitting at the globe center,
  // which is both ~40x more work than needed and produces a hugely inflated sphere.
  // Inflation was harmless for culling, but this runs on the single-pin drag hot path.
  //
  // Tightening it does create an obligation: the whole-region drag branch previously
  // never touched the sphere and got away with it precisely BECAUSE the stale sphere
  // was big enough to cover wherever the mesh rotated to. Now that it is tight, that
  // branch has to keep it up to date too (see useFrame).
  const writeBoundingSphere = () => {
    let geometry = regionMeshRef.current.geometry
    let { center, radius } = computeActiveBoundingSphere(
      positionAttrRef.current.array,
      activeVertexCountRef.current
    )
    if (geometry.boundingSphere == null) {
      geometry.boundingSphere = new THREE.Sphere()
    }
    geometry.boundingSphere.center.set(center.x, center.y, center.z)
    geometry.boundingSphere.radius = radius
  }

  // Triangulate `baseVertices` and write the result into the pre-allocated buffers.
  // Shared by the regionBoundaries layout effect (commit path) and the single-pin
  // drag useFrame (live path). Validity = successful triangulation AND fits the
  // buffers; validity/color are published on ONE path, only after both succeed, so
  // an over-capacity region can't enable Submit while its fill is stale/blank.
  //
  // Invalid edit: publish invalid (Submit disabled) and recolor red. To avoid a
  // confusing blank on first load of an already-invalid stored region (no buffers
  // were ever written), retry with the REVERSED boundary — a merely-clockwise region
  // reverses to CCW and triangulates to the same shape, so it's shown filled in red
  // instead of nothing. A genuinely self-intersecting region fails reversed too; we
  // then keep the last valid buffers (or nothing on first load) and the pins stay
  // visible. `withLinePoints` rebuilds the Drei <Line> wireframe (valid path only);
  // the drag path passes false because the wireframe is hidden during drag and
  // setLinePoints every frame would force a React re-render every frame.
  const writeRegionMesh = (baseVertices, { withLinePoints }) => {
    if (regionMeshRef.current == null) {
      return false
    }

    // Raised above DisplayRegionMesh (+0.01) so the raycaster hits this mesh first
    let meshRadius = sphereRadius + 0.1
    let material = regionMeshRef.current.material

    let built = buildRegionBuffers(baseVertices, meshRadius)

    if (built == null) {
      // Invalid edit: flag red and block Submit. Try to still SHOW the region (in
      // red) via the reversed boundary rather than leaving the mesh blank.
      let reversed = buildRegionBuffers([...baseVertices].reverse(), meshRadius)
      if (reversed != null) {
        writeGeometryToBuffers(reversed)
      }
      material.color.set(editRegionMeshInfo.errorColor)
      setRegionValid(false)
      return false
    }

    // Valid edit: restore the normal color and publish valid, then rebuild the mesh.
    material.color.set(editRegionMeshInfo.validColor)
    setRegionValid(true)

    if (withLinePoints) {
      let linePoints = []
      for (let i = 0; i < built.geometry.lines.length; i++) {
        let lineIndicesArr = built.geometry.lines[i]
        linePoints.push(built.geometry.vertices[lineIndicesArr[0]])
        linePoints.push(built.geometry.vertices[lineIndicesArr[1]])
      }
      setLinePoints(linePoints)
    }

    writeGeometryToBuffers(built)
    return true
  }

  // Region changed => regenerate mesh.
  // useLayoutEffect (not useEffect) so the rebuilt geometry + linePoints commit
  // synchronously BEFORE the browser paints. On drag release, clickAndDrag
  // clears (re-showing the <Line> wireframe) and the boundary commit land in the
  // same render; with a passive effect the wireframe would paint one frame with
  // stale drag-start linePoints before regen ran. Running before paint removes
  // that one-frame flash.
  useLayoutEffect(() => {
    // console.log({ "RegionMeshRegionMesh.useEffect[editState.regionBoundaries]": editState.regionBoundaries })
    if (regionMeshRef.current == null) {
      return
    }
    else if (editState.regionBoundaries.length < 3) {
      // Not enough points for a triangle. No region = not an error, so Submit isn't blocked.
      setRegionValid(true)
      return
    }

    let baseVertices = editState.regionBoundaries.map((boundaryMarker) => [boundaryMarker.x, boundaryMarker.y, boundaryMarker.z])
    writeRegionMesh(baseVertices, { withLinePoints: true })
  }, [editState.regionBoundaries])

  // Live polygon tracking during click-and-drag, without dispatching state. The
  // pin meshes are mutated in place every frame by EditPinMesh; the boundary
  // state in Redux deliberately stays at drag-start values (Step 2 of the perf
  // plan) so EditRegionMesh's regen useEffect doesn't fire. Two drag kinds:
  //
  // - Whole-region drag (mesh.name == Region): every boundary vertex rotates
  //   rigidly, so the triangulation is preserved — snapshot the position buffer
  //   once at drag start and apply the cumulative rotor to the snapshot each
  //   frame. No ear-clipping, no allocations, just an in-place array rewrite.
  //
  // - Single boundary-pin drag (Step 3): only the dragged vertex moves, so the
  //   polygon genuinely reshapes and the triangulation/subdivision must be
  //   rebuilt. We reconstruct the live boundary (drag-start boundary with the
  //   one dragged vertex rotated by the shared rotor — the same transform
  //   EditPinMesh applies) and re-run generateRegionMesh into the pre-allocated
  //   buffers via writeRegionMesh. Per-frame ear-clipping + subdivision is cheap
  //   for the default ~8-pin region; if a large (post-Subdivide) region ever
  //   exceeds budget on slow hardware, throttle this branch (frame-skip counter
  //   or ~250ms debounce) — the pin keeps moving live regardless.
  useFrame(() => {
    if (!editState.clickAndDrag) {
      dragStartPositionsRef.current = null
      dragStartSphereRef.current = null
      rotorValidRef.current = false
      return
    }
    if (regionMeshRef.current == null) {
      return
    }

    // Nothing to do if the cursor hasn't moved since the last frame we handled: the
    // rotor is what drives both drag kinds, so an unchanged rotor means an unchanged
    // result. Skipping here avoids a per-frame re-triangulation while the user holds
    // a pin still. First frame of a drag always passes (rotorValidRef is false).
    if (rotorValidRef.current && lastRotorRef.current.equals(sharedDragRotor.quaternion)) {
      return
    }
    lastRotorRef.current.copy(sharedDragRotor.quaternion)
    rotorValidRef.current = true

    let dragMesh = editState.clickAndDrag.mesh
    let moveAllPins = (dragMesh.name == meshNames.Region)

    if (moveAllPins) {
      let positionAttr = regionMeshRef.current.geometry.attributes.position
      if (!positionAttr) {
        return
      }

      // Only the active vertices are live; the pre-allocated buffer has a zeroed
      // tail we must not snapshot or rotate.
      let activeLength = activeVertexCountRef.current * 3

      // Snapshot on first frame of this drag so subsequent frames apply the
      // cumulative rotor to the original positions (applying to the
      // already-rotated buffer would compound).
      if (dragStartPositionsRef.current == null) {
        dragStartPositionsRef.current = positionAttr.array.slice(0, activeLength)
        // Snapshot the bounding sphere alongside the positions. See writeBoundingSphere:
        // now that the sphere is tight, this branch must maintain it or a region rotated
        // away and back could be wrongly frustum-culled mid-drag.
        let geometry = regionMeshRef.current.geometry
        if (geometry.boundingSphere == null) {
          writeBoundingSphere()
        }
        dragStartSphereRef.current = {
          center: geometry.boundingSphere.center.clone(),
          radius: geometry.boundingSphere.radius,
        }
      }

      // Read the rotor from the shared module (written by MouseHandler.useFrame
      // earlier in this RAF via tree/mount order). Step 2 of the perf plan.
      let arr = positionAttr.array
      let orig = dragStartPositionsRef.current
      for (let i = 0; i < activeLength; i += 3) {
        scratchVertex.set(orig[i], orig[i + 1], orig[i + 2])
        scratchVertex.applyQuaternion(sharedDragRotor.quaternion)
        arr[i + 0] = scratchVertex.x
        arr[i + 1] = scratchVertex.y
        arr[i + 2] = scratchVertex.z
      }
      positionAttr.needsUpdate = true

      // Rigid rotation about the globe origin: rotate the drag-start center, keep the
      // radius. Cheaper and exactly equivalent to re-deriving it from the vertices.
      let dragStartSphere = dragStartSphereRef.current
      scratchSphereCenter.copy(dragStartSphere.center).applyQuaternion(sharedDragRotor.quaternion)
      regionMeshRef.current.geometry.boundingSphere.center.copy(scratchSphereCenter)
      regionMeshRef.current.geometry.boundingSphere.radius = dragStartSphere.radius
      return
    }

    // Single boundary-pin drag: rebuild the polygon live from the dragged vertex.
    if (editState.regionBoundaries.length < 3) {
      return
    }
    // Reconstruct the live boundary: rotate only the dragged marker by the shared
    // rotor (same transform EditPinMesh applies to that pin); leave the rest at their
    // drag-start positions, preserving the CCW order EarClipping requires. `found` is
    // false when the dragged pin is the primary location, which the region boundary is
    // independent of — nothing to rebuild. (A pin with no locationId also lands here,
    // but MouseHandler.enableClickAndDrag has already console.error'd about it.)
    let { baseVertices, found } = buildDraggedBoundary(
      editState.regionBoundaries,
      dragMesh.userData?.locationId,
      sharedDragRotor.quaternion,
      scratchVertex
    )
    if (!found) {
      return
    }

    writeRegionMesh(baseVertices, { withLinePoints: false })
  })

  return (
    <>
      <mesh ref={regionMeshRef} name={meshNames.Region}>
        <meshBasicMaterial color={editRegionMeshInfo.validColor} side={THREE.DoubleSide} wireframe={false} />
      </mesh>
      {/*

      {/* https://github.com/pmndrs/drei?tab=readme-ov-file#line */}
      {/* Hide the triangulation wireframe during drag: Drei's Line builds its
          geometry from the `points` prop and there's no cheap in-place update,
          so leaving it visible would show lines floating off the live-moving
          mesh fill. It snaps back on mouseUp when linePoints regenerates. */}
      {!editState.clickAndDrag && (
        <Line segments={true} points={linePoints} lineWidth={4} >
        </Line>
      )}
    </>
  )
}
