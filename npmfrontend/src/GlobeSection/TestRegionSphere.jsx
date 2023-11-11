import { useEffect, useRef } from "react"
import * as THREE from "three"
import * as d3Geo from "d3-geo-voronoi"

export function Region() {
  const sphereMeshRef = useRef()
  const pointsMeshRef = useRef()
  useEffect(() => {
    console.log("MyPolygon -> useEffect -> sphereMeshRef")

    // see if this thing works with a sphere
    let radius = 6
    let widthSegments = 32
    let heightSegments = 16
    let myGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments)
    const vertices3DTypedArray = new Float32Array(myGeometry.attributes.position.array)

    let longLatCoordinates = []
    let long = 0  // Prime Meridian
    let lat = 90  // north pole
    longLatCoordinates.push([long, lat])
    for (let lat = 80; lat >= -30; lat -= 10) {
      // 0 -> -180 = West
      for (let long = 0; long >= -180; long -= 10) {
        longLatCoordinates.push([long, lat])
      }

      // 0 -> +180 = East
      for (let long = 0; long <= 180; long += 10) {
        longLatCoordinates.push([long, lat])
      }
    }
    // console.log({ longLatCoordinates: longLatCoordinates })
    // console.log({ "longLatCoordinates[0]": longLatCoordinates[0] })

    // ??why does "for (let i in arrayOfArrays)" end up flattening the array??
    let sphereVertices = []
    longLatCoordinates.forEach((longLat) => {
      // console.log({ longLat: longLat })
      let longRad = (longLat[0] / 180.0) * Math.PI  // 90 => 1.570795
      let latRad = (longLat[1] / 180.0) * Math.PI   // 0  => 0

      let x = radius * Math.cos(latRad) * Math.sin(longRad)
      let y = radius * Math.sin(latRad)
      let z = radius * Math.cos(latRad) * Math.cos(longRad)
      sphereVertices.push(x, y, z)

      // console.log({
      //   longLat: longLat,
      //   long: longLat[0],
      //   lat: longLat[1],
      //   longRad: longRad,
      //   latRad: latRad,
      //   x: x,
      //   y: y,
      //   z: z
      // })

    })

    // console.log({ vertices: vertices })

    let valuesPerVertex = 3
    let pointsPositionAttribute = new THREE.Float32BufferAttribute(sphereVertices, valuesPerVertex)
    pointsMeshRef.current.geometry.setAttribute("position", pointsPositionAttribute)

    let delaunay = d3Geo.geoDelaunay(longLatCoordinates)
    // let delaunay = d3Geo.geoDelaunay(myGeometry.attributes.position.array)
    let vertexIndices = delaunay.triangles.flat()

    // let myGeometry = new THREE.BoxGeometry(3, 3, 3, 3)
    // console.log(myGeometry)
    // let vertices = myGeometry.attributes.position.array
    // let vertexIndices = myGeometry.index.array

    // let valuesPerVertex = 3
    let spherePositionAttribute = new THREE.Float32BufferAttribute(sphereVertices, valuesPerVertex)
    sphereMeshRef.current.geometry.setAttribute("position", spherePositionAttribute)

    let indexValuesPerPoint = 1
    let sphereIndicesAttribute = new THREE.Uint32BufferAttribute(vertexIndices, indexValuesPerPoint)
    sphereMeshRef.current.geometry.setIndex(sphereIndicesAttribute)
  }, [sphereMeshRef.current])




  // 1 convert lat-long to vertices
  // create triangles
  // if more than three points, create center vertex 
  // create polygon
  // make transparent
  // make Wed

  return (
    <>
      <mesh name="TestSphere" ref={sphereMeshRef}>
        <meshBasicMaterial color={0x0fff0} side={THREE.DoubleSide} wireframe={true} />
      </mesh>

      <points name="TestPointsRef" ref={pointsMeshRef}>
        <pointsMaterial color={0x00fff0} size={0.3} />
      </points>
    </>
  )
}