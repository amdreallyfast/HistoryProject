import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import * as d3Geo from "d3-geo-voronoi"
import { useDispatch, useSelector } from "react-redux"
import { ConvertLatLongToXYZ } from "./convertLatLongXYZ"
import { globeInfo } from "./constValues"
import { LatLongPin } from "./LatLongPin"

// TODO: latlong grid to fill in gaps >1deg
// TODO: latlong pin object
// TODO: click latlong pin and drag to move point

export function Region({ latLongArr }) {
  const whereLatLongArr = useSelector((state) => state.editPoiReducer.whereLatLongArr)
  const [latLongPinReactElements, setLatLongPinReactElements] = useState()

  const solidRegionMeshRef = useRef()
  const wireframeRegionMeshRef = useRef()
  const userAddedPointsMeshRef = useRef()
  const fillerPointsRef = useRef()
  const fillerPointsMeshRef = useRef()

  // TODO:
  // foreach user-added point
  //  create 6 surrounding points


  const regionMeshRef = useRef()
  const pointsMeshRef = useRef()
  useEffect(() => {
    console.log("MyPolygon -> useEffect -> regionMeshRef")

    let userAddedPointsArr = []
    let fillerPointsArr = []
    let fillerIndicesArr = []
    let allPoints = []

    setLatLongPinReactElements(
      whereLatLongArr?.map(
        (latLongJson, index) => {
          return (
            <LatLongPin
              key={index}
              latLong={latLongJson} />
          )
        }
      )
    )

    // User-added points
    whereLatLongArr.forEach((latLong, index) => {
      const [x, y, z] = ConvertLatLongToXYZ(latLong.lat, latLong.long, globeInfo.regionRadius)
      userAddedPointsArr.push(x, y, z)
    })

    // Filler points
    whereLatLongArr.forEach((latLong, index) => {
      // Make each user-added point a tiny region on its own by adding 8x extra points from the
      // 45 degrees around the unit circle.
      let fillerLongLatArr = []
      fillerLongLatArr.push([latLong.long, latLong.lat])
      let sqrt2Over2 = Math.sqrt(2.0) / 2.0
      // console.log(sqrt2Over2)
      fillerLongLatArr.push([latLong.long + 1, latLong.lat + 0]) // (x+1,y+0)
      fillerLongLatArr.push([latLong.long + sqrt2Over2, latLong.lat + sqrt2Over2])
      fillerLongLatArr.push([latLong.long + 0, latLong.lat + 1]) // (x+0,y+1)
      fillerLongLatArr.push([latLong.long - sqrt2Over2, latLong.lat + sqrt2Over2])
      fillerLongLatArr.push([latLong.long - 1, latLong.lat + 0]) // (x-1,y+0)
      fillerLongLatArr.push([latLong.long - sqrt2Over2, latLong.lat - sqrt2Over2])
      fillerLongLatArr.push([latLong.long + 0, latLong.lat - 1]) // (x+0,y-1)
      fillerLongLatArr.push([latLong.long + sqrt2Over2, latLong.lat - sqrt2Over2])

      // Triangulate the filler points to make a mesh.
      let delaunay = d3Geo.geoDelaunay(fillerLongLatArr)
      let indices = delaunay.triangles.flat()
      let wholeRegionIndices = indices.map((index) => {
        return index + (fillerPointsArr.length / 3)
      })

      fillerIndicesArr.push(...wholeRegionIndices)

      // Convert the filler points to their own vertices.
      fillerLongLatArr.forEach((longLat) => {
        let lat = longLat[1]
        let long = longLat[0]
        const [x, y, z] = ConvertLatLongToXYZ(lat, long, globeInfo.regionRadius)

        fillerPointsArr.push(x, y, z)
      })

      console.log({ fillerPointsArr: fillerPointsArr, fillerIndicesArr: fillerIndicesArr })
    })




    //   for (let i = 0; i < whereLatLongArr.length; i++) {
    //     let latLong = whereLatLongArr[i]

    //     // User-added point
    //     const [x, y, z] = ConvertLatLongToXYZ(latLong.lat, latLong.long, globeInfo.regionRadius)
    //     userAddedPointsArr.push(x, y, z)

    //     // Make each user-added point a tiny region on its own by adding 8x extra points from the
    //     // 45 degrees around the unit circle.
    //     let fillerLongLatArr = []
    //     fillerLongLatArr.push([latLong.long, latLong.lat])
    //     let sqrt2Over2 = Math.sqrt(2.0) / 2.0
    //     // console.log(sqrt2Over2)
    //     fillerLongLatArr.push([latLong.long + 1, latLong.lat + 0]) // (x+1,y+0)
    //     fillerLongLatArr.push([latLong.long + sqrt2Over2, latLong.lat + sqrt2Over2])
    //     fillerLongLatArr.push([latLong.long + 0, latLong.lat + 1]) // (x+0,y+1)
    //     fillerLongLatArr.push([latLong.long - sqrt2Over2, latLong.lat + sqrt2Over2])
    //     fillerLongLatArr.push([latLong.long - 1, latLong.lat + 0]) // (x-1,y+0)
    //     fillerLongLatArr.push([latLong.long - sqrt2Over2, latLong.lat - sqrt2Over2])
    //     fillerLongLatArr.push([latLong.long + 0, latLong.lat - 1]) // (x+0,y-1)
    //     fillerLongLatArr.push([latLong.long + sqrt2Over2, latLong.lat - sqrt2Over2])

    //     // Convert the filler points to their own vertices.
    //     fillerLongLatArr.forEach((longLat) => {
    //       let lat = longLat[1]
    //       let long = longLat[0]
    //       const [x, y, z] = ConvertLatLongToXYZ(lat, long, globeInfo.regionRadius)

    //       fillerPointsArr.push(x, y, z)
    //     })

    //     // Triangulate the filler points to make a mesh.
    //     let delaunay = d3Geo.geoDelaunay(fillerLongLatArr)
    //     let triangleIndices = delaunay.triangles.flat()
    //     fillerIndicesArr.push(...triangleIndices)

    //     // console.log(fillerIndicesArr)
    //   }

    // console.log(fillerIndicesArr)
    let valuesPerVertex = 3
    let valuesPerIndex = 1

    // // console.log({ userAddedPointsArr: userAddedPointsArr })
    // // Create geometry for user-added points
    // let userAddedPointsPosAttr = new THREE.Float32BufferAttribute(userAddedPointsArr, valuesPerVertex)
    // userAddedPointsMeshRef.current.geometry.setAttribute("position", userAddedPointsPosAttr)

    // Create geometry for the filler points
    let fillerPointsPosAttr = new THREE.Float32BufferAttribute(fillerPointsArr, valuesPerVertex)
    let fillerPointsIndicesAttr = new THREE.Uint32BufferAttribute(fillerIndicesArr, valuesPerIndex)

    fillerPointsRef.current.geometry.setAttribute("position", fillerPointsPosAttr)
    fillerPointsMeshRef.current.geometry.setAttribute("position", fillerPointsPosAttr)
    fillerPointsMeshRef.current.geometry.setIndex(fillerPointsIndicesAttr)

    //   // let pointsVertices = []
    //   // let longLatArr = []
    //   // whereLatLongArr.forEach((latLong) => {
    //   //   // Let the rengered region sit a little above the surface of the globe so that it doesn't 
    //   //   // interfere with the surface.
    //   //   const [x, y, z] = ConvertLatLongToXYZ(latLong.lat, latLong.long, globeInfo.regionRadius)
    //   //   pointsVertices.push(x, y, z)

    //   //   longLatArr.push([latLong.long, latLong.lat])
    //   // })

    //   // let valuesPerVertex = 3
    //   // let pointsPositionAttribute = new THREE.Float32BufferAttribute(pointsVertices, valuesPerVertex)
    //   // pointsMeshRef.current.geometry.setAttribute("position", pointsPositionAttribute)

    //   // let delaunay = d3Geo.geoDelaunay(longLatArr)
    //   // // let delaunay = d3Geo.geoDelaunay(myGeometry.attributes.position.array)
    //   // let vertexIndices = delaunay.triangles.flat()

    //   // // let myGeometry = new THREE.BoxGeometry(3, 3, 3, 3)
    //   // // console.log(myGeometry)
    //   // // let vertices = myGeometry.attributes.position.array
    //   // // let vertexIndices = myGeometry.index.array

    //   // // let valuesPerVertex = 3
    //   // let regionPositionAttribute = new THREE.Float32BufferAttribute(pointsVertices, valuesPerVertex)
    //   // regionMeshRef.current.geometry.setAttribute("position", regionPositionAttribute)

    //   // let indexValuesPerPoint = 1
    //   // let sphereIndicesAttribute = new THREE.Uint32BufferAttribute(vertexIndices, indexValuesPerPoint)
    //   // regionMeshRef.current.geometry.setIndex(sphereIndicesAttribute)
  }, [userAddedPointsMeshRef.current, whereLatLongArr])




  // 1 convert lat-long to vertices
  // create triangles
  // if more than three points, create center vertex 
  // create polygon
  // make transparent
  // make Wed

  return (
    <>
      {/* <mesh name="TestRegion" ref={regionMeshRef}>
        <meshBasicMaterial color={0x0fff0} side={THREE.DoubleSide} wireframe={false} />
      </mesh> */}

      {/* <points name="TestPoints" ref={pointsMeshRef}>
        <pointsMaterial color={0x00fff0} size={0.3} />
      </points> */}

      <points name="UserAddedPoints" ref={userAddedPointsMeshRef}>
        <pointsMaterial color={0x00fff0} size={0.2} />
      </points>

      <points name="IntermediatePoints" ref={fillerPointsRef}>
        <pointsMaterial color={0x00fff0} size={0.03} />
      </points>

      <mesh name="IntermediatePointsMesh" ref={fillerPointsMeshRef}>
        <meshBasicMaterial color={0x00ff00} side={THREE.DoubleSide} wireframe={false} />
      </mesh>

      <group name="LatLongPins">
        {latLongPinReactElements}
      </group>
    </>
  )
}