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

const interpolateArcFromVertices = (p1, p2, arcDegPerSegment, includeEndpoints = false) => {
  // console.log({ start: startVec3, end: endVec3 })

  const arcRadiansPerSegment = arcDegPerSegment * (Math.PI / 180.0)

  let unitStartVec3 = p1.clone().normalize()
  let unitEndVec3 = p2.clone().normalize()
  let cosRadians = unitStartVec3.dot(unitEndVec3)
  let radians = Math.acos(cosRadians)
  let invSinRadians = 1.0 / Math.sin(radians)

  let numArcSegments = Math.round(radians / arcRadiansPerSegment) + 1
  let interpolatedVectorPoints = []
  let arcSegmentCount = 1
  if (includeEndpoints) {
    arcSegmentCount = 0
    numArcSegments += 1
  }

  // Calculation:
  //  p1Scaler = Math.sin((1 - fraction) * radians) / Math.sin(radians)
  //  p2Scaler = Math.sin((fraction) * radians) / Math.sin(radians)
  //  interpolated = p1Scaler * p1 + p2Scaler * p2
  while (arcSegmentCount < numArcSegments) {
    let fraction = arcSegmentCount / numArcSegments
    let p1Scaler = Math.sin((1 - fraction) * radians) * invSinRadians
    let p2Scalar = Math.sin(fraction * radians) * invSinRadians
    let interpolated = (new THREE.Vector3()).addScaledVector(p1, p1Scaler).addScaledVector(p2, p2Scalar)
    interpolatedVectorPoints.push(interpolated)

    arcSegmentCount++
  }

  return interpolatedVectorPoints
}

const interpolateArcFromLatLong = (startLat, startLong, endLat, endLong, maxArcSegmentAngleDeg, includeEndpoints = false) => {
  const [startX, startY, startZ] = ConvertLatLongToXYZ(startLat, startLong, globeInfo.regionRadius)
  let start = new THREE.Vector3(startX, startY, startZ)

  const [endX, endY, endZ] = ConvertLatLongToXYZ(endLat, endLong, globeInfo.regionRadius)
  let end = new THREE.Vector3(endX, endY, endZ)

  return interpolateArcFromVertices(start, end, maxArcSegmentAngleDeg, includeEndpoints)
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
    // console.log({ u: u, vLength: vVectorLength, segmentCount: vVectorLength / distBetweenPoints, segmentLen: vSegmentLength })
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

const interpolateAcrossTriangleSpherical = (p1, p2, p3, arcDegPerSegment) => {
  let interpolatedVectorPoints = []

  const getAngleBetween = (v1, v2) => {
    let unitV1 = v1.clone().normalize()
    let unitV2 = v2.clone().normalize()
    let cosAngle = unitV1.dot(unitV2)
    let angleRad = Math.acos(cosAngle)
    return angleRad
  }

  const arcRadiansPerSegment = arcDegPerSegment * (Math.PI / 180.0)

  // between p1 and p2
  let uRadiansTotal = getAngleBetween(p1, p2)
  const uInvSinRadians = 1.0 / Math.sin(uRadiansTotal) // for later

  // between p1 and p3
  // Note: Terminology: I declare that the path "v" is _not_ from p1 -> p3, but rather 
  // uInterpolated along the same arc as p1 -> p3. Calculating this requires calculating 
  // scalers based on p1 -> p3, and then swapping out p1 with uInterpolated. 
  let p1p3RadiansTotal = getAngleBetween(p1, p3)
  const p1p3InvSinRadians = 1.0 / Math.sin(p1p3RadiansTotal)  // for later

  let uArcSegmentCount = ceil(uRadiansTotal / arcRadiansPerSegment)
  let uRadiansPerArcSegment = uRadiansTotal / uArcSegmentCount
  let uFractionPerArcSegment = uRadiansPerArcSegment / uRadiansTotal
  for (let u = 0.0; u <= 1.01; u += uFractionPerArcSegment) {
    // console.log({ u: u })

    // u vector
    let uScalerP1 = Math.sin((1 - u) * uRadiansTotal) * uInvSinRadians
    let uScalerP2 = Math.sin((u) * uRadiansTotal) * uInvSinRadians
    let uInterpolated = (new THREE.Vector3()).addScaledVector(p1, uScalerP1).addScaledVector(p2, uScalerP2)
    // interpolatedVectorPoints.push(uInterpolated)

    // v vector from uInterpolated along the path of p1 -> p3
    let vScalerP1 = Math.sin((1 - u) * p1p3RadiansTotal) * p1p3InvSinRadians
    let vScalerP3 = Math.sin((u) * p1p3RadiansTotal) * p1p3InvSinRadians
    let vEndpoint = (new THREE.Vector3()).addScaledVector(p1, vScalerP1).addScaledVector(p3, vScalerP3)
    // interpolatedVectorPoints.push(vEndpoint)
    let vRadiansTotal = getAngleBetween(uInterpolated, vEndpoint)
    const vInvSinRadians = 1.0 / Math.sin(vRadiansTotal)
    let vArcSegmentCount = ceil(vRadiansTotal / arcRadiansPerSegment)
    let vRadiansPerArcSegment = vRadiansTotal / vArcSegmentCount
    let vFractionPerArcSegment = vRadiansPerArcSegment / vRadiansTotal
    for (let v = 0.0; v <= 1.01; v += vFractionPerArcSegment) {
      if (u == 0.0 && v == 0.0) {
        // Math.sin(0) = 0, and therefore dividing by Math.sin(0) is NaN, and we know that this 
        // is the orgin point anyway, so just skip to the end.
        interpolatedVectorPoints.push(p1)
      }
      else {
        // console.log({ u: u, v: v })
        let vScalerUInterpolated = Math.sin((1 - v) * vRadiansTotal) * vInvSinRadians
        let vScalerVEndpoint = Math.sin((v) * vRadiansTotal) * vInvSinRadians
        console.log({ u: u, v: v, vScalerUInt: vScalerUInterpolated, vScalerVEnd: vScalerVEndpoint })
        let uvInterpolated = (new THREE.Vector3()).addScaledVector(uInterpolated, vScalerUInterpolated).addScaledVector(vEndpoint, vScalerVEndpoint)
        interpolatedVectorPoints.push(uvInterpolated)
      }
    }
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
    // let interpolatedVectorPoints = interpolateAcrossTriangleSpherical(p1, p2, p3, maxArcSegmentAngleDeg)
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