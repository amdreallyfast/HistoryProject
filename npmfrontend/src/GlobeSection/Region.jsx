import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { useSelector } from "react-redux"
import { ConvertLatLongToXYZ, ConvertXYZToLatLong } from "./convertLatLongXYZ"
import { globeInfo } from "./constValues"
import { LatLongPin } from "./LatLongPin"
// import Delaunator from "delaunator"
import * as d3Geo from "d3-geo-voronoi"
import { sum } from "lodash"
import { v1 } from "uuid"

// TODO: latlong grid to fill in gaps >1deg
// TODO: latlong pin object
// TODO: click latlong pin and drag to move point

const interpolateArcFromLatLong = (startLat, startLong, endLat, endLong, interpolationAngleDeg) => {
  const [startX, startY, startZ] = ConvertLatLongToXYZ(startLat, startLong, globeInfo.regionRadius)
  let start = new THREE.Vector3(startX, startY, startZ)

  const [endX, endY, endZ] = ConvertLatLongToXYZ(endLat, endLong, globeInfo.regionRadius)
  let end = new THREE.Vector3(endX, endY, endZ)

  return interpolateArcFromVertices(start, end, interpolationAngleDeg)
}

const interpolateArcFromVertices = (startVec3, endVec3, interpolationAngleDeg) => {
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

// TODO: ??re-think this algorithm? it doesn't work well with triangles; do we even need it??
const findMidpointOnSurface = (latLongArr) => {
  // create average point
  let minX = 0, maxX = 0
  let minY = 0, maxY = 0
  let minZ = 0, maxZ = 0
  latLongArr.forEach((latLongJson, index) => {


    const [x, y, z] = ConvertLatLongToXYZ(latLongJson.lat, latLongJson.long, globeInfo.radius)
    // console.log({
    //   x: x,
    //   y: y,
    //   z: z
    // })

    // const [tempLat, tempLong] = ConvertXYZToLatLong(x, y, z, globeInfo.radius)
    // const [tempX, tempY, tempZ] = ConvertLatLongToXYZ(tempLat, tempLong, globeInfo.radius)
    // console.log({
    //   x1: x,
    //   x2: tempX,
    //   y1: y,
    //   y2: tempY,
    //   z1: z,
    //   z2: tempZ
    // })

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

  let midX = (minX + maxX) * 0.5
  let midY = (minY + maxY) * 0.5
  let midZ = (minZ + maxZ) * 0.5

  // console.log({
  //   x_min: minX,
  //   x_max: maxX,
  //   x_mid: midX,
  //   y_min: minY,
  //   y_max: maxY,
  //   y_mid: midY,
  //   z_min: minZ,
  //   z_max: maxZ,
  //   z_mid: midZ,
  // })

  let midpoint = new THREE.Vector3(midX, midY, midZ)
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

const triangleThing = (p1Vec3, p2Vec3, p3Vec3) => {
  let v1 = (new THREE.Vector3()).subVectors(p2Vec3, p1Vec3)
  let v2 = (new THREE.Vector3()).subVectors(p3Vec3, p1Vec3)

  let points = []
  // for (let i = 0.0; i <= 1.0; i += 0.1) {
  //   // from p1:
  //   //  evenly spaced from p1 -> p2
  //   //    v1To2(0) + v1To3(i)
  //   //  evenly spaced from p2 -> p3
  //   //    v1To2(i) + v1To3(1-i)
  //   //  evenly spaced from p2 -> p3
  //   //    v1To2(i) + v1To3(0)
  //   let fractionV1 = v1.clone().multiplyScalar(i)
  //   for (let j = 0.0; j <= (1 - i); j += 0.1) {
  //     let fractionV2 = v2.clone().multiplyScalar(j)
  //     let vCombination = (new THREE.Vector3()).addVectors(fractionV1, fractionV2)
  //     let newPoint = (new THREE.Vector3()).addVectors(p1Vec3, vCombination)
  //     points.push(...newPoint)
  //   }
  // }

  let unitV1 = p1Vec3.clone().normalize()
  let unitV2 = p2Vec3.clone().normalize()
  let unitV3 = p3Vec3.clone().normalize()

  let interpolationAngleDeg = 5

  // between v1 and v2
  let cosAngleV1V2 = unitV1.dot(unitV2)
  let angleV1V2Rad = Math.acos(cosAngleV1V2)
  let angleV1V2Deg = angleV1V2Rad * (180.0 / Math.PI)

  // between v1 and v3
  let cosAngleV1V3 = unitV1.dot(unitV3)
  let angleV1V3Rad = Math.acos(cosAngleV1V3)
  let angleV1V3Deg = angleV1V3Rad * (180.0 / Math.PI)

  // interpolate

  // vector style
  let v1v2Fraction = 0.9
  let v1v3Fraction = 0.9

  let v1v2ScalerV1 = Math.sin((1 - v1v2Fraction) * angleV1V2Rad) / Math.sin(angleV1V2Rad)
  let v1v2ScalerV2 = Math.sin((v1v2Fraction) * angleV1V2Rad) / Math.sin(angleV1V2Rad)
  let v1v2ScaledV1 = p1Vec3.clone().multiplyScalar(v1v2ScalerV1)
  let v1v2ScaledV2 = p2Vec3.clone().multiplyScalar(v1v2ScalerV2)
  let v1v2Interpolated = (new THREE.Vector3()).addVectors(v1v2ScaledV1, v1v2ScaledV2)

  let v1v3ScalerV1 = Math.sin((1 - v1v3Fraction) * angleV1V3Rad) / Math.sin(angleV1V3Rad)
  let v1v3ScalerV3 = Math.sin((v1v3Fraction) * angleV1V3Rad) / Math.sin(angleV1V3Rad)
  let v1v3ScaledV1 = p1Vec3.clone().multiplyScalar(v1v3ScalerV1)
  let v1v3ScaledV3 = p3Vec3.clone().multiplyScalar(v1v3ScalerV3)
  let v1v3Interpolated = (new THREE.Vector3()).addVectors(v1v3ScaledV1, v1v3ScaledV3)

  // now interpolate another arc across these points
  let u = v1v2Interpolated
  let v = v1v3Interpolated
  let uvFraction = 0.5
  let unitU = u.clone().normalize()
  let unitV = v.clone().normalize()
  let cosAngleUV = unitU.dot(unitV)
  let angleUVRad = Math.acos(cosAngleUV)
  let angleUVDeg = angleUVRad * (180.0 / Math.PI)
  let uScalar = Math.sin((1 - uvFraction) * angleUVRad) / Math.sin(angleUVRad)
  let vScaler = Math.sin((uvFraction) * angleUVRad) / Math.sin(angleUVRad)
  let uvInterpolated = (new THREE.Vector3()).addScaledVector(u, uScalar).addScaledVector(v, vScaler)


  // let thingP1 = p1Vec3.clone().multiplyScalar(1 - v1v2Fraction - v1v3Fraction)
  // let sum = new THREE.Vector3()
  // // sum.addVectors(v1v2Interpolated, v1v3Interpolated)
  // sum.addVectors(v1v2Interpolated.clone().multiplyScalar(0.5), v1v3Interpolated.clone().multiplyScalar(0.5))
  // sum.addVectors(sum, thingP1)
  // // let thing = (new THREE.Vector3()).addVectors(v1v2Interpolated, v1v3Interpolated).multiplyScalar(0.5)
  // // sum.addVectors(thingP1, thing)

  // console.log({ thingP1: thingP1 })
  // console.log({ v1v2Interpolated: v1v2Interpolated })
  // console.log({ v1v3Interpolated: v1v3Interpolated })
  // console.log({ sum: sum })
  points.push(...v1v2Interpolated)
  points.push(...v1v3Interpolated)
  // points.push(...sum)
  points.push(...uvInterpolated)

  // // // (x,y)=(1−u−v)(x0,y0)+u(x1,y1)+v(x2,y2)
  // let u = 0.8
  // let v = 0.2
  // let v1Scaler = (Math.sin((1 - u) * angleV1V2Rad) * Math.sin((1 - v) * angleV1V3Rad)) / (Math.sin(angleV1V2Rad) * Math.sin(angleV1V3Rad))
  // let v2Scaler = Math.sin(u * angleV1V2Rad) / Math.sin(angleV1V2Rad)
  // let v3Scaler = Math.sin(v * angleV1V3Rad) / Math.sin(angleV1V3Rad)
  // console.log({
  //   v1Scaler: v1Scaler,
  //   v2Scaler: v2Scaler,
  //   v3Scaler: v3Scaler,
  //   sum: v1Scaler + v2Scaler + v3Scaler
  // })

  // let thing1 = p1Vec3.clone().multiplyScalar(v1Scaler)
  // let thing2 = p2Vec3.clone().multiplyScalar(v2Scaler)
  // let thing3 = p3Vec3.clone().multiplyScalar(v3Scaler)
  // //??addScaledVector easier??
  // let sum = new THREE.Vector3()
  // sum.addVectors(thing1, thing2)
  // sum.addVectors(sum, thing3)

  // points.push(...thing1)
  // points.push(...thing2)
  // points.push(...thing3)
  // points.push(...sum)


  // const interpolateArcFromVertices = (startVec3, endVec3, interpolationAngleDeg) => {
  //   // console.log({ start: startVec3, end: endVec3 })

  //   let unitStartVec3 = startVec3.clone().normalize()
  //   let unitEndVec3 = endVec3.clone().normalize()
  //   let cosAngle = unitStartVec3.dot(unitEndVec3)
  //   let angleRad = Math.acos(cosAngle)
  //   let angle = angleRad * (180.0 / Math.PI)

  //   let arcSegments = Math.round(angle / interpolationAngleDeg) + 1
  //   // console.log({ angle: angle, interp: interpolationAngleDeg, arcSegments: arcSegments })
  //   let interpolatedPoints = []
  //   for (let i = 0; i <= arcSegments; i++) {
  //     // Should vary from 0 -> 1
  //     let fraction = i / arcSegments
  //     let startScaler = Math.sin((1 - fraction) * angleRad) / Math.sin(angleRad)
  //     let scaledStartVec3 = startVec3.clone().multiplyScalar(startScaler)

  //     let endScalar = Math.sin(fraction * angleRad) / Math.sin(angleRad)
  //     let scaledEndVec3 = endVec3.clone().multiplyScalar(endScalar)

  //     let interpolated = (new THREE.Vector3()).addVectors(scaledStartVec3, scaledEndVec3)
  //     interpolatedPoints.push(interpolated)
  //   }
  //   return interpolatedPoints
  // }

  return points

  // TODO: if you can interpolate between a combination of 2x vectors, why can't you interpolate between a combination of 2x arcs?
}

const makeRegion = (latLongArr) => {
  let points = []

  const userLongLatArr = new Array(latLongArr.length)
  const userPointsArr = new Array(latLongArr.length)
  latLongArr.forEach((latLongJson, index) => {
    userLongLatArr[index] = [latLongJson.long, latLongJson.lat]

    const [x, y, z] = ConvertLatLongToXYZ(latLongJson.lat, latLongJson.long, globeInfo.radius)
    userPointsArr[index] = new THREE.Vector3(x, y, z)
    points.push(x, y, z)
  })

  // ??why??
  // - 2x triangles when there are 3 points
  // - 4x triangles when there are 4 points
  // - 6x triangles when there are 5 points
  // - why are there shortcuts across the triangle at a different depth, 
  let delaunay = d3Geo.geoDelaunay(userLongLatArr)
  let myUniqueTrianglesDict = {}
  // console.log(delaunay.triangles)
  delaunay.triangles.forEach((triangleIndicesArr, index) => {
    let copyArr = [...triangleIndicesArr]
    copyArr.sort()
    let key = JSON.stringify(copyArr)
    if (myUniqueTrianglesDict[key] == undefined) {
      myUniqueTrianglesDict[key] = triangleIndicesArr
    }
  })
  let myUniqueTriangles = Object.values(myUniqueTrianglesDict)
  // let myUniqueTriangles = delaunay.triangles
  console.log(myUniqueTriangles)


  // let indices = delaunay.triangles.flat()
  let indices = myUniqueTriangles.flat()

  // delaunay.edges.forEach((startEndArr) => {
  //   let startPointIndex = startEndArr[0]
  //   let endPointIndex = startEndArr[1]
  //   let startPoint = userPointsArr[startPointIndex]
  //   let endPoint = userPointsArr[endPointIndex]
  //   // console.log({ start: startPoint, end: endPoint })
  //   let interpolatedPoints = interpolateArcFromVertices(startPoint, endPoint, 3)
  //   let coordinates = interpolatedPoints.map((vec3, index) => [...vec3]).flat()
  //   // console.log(coordinates)
  //   points.push(...coordinates)
  // })

  // TODO: use this when iterating over the triangles to avoid doing the expensive interpolationArc calculation twice on the same edge
  // Note: Inner edges always appear twice as the boundary between 2x triangles.
  //??interpolate between _pairs_ of edges and only check those, rather than strictly triangles??
  let completedEdges = {}
  delaunay.edges.forEach((startEndArr) => {
    let key = JSON.stringify(startEndArr)
    completedEdges[key] = false
  })
  // delaunay.triangles.forEach((triangleIndicesArr, index) => {
  myUniqueTriangles.forEach((triangleIndicesArr, index) => {
    // if (index > 0) {
    //   return
    // }

    // console.log(triangleIndicesArr)
    let edge1 = [triangleIndicesArr[0], triangleIndicesArr[1]]
    let edge2 = [triangleIndicesArr[1], triangleIndicesArr[2]]
    let edge3 = [triangleIndicesArr[2], triangleIndicesArr[0]]

    let p1 = userPointsArr[triangleIndicesArr[0]]
    let p2 = userPointsArr[triangleIndicesArr[1]]
    let p3 = userPointsArr[triangleIndicesArr[2]]
    // console.log({ p1: p1, p2: p2, p3: p3 })

    let interpolatedCoordinates = triangleThing(p1, p2, p3)
    points.push(...interpolatedCoordinates)

    // console.log({ things: things })
  })

  // console.log(edges)

  // console.log({ userPoints: userPoints })



  // // Delete triangles where the edges are not too long.
  // let triangleIndices = {}
  // delaunay.triangles.forEach((triangle, index) => {
  //   triangleIndices[index] = triangle
  // })

  // let maxDist = 1
  // let maxDistSqrd = maxDist * maxDist
  // delaunay.edges.forEach((edge, index) => {
  //   let pointsStartIndex = edge[0] * 3
  //   let pointsEndIndex = edge[1] * 3

  //   let p1 = new THREE.Vector3(
  //     pointsArr[pointsStartIndex + 0],
  //     pointsArr[pointsStartIndex + 1],
  //     pointsArr[pointsStartIndex + 2])
  //   let p2 = new THREE.Vector3(
  //     pointsArr[pointsEndIndex + 0],
  //     pointsArr[pointsEndIndex + 1],
  //     pointsArr[pointsEndIndex + 2])
  //   let v = (new THREE.Vector3).subVectors(p1, p2)
  //   let distSqrd = v.dot(v)
  //   if (distSqrd > maxDistSqrd) {
  //     // Delete triangles with this edge.
  //     delaunator.triangles.forEach((triangle, triangleIndex) => {
  //       if (triangle.includes(edge[0]) && triangle.includes(edge[1])) {
  //         delete triangleIndices[triangleIndex]
  //       }
  //     })
  //   }
  // })
  // Object.keys(triangleIndices).forEach((key) => {
  //   indicesArr.push(...(triangleIndices[key]))
  // })




  // // Interpolated region between points
  // for (let i = 1; i < whereLatLongArr.length; i++) {
  //   // Source:
  //   //  https://en.wikipedia.org/wiki/Slerp
  //   // Summary:
  //   //  Convert latLong -> 3D vectors
  //   //  Get unit vectors
  //   //  Use dot product + acos(...) to get angle
  //   //  Interpolate fraction from 0 -> 1
  //   //    fractionStartVector = sin((1 - fraction) * angle) / sin(angle)
  //   //    fractionEndVector = sin(fraction * angle) / sin(angle)
  //   //    interpolatedVector = fractionStartVector * startVector + fractionEndVector * endVector
  //   let startLat = whereLatLongArr[i].lat
  //   let startLong = whereLatLongArr[i].long
  //   let endLat = whereLatLongArr[i - 1].lat
  //   let endLong = whereLatLongArr[i - 1].long
  //   let interpolatedPoints = interpolateArc(startLat, startLong, endLat, endLong, 3)
  //   interpolatedPoints.forEach((point) => {
  //     fillerPointsArr.push(...point)
  //   })
  // }





  return [indices, points]
}

export function Region({ latLongArr }) {
  const whereLatLongArr = useSelector((state) => state.editPoiReducer.whereLatLongArr)
  const [latLongPinReactElements, setLatLongPinReactElements] = useState()

  const fillerPointsRef = useRef()
  const fillerPointsMeshRef = useRef()
  useEffect(() => {
    // console.log("Region -> useEffect -> regionMeshRef")

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

      // const [midpointLat, midpointLong] = findMidpointOnSurface(whereLatLongArr)
      // copyLatlongArr.push({
      //   lat: midpointLat,
      //   long: midpointLong
      // })

      // let thingPoint = whereLatLongArr[0]


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

    if (whereLatLongArr.length > 1) {
      const [midpointLat, midpointLong] = findMidpointOnSurface(whereLatLongArr)
      const [x, y, z] = ConvertLatLongToXYZ(midpointLat, midpointLong, globeInfo.radius)
      // fillerPointsArr.push(x, y, z)
    }



    // // Interpolated region between points
    // for (let i = 1; i < whereLatLongArr.length; i++) {
    //   // Source:
    //   //  https://en.wikipedia.org/wiki/Slerp
    //   // Summary:
    //   //  Convert latLong -> 3D vectors
    //   //  Get unit vectors
    //   //  Use dot product + acos(...) to get angle
    //   //  Interpolate fraction from 0 -> 1
    //   //    fractionStartVector = sin((1 - fraction) * angle) / sin(angle)
    //   //    fractionEndVector = sin(fraction * angle) / sin(angle)
    //   //    interpolatedVector = fractionStartVector * startVector + fractionEndVector * endVector
    //   let startLat = whereLatLongArr[i].lat
    //   let startLong = whereLatLongArr[i].long
    //   let endLat = whereLatLongArr[i - 1].lat
    //   let endLong = whereLatLongArr[i - 1].long
    //   let interpolatedPoints = interpolateArc(startLat, startLong, endLat, endLong, 3)
    //   interpolatedPoints.forEach((point) => {
    //     fillerPointsArr.push(...point)
    //   })
    // }

    let valuesPerVertex = 3
    let valuesPerIndex = 1

    // Create geometry for the filler points
    let fillerPointsPosAttr = new THREE.Float32BufferAttribute(fillerPointsArr, valuesPerVertex)
    let fillerPointsIndicesAttr = new THREE.Uint32BufferAttribute(fillerIndicesArr, valuesPerIndex)

    fillerPointsRef.current.geometry.setAttribute("position", fillerPointsPosAttr)
    // fillerPointsRef.current.geometry.attributes.position.needsUpdate = true

    fillerPointsMeshRef.current.geometry.setAttribute("position", fillerPointsPosAttr)
    fillerPointsMeshRef.current.geometry.setIndex(fillerPointsIndicesAttr)
    fillerPointsMeshRef.current.geometry.attributes.position.needsUpdate = true
  }, [whereLatLongArr])

  return (
    <>
      <points name="IntermediatePoints" ref={fillerPointsRef}>
        <pointsMaterial color={0x00fff0} size={0.18} />
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
        {/* <meshPhongMaterial attach="material" color={0xf0ff00} side={THREE.DoubleSide} wireframe={false} transparent={true} opacity={0.9} /> */}
        <meshBasicMaterial attach="material" color={0xf0ff00} side={THREE.DoubleSide} wireframe={true} />
      </mesh>
    </>
  )
}