import { useEffect, useRef } from "react"
import Delaunator from "delaunator"

function FlatRegion() {

  const regionMeshRef = useRef()
  const pointsMeshRef = useRef()
  useEffect(() => {
    console.log("MyPolygon -> useEffect -> regionMeshRef")
    let values = [
      { name: "one", lat: 0, long: +1, alt: 0 },
      { name: "two", lat: -1.5, long: +0.2, alt: 0 },
      { name: "three", lat: -0.3, long: -1, alt: 0 },
      { name: "four", lat: +0.3, long: -1, alt: 0 },
      { name: "five", lat: +1.5, long: +0.2, alt: 0 }
    ]

    // Note: The Delaunator library here only works for 2D, but we need 3D coordinates.
    // ?? use 3D version instead? (https://github.com/d3/d3-delaunay) it seems to compute a lot more than I want??
    let vertices2D = []
    let vertices3D = []
    values.forEach((point) => {
      vertices2D.push(point.lat, point.long)
      vertices3D.push(point.lat, point.long, point.alt)
    })

    const vertices2DTypedArray = new Float32Array(vertices2D)
    const vertices3DTypedArray = new Float32Array(vertices3D)

    let delaunator = new Delaunator(vertices2DTypedArray)
    let vertexIndices = delaunator.triangles

    // const d3Delaunay = new d3.Delaunay(vertices3DTypedArray)
    // console.log(d3Delaunay)

    // Note: Indices should still work because the 3D vertices are in the exact same order as the 
    // 2D, but with one more value (Z coordinate)
    let posValuesPerPoint = 3
    let positionAttribute = new THREE.Float32BufferAttribute(vertices3D, posValuesPerPoint)
    regionMeshRef.current.geometry.setAttribute("position", positionAttribute)

    let indexValuesPerPoint = 1
    let indicesAttribute = new THREE.Uint32BufferAttribute(vertexIndices, indexValuesPerPoint)
    regionMeshRef.current.geometry.setIndex(indicesAttribute)

    // Extra buffer for points 
    // Note: Use because ThreeJs' mesh cannot display both the mesh _and_ the points in one model.
    let valuesPerVertex = 3
    let pointsPositionAttribute = new THREE.Float32BufferAttribute(sphereVertices, valuesPerVertex)
    pointsMeshRef.current.geometry.setAttribute("position", pointsPositionAttribute)

  }, [regionMeshRef.current])

  return (
    <>
      <mesh name="TestRegion" ref={regionMeshRef}>
        <meshBasicMaterial color={0xff007f} side={THREE.DoubleSide} />
      </mesh>

      <points name="TestPointsRef" ref={pointsMeshRef}>
        <pointsMaterial color={0x00fff0} size={0.3} />
      </points>
    </>
  )
}