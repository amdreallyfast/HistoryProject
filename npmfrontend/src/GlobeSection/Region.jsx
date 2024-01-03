import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { useSelector } from "react-redux"
import { ConvertLatLongToXYZ, ConvertXYZToLatLong } from "./convertLatLongXYZ"
import { globeInfo } from "./constValues"
import { LatLongPin } from "./LatLongPin"
// import Delaunator from "delaunator"
import * as d3Geo from "d3-geo-voronoi"
import { ceil, floor, sum } from "lodash"
import { v1 } from "uuid"

// TODO: click latlong pin and drag to move point

const interpolateArcFromLatLong = (startLat, startLong, endLat, endLong, maxArcSegmentAngleDeg, includeEndpoints = false) => {
  const [startX, startY, startZ] = ConvertLatLongToXYZ(startLat, startLong, globeInfo.regionRadius)
  let start = new THREE.Vector3(startX, startY, startZ)

  const [endX, endY, endZ] = ConvertLatLongToXYZ(endLat, endLong, globeInfo.regionRadius)
  let end = new THREE.Vector3(endX, endY, endZ)

  return interpolateArcFromVertices(start, end, maxArcSegmentAngleDeg, includeEndpoints)
}

// const interpolateArcFromVertices = (start, end, fraction) => {
//   let unitStart = start.clone().normalize()
//   let unitEnd = end.clone().normalize()
//   let cosAngle = unitStart.dot(unitEnd)
//   let angleRad = Math.acos(cosAngle)
//   let startScaler = Math.sin((1 - fraction) * angleRad) / Math.sin(angleRad)
//   let endScalar = Math.sin(fraction * angleRad) / Math.sin(angleRad)
//   let interpolated = (new THREE.Vector3()).addScaledVector(start, startScaler).addScaledVector(end, endScalar)

//   return interpolated
// }

const interpolateArcFromVertices = (startVec3, endVec3, maxArcSegmentAngleDeg, includeEndpoints = false) => {
  // console.log({ start: startVec3, end: endVec3 })

  let unitStartVec3 = startVec3.clone().normalize()
  let unitEndVec3 = endVec3.clone().normalize()
  let cosAngle = unitStartVec3.dot(unitEndVec3)
  let angleRad = Math.acos(cosAngle)
  let angle = angleRad * (180.0 / Math.PI)

  let numArcSegments = Math.round(angle / maxArcSegmentAngleDeg) + 1
  let interpolatedVectorPoints = []
  let arcSegmentCount = 1
  if (includeEndpoints) {
    arcSegmentCount = 0
    numArcSegments += 1
  }
  while (arcSegmentCount < numArcSegments) {
    let fraction = arcSegmentCount / numArcSegments

    let startScaler = Math.sin((1 - fraction) * angleRad) / Math.sin(angleRad)
    let scaledStartVec3 = startVec3.clone().multiplyScalar(startScaler)

    let endScalar = Math.sin(fraction * angleRad) / Math.sin(angleRad)
    let scaledEndVec3 = endVec3.clone().multiplyScalar(endScalar)

    let interpolated = (new THREE.Vector3()).addVectors(scaledStartVec3, scaledEndVec3)
    interpolatedVectorPoints.push(interpolated)

    arcSegmentCount++
  }

  return interpolatedVectorPoints
}

const interpolateAcrossTriangleFlat = (p1, p2, p3, distBetweenPoints) => {
  distBetweenPoints = 0.3
  let interpolatedVectorPoints = []

  // console.log("start-------------------------")
  let v1 = (new THREE.Vector3()).subVectors(p2, p1)
  let v2 = (new THREE.Vector3()).subVectors(p3, p1)

  // // Simple
  // let u = 0.9
  // let v = 0.0
  // let pInterpolated = p1.clone()
  // pInterpolated.addScaledVector(v1, u).addScaledVector(v2, v)
  // pInterpolated.normalize()
  // pInterpolated.multiplyScalar(globeInfo.radius)
  // interpolatedVectorPoints.push(pInterpolated)

  let uVector = v1
  let uVectorLength = uVector.length()
  let uSegmentCount = ceil(uVectorLength / distBetweenPoints)
  let uSegmentLength = uVectorLength / uSegmentCount
  let uFractionPerSegment = uSegmentLength / uVectorLength
  for (let u = 0.0; u <= 1.01; u += uFractionPerSegment) {
    let uVectorSegment = p1.clone().addScaledVector(uVector, u)
    let vVectorEndpoint = uVectorSegment.clone().addScaledVector(v2, (1 - u))
    let vVector = (new THREE.Vector3()).subVectors(vVectorEndpoint, uVectorSegment)
    let vVectorLength = vVector.length()
    let vSegmentCount = ceil(vVectorLength / distBetweenPoints)
    let vSegmentLength = vVectorLength / vSegmentCount
    let vFractionPerSegment = vSegmentLength / vVectorLength
    for (let v = 0.0; v <= 1.02; v += vFractionPerSegment) {
      let uvVectorSegment = uVectorSegment.clone().addScaledVector(vVector, v)
      uvVectorSegment.normalize().multiplyScalar(globeInfo.radius)
      interpolatedVectorPoints.push(uvVectorSegment)
    }
  }
  // console.log("end---------------------------")

  return interpolatedVectorPoints
}

