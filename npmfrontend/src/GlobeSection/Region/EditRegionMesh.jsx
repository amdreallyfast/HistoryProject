import * as THREE from "three"
import { Line } from "@react-three/drei"
import { useLayoutEffect, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { useSelector } from "react-redux"
import { meshNames, editRegionMeshInfo } from "../constValues"
import { generateRegionMesh, isRegionWindingValid } from "./regionMeshGeometry"

// Worst-case capacity for the pre-allocated region-mesh buffers. The geometry is
// triangulated (EarClipping) then subdivided (MeshSubdivider, maxEdgeLength 0.5),
// so vertex count grows well past the boundary-pin count. MAX_INDICES is sized at
// ~8 indices/vertex (a triangulated disk yields ~2 triangles/vertex => 6 indices,
// plus margin). Buffers are allocated once and reused; see ensureBuffers below.
const MAX_VERTICES = 4096
const MAX_INDICES = MAX_VERTICES * 8

export const EditRegionMesh = ({ sphereRadius }) => {
  // const [originalRegionBoundaries, setOriginalRegionBoundaries] = useState()
  const editState = useSelector((state) => state.editEventReducer)
  let regionMeshRef = useRef()
  let regionLinesRef = useRef()
  const [linePoints, setLinePoints] = useState([])
  // Buffer snapshot captured on the first useFrame of a whole-region drag, used
  // to keep the polygon visually live without re-running ear-clipping or
  // allocating new GPU buffers each frame. See useFrame below.
  const dragStartPositionsRef = useRef(null)
  // Pre-allocated dynamic GPU buffers (allocated once in ensureBuffers, reused
  // on every mesh update via TypedArray.set). activeVertex/IndexCount track how
  // much of each buffer is live so the drag loop and draw range ignore the tail.
  const positionAttrRef = useRef(null)
  const indexAttrRef = useRef(null)
  const activeVertexCountRef = useRef(0)
  const activeIndexCountRef = useRef(0)

  // One-time allocation of the large dynamic buffers, attached to the mesh
  // geometry. Replaces the old per-update `new THREE.Float32BufferAttribute(...)`
  // / `Uint32BufferAttribute(...)` that churned GPU memory on every commit.
  const ensureBuffers = () => {
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
      // Not enough points for a triangle
      return
    }

    // Raised above DisplayRegionMesh (+0.01) so the raycaster hits this mesh first
    let meshRadius = sphereRadius + 0.1
    let baseVertices = editState.regionBoundaries.map((boundaryMarker) => [boundaryMarker.x, boundaryMarker.y, boundaryMarker.z])

    // Validity = correct winding AND successful triangulation. An invalid edit
    // (most commonly clockwise winding) must NOT overwrite the buffers: we keep
    // the last valid mesh on screen and recolor it red, instead of letting
    // EarClipping throw (which the ErrorBoundary would otherwise catch by dropping
    // the mesh entirely). The pre-allocated buffer holds the last valid geometry,
    // so "remembering" it is free — we simply skip the write.
    let material = regionMeshRef.current.material
    let geometry = null
    if (isRegionWindingValid(baseVertices)) {
      try {
        geometry = generateRegionMesh(baseVertices, meshRadius)
      } catch (error) {
        // CCW winding but still untriangulatable (degenerate / self-intersecting).
        console.warn({ "EditRegionMesh: region failed to triangulate, keeping last valid mesh": error })
      }
    }

    if (geometry == null) {
      // Invalid edit: keep the last valid geometry (buffers untouched) and flag red.
      material.color = new THREE.Color(editRegionMeshInfo.errorColor)
      return
    }

    // Valid edit: restore the normal color, then rebuild the mesh below.
    material.color = new THREE.Color(editRegionMeshInfo.validColor)

    // wireframe
    let linePoints = []
    for (let i = 0; i < geometry.lines.length; i++) {
      let lineIndicesArr = geometry.lines[i]
      linePoints.push(geometry.vertices[lineIndicesArr[0]])
      linePoints.push(geometry.vertices[lineIndicesArr[1]])
    }
    // setLinePoints(thing)
    setLinePoints(linePoints)

    // mesh
    // Flatten everything into primitive arrays for use with OpenGL buffering
    let flattenedVertices = geometry.vertices.flat()
    let flattenedMeshIndices = geometry.triangles.flat()

    // Capacity guard: the pre-allocated buffers are fixed-size. A region larger
    // than the worst-case budget is dropped (skip the write) rather than
    // overflowing the typed array — strictly safer than the old silent grow.
    // Bump MAX_VERTICES / MAX_INDICES if this ever fires for a real region.
    if (flattenedVertices.length > MAX_VERTICES * 3 || flattenedMeshIndices.length > MAX_INDICES) {
      console.warn({ "EditRegionMesh.useEffect[regionBoundaries]": `region mesh exceeds buffer capacity (verts ${flattenedVertices.length / 3}/${MAX_VERTICES}, indices ${flattenedMeshIndices.length}/${MAX_INDICES}); skipping update` })
      return
    }

    ensureBuffers()
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
    // Conservative bounds: computeBoundingSphere reads the full position buffer
    // including the zeroed tail (globe center), so the sphere is larger than the
    // mesh. That only ever makes frustum culling less aggressive (never culls a
    // visible mesh), which is fine for a single in-view region during editing.
    regionMeshRef.current.geometry.computeBoundingSphere()
  }, [editState.regionBoundaries])

  // Live polygon tracking during whole-region drag, without dispatching state.
  // The pin meshes are mutated in place every frame by EditPinMesh; the
  // boundary state in Redux deliberately stays at drag-start values (Step 2 of
  // the perf plan) so EditRegionMesh's regen useEffect doesn't fire. To keep
  // the polygon visually attached to the pins, snapshot the position buffer
  // once at drag start and apply the cumulative rotor to the snapshot each
  // frame — same rigid rotation that EditPinMesh applies to each pin. No new
  // BufferAttributes, no ear-clipping, just an in-place array rewrite.
  //
  // Single-pin drags (mesh.name == PinBoundingBox) are skipped on purpose:
  // only one boundary vertex moves and the dependent midpoints inserted by
  // MeshSubdivider would also need updating. Those drags keep the
  // snap-on-release behavior from Step 2.
  useFrame(() => {
    if (!editState.clickAndDrag) {
      dragStartPositionsRef.current = null
      return
    }
    if (regionMeshRef.current == null) {
      return
    }

    let moveAllPins = (editState.clickAndDrag.mesh.name == meshNames.Region)
    if (!moveAllPins) {
      return
    }

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
    }

    let qValues = editState.clickAndDrag.rotorQuaternion
    let qRotor = new THREE.Quaternion(qValues.x, qValues.y, qValues.z, qValues.w)
    let arr = positionAttr.array
    let orig = dragStartPositionsRef.current
    let v = new THREE.Vector3()
    for (let i = 0; i < activeLength; i += 3) {
      v.set(orig[i], orig[i + 1], orig[i + 2])
      v.applyQuaternion(qRotor)
      arr[i + 0] = v.x
      arr[i + 1] = v.y
      arr[i + 2] = v.z
    }
    positionAttr.needsUpdate = true
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
