import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { useSelector } from "react-redux"
import { ConvertLatLongToXYZ } from "./convertLatLongXYZ"
import { globeInfo } from "./constValues"
import { LatLongPin } from "./LatLongPin"
import Delaunator from "delaunator"

// TODO: latlong grid to fill in gaps >1deg
// TODO: latlong pin object
// TODO: click latlong pin and drag to move point

export function Region({ latLongArr }) {
  const whereLatLongArr = useSelector((state) => state.editPoiReducer.whereLatLongArr)
  const [latLongPinReactElements, setLatLongPinReactElements] = useState()

  const fillerPointsRef = useRef()
  const fillerPointsMeshRef = useRef()
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

    const miniRegionWidthScalar = 3
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
      miniPointRegionLongLatArr.push([latLong.long + x00DegLength, latLong.lat + y00DegLength]) // (x+1,y+0)
      miniPointRegionLongLatArr.push([latLong.long + x45DegLength, latLong.lat + y45DegLength])
      miniPointRegionLongLatArr.push([latLong.long + x90DegLength, latLong.lat + y90DegLength]) // (x+0,y+1)
      miniPointRegionLongLatArr.push([latLong.long - x45DegLength, latLong.lat + y45DegLength])
      miniPointRegionLongLatArr.push([latLong.long - x00DegLength, latLong.lat + y00DegLength]) // (x-1,y+0)
      miniPointRegionLongLatArr.push([latLong.long - x45DegLength, latLong.lat - y45DegLength])
      miniPointRegionLongLatArr.push([latLong.long + x90DegLength, latLong.lat - y90DegLength]) // (x+0,y-1)
      miniPointRegionLongLatArr.push([latLong.long + x45DegLength, latLong.lat - y45DegLength])

      // Triangulate the filler points to make a mesh.
      // TODO: _start_ with a pre-allocated typed array and fill it in
      const typedArr = new Float32Array(miniPointRegionLongLatArr.flat())
      let delaunator = new Delaunator(typedArr)
      let indices = delaunator.triangles
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
    })

    // Interpolated region between points
    for (let i = 1; i < whereLatLongArr.length; i++) {
      // Source:
      //  https://en.wikipedia.org/wiki/Slerp
      // Summary:
      //  Convert latLong -> 3D vectors
      //  Get unit vectors
      //  Use dot product + acos(...) to get angle
      //  Interpolate fraction from 0 -> 1
      //    fractionStartVector = sin((1 - fraction) * angle) / sin(angle)
      //    fractionEndVector = sin(fraction * angle) / sin(angle)
      //    interpolatedVector = fractionStartVector * startVector + fractionEndVector * endVector
      let startLat = whereLatLongArr[i].lat
      let startLong = whereLatLongArr[i].long
      let endLat = whereLatLongArr[i - 1].lat
      let endLong = whereLatLongArr[i - 1].long
      const [startX, startY, startZ] = ConvertLatLongToXYZ(startLat, startLong, globeInfo.regionRadius)
      const [endX, endY, endZ] = ConvertLatLongToXYZ(endLat, endLong, globeInfo.regionRadius)

      let startVec3 = new THREE.Vector3(startX, startY, startZ)
      let endVec3 = new THREE.Vector3(endX, endY, endZ)
      console.log({ start: startVec3, end: endVec3 })

      let unitStartVec3 = startVec3.clone().normalize()
      let unitEndVec3 = endVec3.clone().normalize()
      let cosAngle = unitStartVec3.dot(unitEndVec3)
      let angleRad = Math.acos(cosAngle)
      let angle = angleRad * (180.0 / Math.PI)

      let numPoints = 10
      let arcSegmentLength = angle / numPoints
      let interpolatedPoints = []
      for (let i = 0; i <= numPoints; i++) {
        // let arcAngle = arcSegmentLength * i
        // interpolatedAngles.push(arcAngle)

        // Should vary from 0 -> 1
        let fraction = i / numPoints
        let startScaler = Math.sin((1 - fraction) * angleRad) / Math.sin(angleRad)
        let scaledStartVec3 = startVec3.clone().multiplyScalar(startScaler)

        let endScalar = Math.sin(fraction * angleRad) / Math.sin(angleRad)
        let scaledEndVec3 = endVec3.clone().multiplyScalar(endScalar)

        let interpolated = (new THREE.Vector3()).addVectors(scaledStartVec3, scaledEndVec3)
        interpolatedPoints.push(interpolated)
        fillerPointsArr.push(...interpolated)
      }
      console.log({ angle: angle, interpolated: interpolatedPoints })



      // console.log({ cos: cosAngle, angle: angle })
      // let dot = startVec3.normalize().dot(endVec3.normalize())
      // console.log({ start: startVec3, end: endVec3, dot: dot })



      //   let endLatLong = whereLatLongArr[i]
      //   let endPoint = new THREE.Vector2(endLatLong.long, endLatLong.lat)

      //   let startLatLong = whereLatLongArr[i - 1]
      //   let startPoint = new THREE.Vector2(startLatLong.long, startLatLong.lat)

      //   let dirVector = new THREE.Vector2()
      //   dirVector.subVectors(endPoint, startPoint)
      //   let lengthAToB = dirVector.length()
      //   let unitDirVector = dirVector.clone().normalize()

      //   // console.log({ lengthAToB: lengthAToB })

      //   // Get 2x parallel vectors a little ways off the center.
      //   let perpendicular1 = new THREE.Vector2(-unitDirVector.y, unitDirVector.x).multiplyScalar(miniRegionWidthScalar)
      //   let parallelStart1 = (new THREE.Vector2()).addVectors(startPoint, perpendicular1)
      //   let parallelEnd1 = (new THREE.Vector2()).addVectors(endPoint, perpendicular1)
      //   let parallelDirVector1 = (new THREE.Vector2()).subVectors(parallelEnd1, parallelStart1)

      //   let perpendicular2 = new THREE.Vector2(unitDirVector.y, -unitDirVector.x).multiplyScalar(miniRegionWidthScalar)
      //   let parallelStart2 = (new THREE.Vector2()).addVectors(startPoint, perpendicular2)
      //   let parallelEnd2 = (new THREE.Vector2()).addVectors(endPoint, perpendicular2)
      //   let parallelDirVector2 = (new THREE.Vector2()).subVectors(parallelEnd2, parallelStart2)

      //   let fillerLongLatArr = []
      //   fillerLongLatArr.push(parallelStart1)
      //   fillerLongLatArr.push(parallelEnd1)
      //   fillerLongLatArr.push(parallelStart2)
      //   fillerLongLatArr.push(parallelEnd2)
      //   fillerLongLatArr.forEach((longLat) => {
      //     let lat = longLat.y
      //     let long = longLat.x
      //     const [x, y, z] = ConvertLatLongToXYZ(lat, long, globeInfo.regionRadius)
      //     fillerPointsArr.push(x, y, z)
      //   })

      //   // Want 1 point approximately every 1 degree of lat and long.
      //   // Ex: 
      //   //  Distance between points is 10.347 => 9 segments => 8 interpolated points
      //   let maxInterpolatedDist = 3
      //   // let numInterpolationPoints = (Math.floor(lengthAToB) - 1) / maxInterpolatedDist
      //   // let distFractionPerInterpolatedPoint = (lengthAToB / numInterpolationPoints) / lengthAToB
      //   // let interpolatedLongLatArr = []
      //   // for (let pointCount = 0; pointCount <= numInterpolationPoints; pointCount++) {
      //   //   let distFraction = distFractionPerInterpolatedPoint * pointCount
      //   let numInterpolationPoints = Math.floor(lengthAToB / maxInterpolatedDist)
      //   let distFractionPerInterpolatedPoint = (lengthAToB / numInterpolationPoints) / lengthAToB
      //   let interpolatedLongLatArr = []
      //   for (let pointCount = 0; pointCount <= numInterpolationPoints; pointCount++) {
      //     let distFraction = distFractionPerInterpolatedPoint * pointCount

      //     // Direct interpolation longLat between start and end.
      //     let direct = (new THREE.Vector2()).lerpVectors(startPoint, endPoint, distFraction)
      //     interpolatedLongLatArr.push([direct.x, direct.y])
      //     let directXYZ = ConvertLatLongToXYZ(direct.y, direct.x, globeInfo.regionRadius)
      //     fillerPointsArr.push(...directXYZ)

      //     let parallel1 = (new THREE.Vector2()).lerpVectors(parallelStart1, parallelEnd1, distFraction)
      //     interpolatedLongLatArr.push([parallel1.x, parallel1.y])
      //     let parallelXYZ1 = ConvertLatLongToXYZ(parallel1.y, parallel1.x, globeInfo.regionRadius)
      //     fillerPointsArr.push(...parallelXYZ1)

      //     let parallel2 = (new THREE.Vector2()).lerpVectors(parallelStart2, parallelEnd2, distFraction)
      //     interpolatedLongLatArr.push([parallel2.x, parallel2.y])
      //     let parallelXYZ2 = ConvertLatLongToXYZ(parallel2.y, parallel2.x, globeInfo.regionRadius)
      //     fillerPointsArr.push(...parallelXYZ2)
      //   }

      //   // Triangulate the filler points to make a mesh.
      //   // TODO: _start_ with a pre-allocated typed array and fill it in
      //   const typedArr = new Float32Array(interpolatedLongLatArr.flat())
      //   let delaunator = new Delaunator(typedArr)
      //   let indices = delaunator.triangles
      //   let numExistingVertices = fillerPointsArr.length / 3
      //   let poiMiniRegionIndices = indices.map((index) => index + numExistingVertices)
      //   fillerIndicesArr.push(...poiMiniRegionIndices)

      //   interpolatedLongLatArr.forEach((longLat) => {
      //     let lat = longLat[1]
      //     let long = longLat[0]
      //     const [x, y, z] = ConvertLatLongToXYZ(lat, long, globeInfo.regionRadius)
      //     fillerPointsArr.push(x, y, z)
      //   })

    }

    let valuesPerVertex = 3
    let valuesPerIndex = 1

    // Create geometry for the filler points
    let fillerPointsPosAttr = new THREE.Float32BufferAttribute(fillerPointsArr, valuesPerVertex)
    let fillerPointsIndicesAttr = new THREE.Uint32BufferAttribute(fillerIndicesArr, valuesPerIndex)

    fillerPointsRef.current.geometry.setAttribute("position", fillerPointsPosAttr)
    fillerPointsMeshRef.current.geometry.setAttribute("position", fillerPointsPosAttr)
    fillerPointsMeshRef.current.geometry.setIndex(fillerPointsIndicesAttr)
  }, [whereLatLongArr])

  return (
    <>
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