import * as THREE from "three"
import { Line } from "@react-three/drei"
import { useEffect, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { useSelector } from "react-redux"
import { meshNames } from "../constValues"
import { generateRegionMesh } from "./regionMeshGeometry"
import { sharedDragRotor } from "../sharedDragRotor"

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

  // Region changed => regenerate mesh
  useEffect(() => {
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
    let geometry = generateRegionMesh(baseVertices, meshRadius)

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
    let valuesPerVertex = 3
    let valuesPerIndex = 1
    let vertexBuffer = new THREE.Float32BufferAttribute(flattenedVertices, valuesPerVertex)
    regionMeshRef.current.geometry.setAttribute("position", vertexBuffer)
    regionMeshRef.current.geometry.setIndex(new THREE.Uint32BufferAttribute(flattenedMeshIndices, valuesPerIndex))
    regionMeshRef.current.geometry.attributes.position.needsUpdate = true
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

    // Snapshot on first frame of this drag so subsequent frames apply the
    // cumulative rotor to the original positions (applying to the
    // already-rotated buffer would compound).
    if (dragStartPositionsRef.current == null) {
      dragStartPositionsRef.current = new Float32Array(positionAttr.array)
    }

    // Read the rotor from the shared module (written by MouseHandler.useFrame
    // earlier in this RAF via tree order). Previously this was pulled from
    // editState.clickAndDrag.rotorQuaternion via useSelector, which gave us
    // last-render's value — one frame behind the cursor. Step 4 of the plan.
    let arr = positionAttr.array
    let orig = dragStartPositionsRef.current
    let v = new THREE.Vector3()
    for (let i = 0; i < arr.length; i += 3) {
      v.set(orig[i], orig[i + 1], orig[i + 2])
      v.applyQuaternion(sharedDragRotor.quaternion)
      arr[i + 0] = v.x
      arr[i + 1] = v.y
      arr[i + 2] = v.z
    }
    positionAttr.needsUpdate = true
  })

  return (
    <>
      <mesh ref={regionMeshRef} name={meshNames.Region}>
        <meshBasicMaterial color={0x000ff0} side={THREE.DoubleSide} wireframe={false} />
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
