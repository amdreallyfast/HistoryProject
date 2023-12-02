import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { useSelector } from "react-redux"
import { ConvertLatLongToXYZ, ConvertXYZToLatLong } from "./convertLatLongXYZ"
import { globeInfo } from "./constValues"
import { LatLongPin } from "./LatLongPin"
// import Delaunator from "delaunator"
import * as d3Geo from "d3-geo-voronoi"
import { sum } from "lodash"

// TODO: latlong grid to fill in gaps >1deg
// TODO: latlong pin object
// TODO: click latlong pin and drag to move point

const interpolateArc = (startLat, startLong, endLat, endLong, interpolationAngleDeg) => {
  const [startX, startY, startZ] = ConvertLatLongToXYZ(startLat, startLong, globeInfo.regionRadius)
  const [endX, endY, endZ] = ConvertLatLongToXYZ(endLat, endLong, globeInfo.regionRadius)

  let startVec3 = new THREE.Vector3(startX, startY, startZ)
  let endVec3 = new THREE.Vector3(endX, endY, endZ)
  // console.log({ start: startVec3, end: endVec3 })

  let unitStartVec3 = startVec3.clone().normalize()
  let unitEndVec3 = endVec3.clone().normalize()
  let cosAngle = unitStartVec3.dot(unitEndVec3)
  let angleRad = Math.acos(cosAngle)
  let angle = angleRad * (180.0 / Math.PI)

  let arcSegments = Math.round(angle / interpolationAngleDeg) + 1
  // console.log({ angle: angle, interp: interpolationAngleDeg, arcSegments: arcSegments })
  let interpolatedPoints = []
  for (let i = 0; i <= arcSegments; i++) {
    // Should vary from 0 -> 1
    let fraction = i / arcSegments
    let startScaler = Math.sin((1 - fraction) * angleRad) / Math.sin(angleRad)
    let scaledStartVec3 = startVec3.clone().multiplyScalar(startScaler)

    let endScalar = Math.sin(fraction * angleRad) / Math.sin(angleRad)
    let scaledEndVec3 = endVec3.clone().multiplyScalar(endScalar)

    let interpolated = (new THREE.Vector3()).addVectors(scaledStartVec3, scaledEndVec3)
    interpolatedPoints.push(interpolated)
  }
  return interpolatedPoints
}

const findMidpointOnSurface = (latLongArr) => {
  // create average point
  let minX = 0, maxX = 0
  let minY = 0, maxY = 0
  let minZ = 0, maxZ = 0
  latLongArr.forEach((latLongJson, index) => {
    const [x, y, z] = ConvertLatLongToXYZ(latLongJson.lat, latLongJson.long, globeInfo.radius)

    if (index == 0) {
      // first loop; assign min/max
      minX = x
      maxX = x
      minY = y
      maxY = y
      minZ = z
      maxZ = z
    }
    else {
      if (x < minX) {
        minX = x
      }
      else if (x > maxX) {
        maxX = x
      }

      if (y < minY) {
        minY = y
      }
      else if (y > maxY) {
        maxY = y
      }

      if (z < minZ) {
        minZ = z
      }
      else if (z > maxZ) {
        maxZ = z
      }
    }
  })

  let midpointX = (minX + maxX) * 0.5
  let midpointY = (minY + maxY) * 0.5
  let midpointZ = (minZ + maxZ) * 0.5
  let midpoint = new THREE.Vector3(midpointX, midpointY, midpointZ)
  let midpointVector = (new THREE.Vector3()).subVectors(midpoint, globeInfo.pos)
  midpointVector = midpointVector.normalize()
  midpointVector = midpointVector.multiplyScalar(globeInfo.radius)
  const [lat, long] = ConvertXYZToLatLong(midpointVector.x, midpointVector.y, midpointVector.z, globeInfo.radius)
  return [lat, long]
}


// TODO: replace this algorithm or get rid of mini region altogether. It stretches near the poles.

// Make each user-added point a tiny region on its own by adding 8x extra points from the
// 45 degrees around the unit circle.
const miniRegionWidthScalar = 3
const x00DegLength = Math.cos(0) * miniRegionWidthScalar
const x45DegLength = Math.cos(Math.PI / 4) * miniRegionWidthScalar
const x90DegLength = Math.cos(Math.PI / 2) * miniRegionWidthScalar
const y00DegLength = Math.sin(0) * miniRegionWidthScalar
const y45DegLength = Math.sin(Math.PI / 4) * miniRegionWidthScalar
const y90DegLength = Math.sin(Math.PI / 2) * miniRegionWidthScalar
const makeMiniRegionFillerPoints = (lat, long) => {
  // Mini region filler points around each user-added point
  let miniPointRegionLongLatArr = []
  miniPointRegionLongLatArr.push([long, lat])
  miniPointRegionLongLatArr.push([long + x00DegLength, lat + y00DegLength]) // (x+1,y+0)
  miniPointRegionLongLatArr.push([long + x45DegLength, lat + y45DegLength])
  miniPointRegionLongLatArr.push([long + x90DegLength, lat + y90DegLength]) // (x+0,y+1)
  miniPointRegionLongLatArr.push([long - x45DegLength, lat + y45DegLength])
  miniPointRegionLongLatArr.push([long - x00DegLength, lat + y00DegLength]) // (x-1,y+0)
  miniPointRegionLongLatArr.push([long - x45DegLength, lat - y45DegLength])
  miniPointRegionLongLatArr.push([long + x90DegLength, lat - y90DegLength]) // (x+0,y-1)
  miniPointRegionLongLatArr.push([long + x45DegLength, lat - y45DegLength])

  // Triangulate the filler points to make a mesh.
  // TODO: _start_ with a pre-allocated typed array and fill it in
  // const typedArr = new Float32Array(miniPointRegionLongLatArr.flat())
  // let delaunator = new Delaunator(typedArr)
  // let indices = delaunator.triangles
  let delaunay = d3Geo.geoDelaunay(miniPointRegionLongLatArr)
  let indices = delaunay.triangles.flat()

  // Convert the filler points to their own vertices.
  let points = []
  miniPointRegionLongLatArr.forEach((longLat) => {
    let lat = longLat[1]
    let long = longLat[0]
    const [x, y, z] = ConvertLatLongToXYZ(lat, long, globeInfo.regionRadius)
    points.push(x, y, z)
  })

  return [indices, points]
}

