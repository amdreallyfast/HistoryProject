import * as THREE from "three"
import { useEffect, useRef } from "react"
import { meshNames } from "../constValues"
import { generateRegionMesh } from "./regionMeshGeometry"

export const DisplayRegionMesh = ({ regionBoundaries, sphereRadius, color }) => {
  let regionMeshRef = useRef()

  useEffect(() => {
    if (regionMeshRef.current == null) {
      return
    }
    else if (regionBoundaries.length < 3) {
      return
    }

    // offset the mesh just a bit from the sphere so that it will sit on top
    let meshRadius = sphereRadius + 0.01
    let baseVertices = regionBoundaries.map((point) => [point.x, point.y, point.z])
    let geometry = generateRegionMesh(baseVertices, meshRadius)

    // mesh
    let flattenedVertices = geometry.vertices.flat()
    let flattenedMeshIndices = geometry.triangles.flat()
    let valuesPerVertex = 3
    let valuesPerIndex = 1
    let vertexBuffer = new THREE.Float32BufferAttribute(flattenedVertices, valuesPerVertex)
    regionMeshRef.current.geometry.setAttribute("position", vertexBuffer)
    regionMeshRef.current.geometry.setIndex(new THREE.Uint32BufferAttribute(flattenedMeshIndices, valuesPerIndex))
    regionMeshRef.current.geometry.attributes.position.needsUpdate = true
    regionMeshRef.current.geometry.computeBoundingSphere()
  }, [regionBoundaries])

  // Update color when it changes (for highlighting).
  useEffect(() => {
    if (regionMeshRef.current) {
      regionMeshRef.current.material.color = new THREE.Color(color)
    }
  }, [color])

  return (
    <mesh ref={regionMeshRef} name={meshNames.DisplayRegion}>
      <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent={true} opacity={0.5} />
    </mesh>
  )
}
