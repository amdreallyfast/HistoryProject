import * as THREE from "three"
import { Line } from "@react-three/drei"
import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { meshNames } from "../constValues"
import { generateRegionMesh } from "./regionMeshGeometry"

export const EditRegionMesh = ({ sphereRadius }) => {
  // const [originalRegionBoundaries, setOriginalRegionBoundaries] = useState()
  const editState = useSelector((state) => state.editEventReducer)
  let regionMeshRef = useRef()
  let regionLinesRef = useRef()
  const [linePoints, setLinePoints] = useState([])

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

    // offset the mesh just a bit from the sphere so that it will sit on top
    let meshRadius = sphereRadius + 0.01
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

  return (
    <>
      <mesh ref={regionMeshRef} name={meshNames.Region}>
        <meshBasicMaterial color={0x000ff0} side={THREE.DoubleSide} wireframe={false} />
      </mesh>
      {/*

      {/* https://github.com/pmndrs/drei?tab=readme-ov-file#line */}
      <Line segments={true} points={linePoints} lineWidth={4} >
      </Line>
    </>
  )
}