const triangleThing = (p1, p2, p3) => {

}

const makeRegion = (latLongArr) => {
  let longLatArr = latLongArr?.map(
    (latLongJson) => {
      return [latLongJson.long, latLongJson.lat]
    }
  )

  let delaunay = d3Geo.geoDelaunay(longLatArr)
  let indices = delaunay.triangles.flat()

  let points = []
  longLatArr.forEach((longLat) => {
    let lat = longLat[1]
    let long = longLat[0]
    const [x, y, z] = ConvertLatLongToXYZ(lat, long, globeInfo.regionRadius)
    points.push(x, y, z)
  })

  return [indices, points]
}

export function Region({ latLongArr }) {
  const whereLatLongArr = useSelector((state) => state.editPoiReducer.whereLatLongArr)
  const [latLongPinReactElements, setLatLongPinReactElements] = useState()

  const fillerPointsRef = useRef()
  const fillerPointsMeshRef = useRef()
  useEffect(() => {
    console.log("MyPolygon -> useEffect -> regionMeshRef")

    let fillerPointsArr = []
    let fillerIndicesArr = []

    let copyLatlongArr = []
    whereLatLongArr.forEach((latLongJson, index) => {
      copyLatlongArr.push({
        lat: latLongJson.lat,
        long: latLongJson.long
      })
    })

    if (copyLatlongArr.length > 1) {
      // console.log("more than 2 points")

      const [midpointLat, midpointLong] = findMidpointOnSurface(whereLatLongArr)
      copyLatlongArr.push({
        lat: midpointLat,
        long: midpointLong
      })

      let thingPoint = whereLatLongArr[0]


      // Nope. 
      //  Lat/long are spherical coordinates and start collapsing together around the poles. 
      //  Need a different way to create an angle coordinate system.
      //  ??start with "up" being defined as "from midpoint towards the north pole" and "left" being defined as "west of midpoints"? how then do I get these spherical coordinates into a square UV grid??

      //??go triangle by triangle and fill in? how can you tell where an "open" spot is??

      // // horizontal component
      // copyLatlongArr.push({
      //   lat: midpointLat,
      //   long: thingPoint.long
      // })

      // // vertical component
      // copyLatlongArr.push({
      //   lat: thingPoint.lat,
      //   long: midpointLong
      // })
    }

    setLatLongPinReactElements(
      copyLatlongArr?.map(
        (latLongJson, index) => {
          return (
            <LatLongPin
              key={index}
              latLong={latLongJson} />
          )
        }
      )
    )

    const [regionIndices, regionPoints] = makeRegion(whereLatLongArr)
    let numExistingVertices = fillerPointsArr.length / 3
    let shiftedIndices = regionIndices.map((value) => value + numExistingVertices)
    fillerIndicesArr.push(...shiftedIndices)
    fillerPointsArr.push(...regionPoints)


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
      let interpolatedPoints = interpolateArc(startLat, startLong, endLat, endLong, 3)
      interpolatedPoints.forEach((point) => {
        fillerPointsArr.push(...point)
      })
    }

    let valuesPerVertex = 3
    let valuesPerIndex = 1

    // Create geometry for the filler points
    let fillerPointsPosAttr = new THREE.Float32BufferAttribute(fillerPointsArr, valuesPerVertex)
    let fillerPointsIndicesAttr = new THREE.Uint32BufferAttribute(fillerIndicesArr, valuesPerIndex)

    fillerPointsRef.current.geometry.setAttribute("position", fillerPointsPosAttr)
    fillerPointsRef.current.geometry.attributes.position.needsUpdate = true

    fillerPointsMeshRef.current.geometry.setAttribute("position", fillerPointsPosAttr)
    fillerPointsMeshRef.current.geometry.setIndex(fillerPointsIndicesAttr)
    fillerPointsMeshRef.current.geometry.attributes.position.needsUpdate = true
  }, [whereLatLongArr])

  return (
    <>
      <points name="IntermediatePoints" ref={fillerPointsRef}>
        <pointsMaterial color={0x00fff0} size={0.08} />
      </points>

      <group name="LatLongPins">
        {latLongPinReactElements}
      </group>

      {/* 
        Note: "Transparency" and wireframe are messed up. 
          In order to make transparency work with the "LatLongPins", you have to:
            Render
            Cut out the "LatLongPins" elements
            Save to re-render
            Paste the "LatLongPins" elements back in
            Save to re-render again.
          In order to make wireframe work, you have to:
            Render with "wireframe={false}"
            Set it to true
            Save to re-render.
          If you start with "wireframe={true}", it will never work, even if you set it to false, 
          save, change back to true, and save again.
      */}
      <mesh name="IntermediatePointsMesh" ref={fillerPointsMeshRef}>
        <meshPhongMaterial attach="material" color={0xf0ff00} side={THREE.DoubleSide} wireframe={false} transparent={true} opacity={0.1} />
      </mesh>

    </>
  )
}