const interpolateAcrossTriangleSpherical = (p1, p2, p3, maxArcSegmentAngleDeg) => {
  let interpolatedVectorPoints = []


  // TODO:
  //  bilinear interpolation across triangle, then re-scale each vector to the globe's radius. It will not be exactly spaced, but if the linear interpolation line is not far from the surface, then this is a useful approximation.



  let unitV1 = p1.clone().normalize()
  let unitV2 = p2.clone().normalize()
  let unitV3 = p3.clone().normalize()
  const radToDeg = 180.0 / Math.PI

  // Precalculate the denominator, which is re-used.
  // v1Scaler = Math.sin((1 - fraction) * angleRad) / Math.sin(angleRad)
  // v2Scaler = Math.sin((fraction) * angleRad) / Math.sin(angleRad)

  // between v1 and v2
  let cosAngleV1V2 = unitV1.dot(unitV2)
  let angleV1V2Rad = Math.acos(cosAngleV1V2)
  let invSinAngleV1V2Rad = 1.0 / Math.sin(angleV1V2Rad)
  // let angleV1V2Deg = angleV1V2Rad * radToDeg

  // between v1 and v3
  let cosAngleV1V3 = unitV1.dot(unitV3)
  let angleV1V3Rad = Math.acos(cosAngleV1V3)
  let invSinAngleV1V3Rad = 1.0 / Math.sin(angleV1V3Rad)
  // let angleV1V3Deg = angleV1V3Rad * radToDeg

  // The shortest side of the triangle will dictate how many arc segments we create
  let minArcAngleRad = angleV1V2Rad
  if (angleV1V3Rad < angleV1V2Rad) {
    minArcAngleRad = angleV1V3Rad
  }
  let minArcAngleDeg = minArcAngleRad * radToDeg
  let numArcSegments = Math.round(minArcAngleDeg / maxArcSegmentAngleDeg) + 1
  // console.log({ numArcSegments: numArcSegments })

  // interpolate
  // numArcSegments = 2
  for (let arcSegmentCount = 1; arcSegmentCount < numArcSegments; arcSegmentCount++) {
    // Should vary from 0 -> 1
    let fraction = arcSegmentCount / numArcSegments

    // between v1 and v2
    // Source:
    //  "Geometric Algebra - Linear and Spherical Interpolation (LERP, SLERP, NLERP)"
    //  https://www.youtube.com/watch?v=ibkT5ao8kGY
    //  Note: It's pretty heady and takes a long time to get through.
    let v1v2ScalerV1 = Math.sin((1 - fraction) * angleV1V2Rad) * invSinAngleV1V2Rad
    let v1v2ScalerV2 = Math.sin((fraction) * angleV1V2Rad) * invSinAngleV1V2Rad
    console.log({
      fraction: fraction,
      v1v2ScalerV1: v1v2ScalerV1,
      v1v2ScalerV2: v1v2ScalerV2,
      sum: v1v2ScalerV1 + v1v2ScalerV2
    })
    // v1v2ScalerV1 = fraction
    // v1v2ScalerV2 = 1.01 - v1v2ScalerV1
    // let v1v2ScaledV1 = v1.clone().multiplyScalar(v1v2ScalerV1)
    // let v1v2ScaledV2 = v2.clone().multiplyScalar(v1v2ScalerV2)
    // let v1v2Interpolated = (new THREE.Vector3()).addVectors(v1v2ScaledV1, v1v2ScaledV2)
    let v1v2Interpolated = (new THREE.Vector3()).addScaledVector(p1, v1v2ScalerV1).addScaledVector(p2, v1v2ScalerV2)
    // let v1v2Interpolated = interpolateArcFromVertices(v1, v2, fraction)
    interpolatedVectorPoints.push(v1v2Interpolated)

    // between v1 and v3
    fraction = 0.2
    let v1v3ScalerV1 = Math.sin((1 - fraction) * angleV1V3Rad) * invSinAngleV1V3Rad
    let v1v3ScalerV3 = Math.sin((fraction) * angleV1V3Rad) * invSinAngleV1V3Rad
    let v1v3ScaledV1 = v1v2Interpolated.clone().multiplyScalar(v1v3ScalerV1)
    let v1v3ScaledV3 = p3.clone().multiplyScalar(v1v3ScalerV3)
    let v1v3Interpolated = (new THREE.Vector3()).addVectors(v1v3ScaledV1, v1v3ScaledV3)
    // let v1v3Interpolated = interpolateArcFromVertices(v1, v3, fraction)
    interpolatedVectorPoints.push(v1v3Interpolated)

    // // now interpolate another arc across the interpolated midpoints
    // let u = v1v2Interpolated
    // let v = v1v3Interpolated
    // let unitU = u.clone().normalize()
    // let unitV = v.clone().normalize()
    // let cosAngleUV = unitU.dot(unitV)
    // let angleUVRad = Math.acos(cosAngleUV)
    // let angleUVDeg = angleUVRad * radToDeg
    // let numUVArcSegments = Math.round(angleUVDeg / maxArcSegmentAngleDeg) + 1
    // for (let uvArcSegmentCount = 1; uvArcSegmentCount < numUVArcSegments; uvArcSegmentCount++) {
    //   let uvFraction = uvArcSegmentCount / numUVArcSegments
    //   // console.log(uvFraction)
    //   let uScalar = Math.sin((1 - uvFraction) * angleUVRad) / Math.sin(angleUVRad)
    //   let vScaler = Math.sin((uvFraction) * angleUVRad) / Math.sin(angleUVRad)
    //   let uvInterpolated = (new THREE.Vector3()).addScaledVector(u, uScalar).addScaledVector(v, vScaler)
    //   // let uvInterpolated = interpolateArcFromVertices(u, v, uvFraction)
    //   interpolatedVectorPoints.push(uvInterpolated)
    // }

    // points.push(...uvInterpolated)
  }



  return interpolatedVectorPoints
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

const makeRegion = (latLongArr) => {
  let vectorPoints = []

  const userLongLatArr = new Array(latLongArr.length)
  const userPointsArr = new Array(latLongArr.length)
  latLongArr.forEach((latLongJson, index) => {
    userLongLatArr[index] = [latLongJson.long, latLongJson.lat]

    const [x, y, z] = ConvertLatLongToXYZ(latLongJson.lat, latLongJson.long, globeInfo.radius)
    let v = new THREE.Vector3(x, y, z)
    userPointsArr[index] = v
    // vectorPoints.push(v)
  })

  // ??why??
  // - 2x triangles when there are 3 points
  // - 4x triangles when there are 4 points
  // - 6x triangles when there are 5 points
  // - why are there shortcuts across the triangle at a different depth, 
  let delaunay = d3Geo.geoDelaunay(userLongLatArr)
  let myUniqueTrianglesDict = {}
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
  console.log({ myUniqueTriangles: myUniqueTriangles })


  // let indices = delaunay.triangles.flat()
  let indices = myUniqueTriangles.flat()

  // TODO: use this when iterating over the triangles to avoid doing the expensive interpolationArc calculation twice on the same edge
  // Note: Inner edges always appear twice as the boundary between 2x triangles.
  //??interpolate between _pairs_ of edges and only check those, rather than strictly triangles??
  let completedEdges = {}
  delaunay.edges.forEach((startEndArr) => {
    let key = JSON.stringify(startEndArr)
    completedEdges[key] = false
  })
  const maxArcSegmentAngleDeg = 3

  // interpolate over region
  // delaunay.triangles.forEach((triangleIndicesArr, index) => {
  myUniqueTriangles.forEach((triangleIndicesArr, index) => {
    let edge1 = [triangleIndicesArr[0], triangleIndicesArr[1]]
    let edge2 = [triangleIndicesArr[1], triangleIndicesArr[2]]
    let edge3 = [triangleIndicesArr[2], triangleIndicesArr[0]]

    let p1 = userPointsArr[triangleIndicesArr[0]]
    let p2 = userPointsArr[triangleIndicesArr[1]]
    let p3 = userPointsArr[triangleIndicesArr[2]]
    // console.log({ p1: p1, p2: p2, p3: p3 })

    let interpolatedVectorPoints = interpolateAcrossTriangleFlat(p1, p2, p3, maxArcSegmentAngleDeg)
    vectorPoints.push(...interpolatedVectorPoints)
  })

  // // interpolate over edges
  // // Note: Separate process from triangles to avoid interpolating over shared edges twice.
  // delaunay.edges.forEach((edgeIndicesArr) => {
  //   let p1 = userPointsArr[edgeIndicesArr[0]]
  //   let p2 = userPointsArr[edgeIndicesArr[1]]
  //   let interpolatedVectorPoints = interpolateArcFromVertices(p1, p2, maxArcSegmentAngleDeg)
  //   vectorPoints.push(...interpolatedVectorPoints)
  // })

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

  let points = []
  vectorPoints.forEach((value) => {
    points.push(...value)
  })
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

    const [regionIndices, regionPoints] = makeRegion(whereLatLongArr)
    let numExistingVertices = fillerPointsArr.length / 3
    let shiftedIndices = regionIndices.map((value) => value + numExistingVertices)
    fillerIndicesArr.push(...shiftedIndices)
    fillerPointsArr.push(...regionPoints)

    // //??useful at all??
    // if (whereLatLongArr.length > 1) {
    //   const [midpointLat, midpointLong] = findMidpointOnSurface(whereLatLongArr)
    //   const [x, y, z] = ConvertLatLongToXYZ(midpointLat, midpointLong, globeInfo.radius)
    //   fillerPointsArr.push(x, y, z)
    // }

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