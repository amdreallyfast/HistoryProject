import { useEffect, useRef } from "react"
import * as THREE from "three"
import * as d3Geo from "d3-geo-voronoi"
import { useDispatch, useSelector } from "react-redux"
import { ConvertLatLongToXYZ } from "./convertLatLongXYZ"
import { globeInfo } from "./constValues"

// TODO: latlong grid to fill in gaps >1deg
// TODO: latlong pin object
// TODO: click latlong pin and drag to move point

export function Region({ latLongArr }) {
  const whereLatLongArr = useSelector((state) => state.editPoiReducer.whereLatLongArr)

  const regionMeshRef = useRef()
  const pointsMeshRef = useRef()
  useEffect(() => {
    console.log("MyPolygon -> useEffect -> regionMeshRef")

    let pointsVertices = []
    let longLatArr = []
    whereLatLongArr.forEach((latLong) => {
      // Let the rengered region sit a little above the surface of the globe so that it doesn't 
      // interfere with the surface.
      const [x, y, z] = ConvertLatLongToXYZ(latLong.lat, latLong.long, globeInfo.radius * 1.1)
      pointsVertices.push(x, y, z)

      longLatArr.push([latLong.long, latLong.lat])
    })

    let valuesPerVertex = 3
    let pointsPositionAttribute = new THREE.Float32BufferAttribute(pointsVertices, valuesPerVertex)
    pointsMeshRef.current.geometry.setAttribute("position", pointsPositionAttribute)

    let delaunay = d3Geo.geoDelaunay(longLatArr)
    // let delaunay = d3Geo.geoDelaunay(myGeometry.attributes.position.array)
    let vertexIndices = delaunay.triangles.flat()

    // let myGeometry = new THREE.BoxGeometry(3, 3, 3, 3)
    // console.log(myGeometry)
    // let vertices = myGeometry.attributes.position.array
    // let vertexIndices = myGeometry.index.array

    // let valuesPerVertex = 3
    let regionPositionAttribute = new THREE.Float32BufferAttribute(pointsVertices, valuesPerVertex)
    regionMeshRef.current.geometry.setAttribute("position", regionPositionAttribute)

    let indexValuesPerPoint = 1
    let sphereIndicesAttribute = new THREE.Uint32BufferAttribute(vertexIndices, indexValuesPerPoint)
    regionMeshRef.current.geometry.setIndex(sphereIndicesAttribute)
  }, [regionMeshRef.current, whereLatLongArr])




  // 1 convert lat-long to vertices
  // create triangles
  // if more than three points, create center vertex 
  // create polygon
  // make transparent
  // make Wed

  return (
    <>
      <mesh name="TestRegion" ref={regionMeshRef}>
        <meshBasicMaterial color={0x0fff0} side={THREE.DoubleSide} wireframe={false} />
      </mesh>

      <points name="TestPoints" ref={pointsMeshRef}>
        <pointsMaterial color={0x00fff0} size={0.3} />
      </points>
    </>
  )
}