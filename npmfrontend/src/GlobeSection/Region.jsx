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

    const miniRegionWidthScalar = 2
    let x00DegLength = Math.cos(0) * miniRegionWidthScalar
    let x45DegLength = Math.cos(Math.PI / 4) * miniRegionWidthScalar
    let x90DegLength = Math.cos(Math.PI / 2) * miniRegionWidthScalar
    let y00DegLength = Math.sin(0) * miniRegionWidthScalar
    let y45DegLength = Math.sin(Math.PI / 4) * miniRegionWidthScalar
    let y90DegLength = Math.sin(Math.PI / 2) * miniRegionWidthScalar

    // Mini region filler points around each user-added point
    whereLatLongArr.forEach((latLong, index) => {
      // Make each user-added point a tiny region on its own by adding 8x extra points from the
      // 45 degrees around the unit circle.
      let miniPointRegionLongLatArr = []
      miniPointRegionLongLatArr.push([latLong.long, latLong.lat])
      // let axisLength = 1 * miniRegionWidthScalar
      // let fortyFiveDegLength = (Math.sqrt(2.0) * 0.5) * miniRegionWidthScalar
      // console.log(sqrt2Over2)
      // fillerLongLatArr.push([latLong.long + axisLength, latLong.lat + 0]) // (x+1,y+0)
      // fillerLongLatArr.push([latLong.long + fortyFiveDegLength, latLong.lat + fortyFiveDegLength])
      // fillerLongLatArr.push([latLong.long + 0, latLong.lat + 1]) // (x+0,y+1)
      // fillerLongLatArr.push([latLong.long - fortyFiveDegLength, latLong.lat + fortyFiveDegLength])
      // fillerLongLatArr.push([latLong.long - 1, latLong.lat + 0]) // (x-1,y+0)
      // fillerLongLatArr.push([latLong.long - fortyFiveDegLength, latLong.lat - fortyFiveDegLength])
      // fillerLongLatArr.push([latLong.long + 0, latLong.lat - 1]) // (x+0,y-1)
      // fillerLongLatArr.push([latLong.long + fortyFiveDegLength, latLong.lat - fortyFiveDegLength])

      // Go around the unit circle
      miniPointRegionLongLatArr.push([latLong.long + x00DegLength, latLong.lat + y00DegLength]) // (x+1,y+0)
      miniPointRegionLongLatArr.push([latLong.long + x45DegLength, latLong.lat + y45DegLength])
      miniPointRegionLongLatArr.push([latLong.long + x90DegLength, latLong.lat + y90DegLength]) // (x+0,y+1)
      miniPointRegionLongLatArr.push([latLong.long - x45DegLength, latLong.lat + y45DegLength])
      miniPointRegionLongLatArr.push([latLong.long - x00DegLength, latLong.lat + y00DegLength]) // (x-1,y+0)
      miniPointRegionLongLatArr.push([latLong.long - x45DegLength, latLong.lat - y45DegLength])
      miniPointRegionLongLatArr.push([latLong.long + x90DegLength, latLong.lat - y90DegLength]) // (x+0,y-1)
      miniPointRegionLongLatArr.push([latLong.long + x45DegLength, latLong.lat - y45DegLength])

      // Triangulate the filler points to make a mesh.
      let delaunay = d3Geo.geoDelaunay(miniPointRegionLongLatArr)
      let indices = delaunay.triangles.flat()
      // console.log(typedArr)
      let numExistingVertices = fillerPointsArr.length / 3
      let poiMiniRegionIndices = indices.map((index) => index + numExistingVertices)
      fillerIndicesArr.push(...poiMiniRegionIndices)

      // Convert the filler points to their own vertices.
      miniPointRegionLongLatArr.forEach((longLat) => {
        let lat = longLat[1]
        let long = longLat[0]
        const [x, y, z] = ConvertLatLongToXYZ(lat, long, globeInfo.regionRadius)
        fillerPointsArr.push(x, y, z)
      })
      console.log({ fillerPointsArr: fillerPointsArr, fillerIndicesArr: fillerIndicesArr })
    })

    // Interpolated region between points
    for (let i = 1; i < whereLatLongArr.length; i++) {
      let endLatLong = whereLatLongArr[i]
      let endPoint = new THREE.Vector2(endLatLong.long, endLatLong.lat)

      let startLatLong = whereLatLongArr[i - 1]
      let startPoint = new THREE.Vector2(startLatLong.long, startLatLong.lat)

      let dirVector = new THREE.Vector2()
      dirVector.subVectors(endPoint, startPoint)
      let lengthAToB = dirVector.length()
      let unitDirVector = dirVector.clone().normalize()

      // console.log({ lengthAToB: lengthAToB })

      // Get 2x parallel vectors a little ways off the center.
      let perpendicular1 = new THREE.Vector2(-unitDirVector.y, unitDirVector.x).multiplyScalar(miniRegionWidthScalar)
      let parallelStart1 = (new THREE.Vector2()).addVectors(startPoint, perpendicular1)
      let parallelEnd1 = (new THREE.Vector2()).addVectors(endPoint, perpendicular1)
      let parallelDirVector1 = (new THREE.Vector2()).subVectors(parallelEnd1, parallelStart1)

      let perpendicular2 = new THREE.Vector2(unitDirVector.y, -unitDirVector.x).multiplyScalar(miniRegionWidthScalar)
      let parallelStart2 = (new THREE.Vector2()).addVectors(startPoint, perpendicular2)
      let parallelEnd2 = (new THREE.Vector2()).addVectors(endPoint, perpendicular2)
      let parallelDirVector2 = (new THREE.Vector2()).subVectors(parallelEnd2, parallelStart2)

      let fillerLongLatArr = []
      fillerLongLatArr.push(parallelStart1)
      fillerLongLatArr.push(parallelEnd1)
      fillerLongLatArr.push(parallelStart2)
      fillerLongLatArr.push(parallelEnd2)
      // console.log({ a: prevPoint, b: parallelStartVector1, c: parallelStartVector2 })
      fillerLongLatArr.forEach((longLat) => {
        // console.log(longLat)
        let lat = longLat.y
        let long = longLat.x
        const [x, y, z] = ConvertLatLongToXYZ(lat, long, globeInfo.regionRadius)

        fillerPointsArr.push(x, y, z)
      })

      // Want 1 point approximately every 1 degree of lat and long.
      // Ex: 
      //  Distance between points is 10.347 => 9 segments => 8 interpolated points
      let maxInterpolatedDist = 2
      let numInterpolationPoints = (Math.floor(lengthAToB) - 1) / maxInterpolatedDist
      let distFractionPerInterpolatedPoint = (lengthAToB / numInterpolationPoints) / lengthAToB
      let interpolatedLongLatArr = []
      for (let pointCount = 0; pointCount <= numInterpolationPoints; pointCount++) {
        let distFraction = distFractionPerInterpolatedPoint * pointCount

        // Direct interpolation longLat between start and end.
        let direct = (new THREE.Vector2()).lerpVectors(startPoint, endPoint, distFraction)
        interpolatedLongLatArr.push([direct.x, direct.y])
        let directXYZ = ConvertLatLongToXYZ(direct.y, direct.x, globeInfo.regionRadius)
        fillerPointsArr.push(...directXYZ)

        let parallel1 = (new THREE.Vector2()).lerpVectors(parallelStart1, parallelEnd1, distFraction)
        interpolatedLongLatArr.push([parallel1.x, parallel1.y])
        let parallelXYZ1 = ConvertLatLongToXYZ(parallel1.y, parallel1.x, globeInfo.regionRadius)
        fillerPointsArr.push(...parallelXYZ1)

        let parallel2 = (new THREE.Vector2()).lerpVectors(parallelStart2, parallelEnd2, distFraction)
        interpolatedLongLatArr.push([parallel2.x, parallel2.y])
        let parallelXYZ2 = ConvertLatLongToXYZ(parallel2.y, parallel2.x, globeInfo.regionRadius)
        fillerPointsArr.push(...parallelXYZ2)

        // interpolatedLongLatArr.push(...directInterpolatedLongLat)
        // interpolatedLongLatArr.push(...parallelInterpolatedLongLat1)
        // interpolatedLongLatArr.push(...parallelInterpolatedLongLat2)
      }

      // console.log({ interpolatedLongLatArr: interpolatedLongLatArr })
      // Triangulate the filler points to make a mesh.
      let delaunay = d3Geo.geoDelaunay(interpolatedLongLatArr)
      let indices = delaunay.triangles.flat()
      let numExistingVertices = fillerPointsArr.length / 3
      let poiMiniRegionIndices = indices.map((index) => index + numExistingVertices)
      fillerIndicesArr.push(...poiMiniRegionIndices)
      console.log(poiMiniRegionIndices)



      interpolatedLongLatArr.forEach((longLat) => {
        let lat = longLat[1]
        let long = longLat[0]
        const [x, y, z] = ConvertLatLongToXYZ(lat, long, globeInfo.regionRadius)
        fillerPointsArr.push(x, y, z)
      })

      // // console.log(interpolatedPoints)
      // // console.log({ rounded: numInterpolationPoints, dist: distFraction })
      // console.log({ a: currPoint, b: prevPoint, d: directionVector, i: interpolatedPoints })
    }





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
        <pointsMaterial color={0x00fff0} size={0.08} />
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