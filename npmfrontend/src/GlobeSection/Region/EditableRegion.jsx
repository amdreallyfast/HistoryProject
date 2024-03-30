import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { useDispatch, useSelector } from "react-redux"
import { meshNames, pinMeshInfo, regionInfo } from "../constValues"
import { PinMesh } from "../PinMesh"
import _ from "lodash"
import { v4 as uuid, validate } from "uuid"
import { editStateActions } from "../../AppState/stateSliceEditPoi"
import { ConvertLatLongToXYZ, ConvertXYZToLatLong } from "../convertLatLongXYZ"
import { createWhere } from "../createWhere"


function GenerateRegionGeometry(regionBoundaries, globeInfo) {
  // A plain array of [x1, y1, z1, x2, y2, z2...]
  // Note: This is fixed based on the region boundaries. The indices make the triangles from this.
  let vertices = [] // TODO: delete

  // Defines triangles based on the vertices.
  let regionGeometryIndicesArr = []

  // Use a dictionary key's uniqueness to eliminate duplicate lines from adjacent triangles.
  // Note: The dictionary key pairs are themselves paired like "a,b"/"b,a" in order to catch all 
  // variations on the same line. OpenGL does not require lines to be displayed clockwise or 
  // countclockwise, so just one pair of indices is good.
  let lineIndicesDict = {}

  let boundaryMarkerPointsDisposable = []
  let boundaryMarkerPoints = []

  regionBoundaries.forEach((boundaryMarker, index) => {
    // Move the point out from the globe a tad so that it sits on the surface.
    let v = new THREE.Vector3(boundaryMarker.x, boundaryMarker.y, boundaryMarker.z)
    let vNormal = v.clone().normalize()
    // let vRescaled = vNormal.clone().multiplyScalar(globeInfo.radiusToRegionMesh)
    let vRescaled = vNormal.clone().multiplyScalar(globeInfo.radius)
    let point = {
      values: [vRescaled.x, vRescaled.y, vRescaled.z],
      vec3: vRescaled,
      // normal: vNormal,
      index: index
    }
    vertices.push(...point.values)
    boundaryMarkerPointsDisposable.push(point)
    boundaryMarkerPoints.push(point)
  })

  // That is, the middle vertex p2 is further out of the region than the other two.
  const triangleIsConvex = (p1, p2, p3) => {
    // Use the right-hand rule to determine if v1 -> v2 -> v3 is:
    //  <180deg when viewed from above (cross product points into space)
    //  or
    //  >180deg when viewed from above (cross product points into the earth)
    let v2v1 = (new THREE.Vector3()).subVectors(p1, p2)
    let v2v3 = (new THREE.Vector3()).subVectors(p3, p2)
    let crossProduct = (new THREE.Vector3()).crossVectors(v2v3, v2v1)
    let crossProductPoint = (new THREE.Vector3()).addVectors(p2, crossProduct)
    let regionMeshRadiusSq = globeInfo.radiusToRegionMesh * globeInfo.radiusToRegionMesh
    let rightHandRulePointsUp = crossProductPoint.lengthSq() > regionMeshRadiusSq

    return rightHandRulePointsUp
  }

  // Define "flat" = "<10deg" or ">170deg".
  const triangleTooThin = (p1, p2, p3) => {
    let v2v1 = (new THREE.Vector3()).subVectors(p1, p2)
    let v2v3 = (new THREE.Vector3()).subVectors(p3, p2)
    let cosAngle = v2v1.normalize().dot(v2v3.normalize())
    let flat = cosAngle < -0.985 || cosAngle > 0.985

    // if (p1.index == 0 && p2.index == 1 && p3.index == 2) {
    //   console.log(cosAngle)
    // }

    // if (flat) {
    //   console.log({ msg: "flat", p1: p1.index, p2: p2.index, p3: p3.index })
    // }
    return flat
  }

  const triangleContainsPoint = (p1, p2, p3, point) => {
    // console.log({ p1: p1, p2: p2, p3: p3, point: point })

    // Check if the vector p1Point is between the vectors p1p2 and p1p3.
    let v1 = (new THREE.Vector3()).subVectors(p2, p1).normalize()
    let v2 = (new THREE.Vector3()).subVectors(p3, p1).normalize()
    let vPoint = (new THREE.Vector3()).subVectors(point, p1).normalize()
    let theta = v1.dot(v2)
    let thetaPoint = v1.dot(vPoint)
    if (thetaPoint > theta) {
      return false
    }

    // Check if the vector p2Point is between the vectors p2p1 and p2p3.
    v1 = (new THREE.Vector3()).subVectors(p1, p2).normalize()
    v2 = (new THREE.Vector3()).subVectors(p3, p2).normalize()
    vPoint = (new THREE.Vector3()).subVectors(point, p2).normalize()
    theta = v1.dot(v2)
    thetaPoint = v1.dot(vPoint)
    if (thetaPoint > theta) {
      return false
    }

    // Check if the vector p3Point is between the vectors p3p1 and p3p2.
    v1 = (new THREE.Vector3()).subVectors(p1, p3).normalize()
    v2 = (new THREE.Vector3()).subVectors(p2, p3).normalize()
    vPoint = (new THREE.Vector3()).subVectors(point, p3).normalize()
    theta = v1.dot(v2)
    thetaPoint = v1.dot(vPoint)
    if (thetaPoint > theta) {
      return false
    }

    // The lines from each triangle vertex to the point are all in bounds.
    return true
  }

  // Note: Vertices already in an array. Just need the indices.
  const makeTriangle = (p1, p2, p3) => {
    // triangle
    regionGeometryIndicesArr.push(p1.index)
    regionGeometryIndicesArr.push(p2.index)
    regionGeometryIndicesArr.push(p3.index)

    // Line 1: v1 -> v2
    lineIndicesDict[`${p1.index},${p2.index}`] = true
    lineIndicesDict[`${p2.index},${p1.index}`] = true

    // Line 2: v1 -> v3
    lineIndicesDict[`${p1.index},${p3.index}`] = true
    lineIndicesDict[`${p3.index},${p1.index}`] = true

    // Line 3: v2 -> v3
    lineIndicesDict[`${p2.index},${p3.index}`] = true
    lineIndicesDict[`${p3.index},${p2.index}`] = true
  }

  // Generate basic mesh using region boundaries and the "ear clipping" algorithm.
  // Note: Points assumed to be counterclockwise from the perspective of the default camera.
  let startIndex = 0
  while (boundaryMarkerPointsDisposable.length > 0) {
    let index1 = startIndex
    let index2 = startIndex + 1
    let index3 = startIndex + 2

    if (index1 >= boundaryMarkerPointsDisposable.length) {
      throw new Error("how the starting index end up wrapping all the way around?")
    }
    else if (index2 == boundaryMarkerPointsDisposable.length) {
      // Wrap around 
      // Ex: Indices 5,0,1. 
      index2 = 0
      index3 = 1
    }
    else if (index3 == boundaryMarkerPointsDisposable.length) {
      // Wrap around
      // Ex: Indices 4,5,0
      index3 = 0
    }

    let p1 = boundaryMarkerPointsDisposable[index1]
    let p2 = boundaryMarkerPointsDisposable[index2]
    let p3 = boundaryMarkerPointsDisposable[index3]

    if (boundaryMarkerPointsDisposable.length == 3) {
      // Last possible triangle.
      makeTriangle(p1, p2, p3)
      boundaryMarkerPointsDisposable = []
    }
    else if (triangleTooThin(p1.vec3, p2.vec3, p3.vec3) || !triangleIsConvex(p1.vec3, p2.vec3, p3.vec3)) {
      // Either too flat to consider or the middle point of the triangle is not an "ear". Skip.
      startIndex += 1
    }
    else {
      // Check if any of the rest of the hull points are contained in the remaining points.
      // Note: This is a corner case scenario, but might happen.
      let remainingPoints = boundaryMarkerPointsDisposable.slice(startIndex + 3, boundaryMarkerPointsDisposable.length)
      let containedPoints = []
      remainingPoints.forEach((point, index) => {
        if (triangleContainsPoint(p1.vec3, p2.vec3, p3.vec3, point.vec3)) {
          containedPoints.push(point)
        }
      })

      if (containedPoints.length > 0) {
        // Skip empty triangles.
        startIndex += 1
      }
      else {
        // Make a traingle out of empty convex triangles.
        makeTriangle(p1, p2, p3)

        // And clip off v2.
        let beforeV2 = boundaryMarkerPointsDisposable.slice(0, index2)
        let afterV2 = boundaryMarkerPointsDisposable.slice(index2 + 1, boundaryMarkerPointsDisposable.length)
        boundaryMarkerPointsDisposable = beforeV2.concat(afterV2)

        // Restart loop.
        startIndex = 0
      }
    }
  }

  // Extract the unique line indices from the dictionary.
  let regionLineIndicesArr = []
  const indexPairsStrArr = Object.keys(lineIndicesDict)
  for (let i = 0; i < indexPairsStrArr.length; i += 2) {
    let indexPairs = indexPairsStrArr[i].split(",")
    regionLineIndicesArr.push(indexPairs[0])
    regionLineIndicesArr.push(indexPairs[1])
  }


  let myVertices = []
  let myTriangleIndices = []
  let myLineIndices = []
  const maxDistBetweenInterpolatedPoints = 0.3
  const distBetweenPointsSq = maxDistBetweenInterpolatedPoints * maxDistBetweenInterpolatedPoints

  let longestLine = 0

  // To make the mesh smooth, interpolate new points across each triangle.
  for (let i = 0; i < regionGeometryIndicesArr.length; i += 3) {
    let boundaryMarker1 = boundaryMarkerPoints[regionGeometryIndicesArr[i + 0]].vec3
    let boundaryMarker2 = boundaryMarkerPoints[regionGeometryIndicesArr[i + 1]].vec3
    let boundaryMarker3 = boundaryMarkerPoints[regionGeometryIndicesArr[i + 2]].vec3

    // Generate interpolated vertices
    let verticesVec3 = interpolateAcrossTriangleFlat(boundaryMarker1, boundaryMarker2, boundaryMarker3, maxDistBetweenInterpolatedPoints)
    let verticesRaw = []
    let longLatArr = []
    verticesVec3.forEach((vec3, index) => {
      verticesRaw.push(vec3.x, vec3.y, vec3.z)

      const [lat, long] = ConvertXYZToLatLong(vec3.x, vec3.y, vec3.z, globeInfo.radius)
      longLatArr.push([long, lat])
    })

    // Triangulate all those little points
    let delaunay = d3Geo.geoDelaunay(longLatArr)

    // And the indices to the collection, taking into account the number of vertices already in 
    // the vertices array.
    let numExistingVertices = myVertices.length
    delaunay.triangles.forEach((triangleIndicesArr, index) => {
      let p1 = verticesVec3[triangleIndicesArr[0]]
      let p2 = verticesVec3[triangleIndicesArr[1]]
      let p3 = verticesVec3[triangleIndicesArr[2]]

      let line1Len = (new THREE.Vector3()).subVectors(p1, p2).length()
      let line2Len = (new THREE.Vector3()).subVectors(p1, p3).length()
      let line3Len = (new THREE.Vector3()).subVectors(p2, p3).length()

      let generosityMultiplier = 1.2
      let lineTooLong = false
      lineTooLong ||= line1Len > (maxDistBetweenInterpolatedPoints * generosityMultiplier)
      lineTooLong ||= line2Len > (maxDistBetweenInterpolatedPoints * generosityMultiplier)
      lineTooLong ||= line3Len > (maxDistBetweenInterpolatedPoints * generosityMultiplier)

      if (lineTooLong) {
        // Ignore. The max distance between points (specified for my interpolation algorithm) was
        // surpassed by the delaunay algorithm, which doesn't bother with such triffles as max 
        // length on an edge (which is exactly what I need to enforce).

        // console.log("skip")
      }
      else {
        let i1 = (numExistingVertices / 3) + triangleIndicesArr[0]
        let i2 = (numExistingVertices / 3) + triangleIndicesArr[1]
        let i3 = (numExistingVertices / 3) + triangleIndicesArr[2]

        myTriangleIndices.push(i1)
        myTriangleIndices.push(i2)
        myTriangleIndices.push(i3)

        myLineIndices.push(i1, i2)
        myLineIndices.push(i1, i3)
        myLineIndices.push(i2, i3)
      }
    })


    //??where are these long lines coming from? and why does it bug me so much??

    // TODO: ??preserve the "points" throughout the calculation so that you can find their index??
    // you _do_ need to clean up


    // TODO: delete
    delaunay.edges.forEach((edgeIndicesArr, index) => {
      let p1 = verticesVec3[edgeIndicesArr[0]]
      let p2 = verticesVec3[edgeIndicesArr[1]]
      let line = (new THREE.Vector3()).subVectors(p2, p1)

      if (line.length() > longestLine) {
        // console.log({ longest: longestLine, newLongest: line.length() })
        longestLine = line.length()
      }
    })

    // Lastly add the vertices.
    myVertices.push(...verticesRaw)
  }

  return {
    vertices: myVertices,
    regionMeshIndicesArr: myTriangleIndices,
    regionLineIndicesArr: myLineIndices
  }
}

function EditRegionMesh({ globeInfo }) {
  // const [originalRegionBoundaries, setOriginalRegionBoundaries] = useState()
  const editState = useSelector((state) => state.editPoiReducer)
  const mouseState = useSelector((state) => state.mouseInfoReducer)
  let regionMeshRef = useRef()
  let regionLinesRef = useRef()

  // For use during click-and-drag. Update once click-and-drag ends.
  const preMoveQuat = useRef(new THREE.Quaternion())

  // Region changed => regenerate mesh
  useEffect(() => {
    // console.log({ msg: "RegionMeshRegionMesh()/useEffect()/editState.regionBoundaries", value: editState.regionBoundaries })
    if (regionMeshRef.current == null || regionLinesRef.current == null) {
      return
    }
    else if (editState.regionBoundaries.length < 3) {
      // Not enough points for a triangle
      return
    }

    let geometry = GenerateRegionGeometry(editState.regionBoundaries, globeInfo)
    let valuesPerVertex = 3
    let valuesPerIndex = 1

    // Region mesh
    regionMeshRef.current.geometry.setAttribute("position", new THREE.Float32BufferAttribute(geometry.vertices, valuesPerVertex))
    regionMeshRef.current.geometry.setIndex(new THREE.Uint32BufferAttribute(geometry.regionMeshIndicesArr, valuesPerIndex))
    regionMeshRef.current.geometry.attributes.position.needsUpdate = true
    regionMeshRef.current.geometry.computeBoundingSphere()

    // // Line
    // // Note: Re-use the mesh vertices. Same vertices, different indices.
    // regionLinesRef.current.geometry.setAttribute("position", new THREE.Float32BufferAttribute(geometry.vertices, valuesPerVertex))
    // regionLinesRef.current.geometry.setIndex(new THREE.Uint32BufferAttribute(geometry.regionLineIndicesArr, valuesPerIndex))
    // regionLinesRef.current.geometry.attributes.position.needsUpdate = true
  }, [editState.regionBoundaries])


  //??do I need to delay one more frame and then activate a flag to make the "intersectable meshes" calculation update? is there a geometry buffer caching going on??
  //  no, coulnd't be; I experimented in the Scene by having the meshes be pulled from the existing scene every single frame just prior to raycasting, and it still didn't work
  //  ??what gives??



  // // Update click-and-drag
  // useEffect(() => {
  //   // console.log({ msg: "RegionMeshRegionMesh()/useEffect()/editState.clickAndDrag", value: editState.clickAndDrag })
  //   if (!editState.editModeOn) {
  //     return
  //   }

  //   let moveRegion = (editState.clickAndDrag?.mesh.uuid == regionMeshRef.current.uuid)
  //   if (!moveRegion) {
  //     return
  //   }

  //   let qMouseJson = editState.clickAndDrag.rotorQuaternion
  //   let qMouse = new THREE.Quaternion(qMouseJson.x, qMouseJson.y, qMouseJson.z, qMouseJson.w)

  //   regionMeshRef.current.quaternion.multiplyQuaternions(preMoveQuat.current, qMouse)
  //   regionLinesRef.current.quaternion.multiplyQuaternions(preMoveQuat.current, qMouse)
  // }, [editState.clickAndDrag])

  // // Update following click-and-drag
  // useEffect(() => {
  //   // console.log({ msg: "RegionMeshRegionMesh()/useEffect()/editState.mouseUp", value: editState.mouseUp })
  //   if (!mouseState.mouseUp) {
  //     return
  //   }

  //   console.log("hello?")
  //   if (!preMoveQuat.current.equals(regionMeshRef.current.quaternion)) {

  //     console.log("updating quat")
  //     // Record updated position
  //     // Note: The mesh position was already been updated in real time. We just need to update 
  //     // this position reference for the next click-and-drag.
  //     preMoveQuat.current = regionMeshRef.current.quaternion.clone()
  //   }
  // }, [mouseState.mouseUp])

  return (
    <>
      <mesh ref={regionMeshRef} name={meshNames.Region}>
        <meshBasicMaterial color={0x000ff0} side={THREE.DoubleSide} wireframe={false} />
      </mesh>

      <line ref={regionLinesRef} name={meshNames.RegionLines} width={4}>
        <lineBasicMaterial color={0xff0000} />
      </line>

    </>
  )
}


// // Occurs when the first point of a new region is calculated near the poles and the flat latitude 
// // increase puts it over +-90 degree limits.
// const fixLatitudeWrap = (lat, long) => {
//   let latCorrected = lat
//   if (lat > 90) {
//     let latOverflow = lat - 90
//     latCorrected = lat - (2 * latOverflow)
//   }
//   else if (lat < -90) {
//     let latOverflow = lat - (-90)
//     latCorrected = lat - (2 * latOverflow)
//   }
//   else {
//     // No fix necessary
//   }

//   let longCorrected = long
//   if (latCorrected != lat) {
//     // Point was moved over the pole. Move the longitude to compensate and bring the point back 
//     // to its original globe position, but now with correct lat/long.
//     longCorrected = long < 0 ? long + 180 : long - 180
//   }

//   return [
//     latCorrected,
//     longCorrected
//   ]
// }



// We _want_ a longitude that can wrap. When the region straddles the 179E <--> 179W longitude
// line, a vector from p1 -> p2 might wrap all the way around the globe instead of taking the 
// shortest path. To fix this, make a longitude that can wrap.
const calculateWrappedLongitude = (long, longCompare) => {
  let possiblyWrappedLongitude = null

  let longAsIs = long
  let longPlus360 = long + 360
  let longMinus360 = long - 360

  let smallestLongDiff = 10000
  let diff = 0

  diff = Math.abs(longCompare - longAsIs)
  if (diff < smallestLongDiff) {
    possiblyWrappedLongitude = long
    smallestLongDiff = diff
  }

  diff = Math.abs(longCompare - longPlus360)
  if (diff < smallestLongDiff) {
    possiblyWrappedLongitude = longPlus360
    smallestLongDiff = diff
  }

  diff = Math.abs(longCompare - longMinus360)
  if (diff < smallestLongDiff) {
    possiblyWrappedLongitude = longMinus360
    smallestLongDiff = diff
  }

  return possiblyWrappedLongitude

  // else if (Math.abs(longCompare - (long + 360)) <)
  // let longDiffAsIs = longCompare - long
  // let longDiffPlus360 = longCompare - (long + 360)
  // let longDiffMinus360 = longCompare - (long - 360)

  // let smallestLongDiff = 10000
  // smallestLongDiff = Math.abs(longDiffAsIs < smallestLongDiff ? longDiffAsIs : smallestLongDiff)
  // smallestLongDiff = Math.abs(longDiffPlus360 < smallestLongDiff ? longDiffPlus360 : smallestLongDiff)
  // smallestLongDiff = Math.abs(longDiffMinus360 < smallestLongDiff ? longDiffMinus360 : smallestLongDiff)

  // let result = long - smallestLongDiff
  // return result
}

// // Region boundaries that straddle the 179E -> 179W line will appear on opposite sides of a 
// // long/lat map, and any connecting vectors will go all the way around the world rather than the 
// // short hop across the boundary. Avoid this by figuring out if a point's longitude should be 
// // increased/decresed by 360 degrees to bring it closer to the other points.
// /*
// Input:
//   Array of:
//     {
//       lat,
//       long,
//     }

// Output:
//   Array of:
//     {
//       lat,
//       long,
//       longNoWrap: null
//     }
// */
// const setNoWrapRegionBoundaries = (regionBoundaries) => {
//     // Create "no-wrap longitude" based on proximity to the first point.
//     let thing = regionBoundaries.map((regionBoundary, index) => {
//       if (index == 0) {
//         return point
//       }

//       // Problem 1: 
//       //  Deal with the 179E -> 179W line.
//       let firstPoint = new THREE.Vector2(regionBoundaries[0].long, regionBoundaries[0].lat)
//       let thisPoint = new THREE.Vector2(regionBoundary.long, regionBoundary.lat)
//       let thisPointPlus360 = new THREE.Vector2(regionBoundary.long + 360.0, regionBoundary.lat)
//       let thisPointMinus360 = new THREE.Vector2(regionBoundary.long - 360.0, regionBoundary.lat)

//       // let dist_firstPoint_to_thisPoint = firstPoint.distanceToSquared(thisPoint)
//       // let dist_firstPoint_to_thisPointPlus360 = firstPoint.distanceToSquared(thisPointPlus360)
//       // let dist_firstPoint_to_thisPointMinus360 = firstPoint.distanceToSquared(thisPointMinus360)
//       let longDiff_firstPoint_to_thisPoint = firstPoint.long - thisPoint.long
//       let longDiff_firstPoint_to_thisPointPlus360 = firstPoint.long - thisPointPlus360.long
//       let longDiff_firstPoint_to_thisPointMinus360 = firstPoint.long - thisPointMinus360.long

//       let smallestLongDiff = 10000
//       smallestLongDiff = longDiff_firstPoint_to_thisPoint < smallestLongDiff ? longDiff_firstPoint_to_thisPoint : smallestLongDiff
//       smallestLongDiff = longDiff_firstPoint_to_thisPointPlus360 < smallestLongDiff ? longDiff_firstPoint_to_thisPointPlus360 : smallestLongDiff
//       smallestLongDiff = longDiff_firstPoint_to_thisPointMinus360 < smallestLongDiff ? longDiff_firstPoint_to_thisPointMinus360 : smallestLongDiff

//       // Problem 2: 
//       //  Deal with the situation in which the first point was given a 
//       //  latitude > 90deg or < -90deg. This doesn't mess up the math, but it does make for an 
//       //  invalid lat/long record.
//     let lat = nextPoint.y
//     let long = nextPoint.x
//     if (lat > 90) {
//       let overflow = lat - 90
//       lat = lat - (2 * overflow)
//     }
//     else if (lat < -90) {
//       let overflow = lat - 90
//       lat = lat - overflow
//     }

//       return {
//         ...regionBoundary
//         lat: thisPoint.lat,
//         long: thisPoint.long,
//         longNoWrap: thisPoint.long + smallestLongDiff
//       }
//     })
// }

// Generate a set of default points in a circle around the origin.
const createDefaultRegionBoundaries = (origin, globeInfo) => {
  /*
  - work in lat/long
  - set initial point by increasing latitude (const distance regardless of where on the globe you are)
  - perform 2D rotation
  - when performing click-and-drag, need to track 2x longitude values: "long" and "overflow long"
    - "long" is the normal longitude
    - "overflow long" for if we need to take the longitude and extend it past +-180deg in order to maintain the shortest distance
  */


  // Let the first point be the center latitude increased by a bit, and then rotate that.
  // Note: The Latitude change is always a constant distance (unlike the longitude), so use that 
  // and rotate in a circle. 
  let originPoint = new THREE.Vector2(origin.long, origin.lat)
  let firstPoint = new THREE.Vector2(origin.long, origin.lat + regionInfo.defaultRegionRadius)
  let regionBoundaries = []
  for (let radians = 0; radians < (Math.PI * 2); radians += (Math.PI / 4)) {
    // Note: When "radians" == 0, this captures the unrotated firstPoint.
    let nextPoint = firstPoint.clone().rotateAround(originPoint, radians)

    // Fix the corner case when the first point (and maybe other rotated points as well) go over 
    // a pole and thus have latitude >90 or <-90. Cleanest fix is to convert to 3D coordinates 
    // and back again.
    const [x, y, z] = ConvertLatLongToXYZ(nextPoint.y, nextPoint.x, globeInfo.radius)
    const [lat, long] = ConvertXYZToLatLong(x, y, z, globeInfo.radius)
    let boundaryMarker = createWhere(lat, long, x, y, z)
    regionBoundaries.push(boundaryMarker)
  }

  // Create a "wrapped" longitude in the event that some of the points straddle the 179E -> 179W longitude line.
  regionBoundaries.forEach((regionBoundary, index) => {
    if (index == 0) {
      regionBoundary.wrappedLongitude = regionBoundary.long
    }

    let wrappedLongitude = calculateWrappedLongitude(regionBoundary.long, regionBoundaries[0].long)
    regionBoundary.wrappedLongitude = wrappedLongitude
  })

  // regionBoundaries = regionBoundaries.map((regionBoundary, index) => {
  //   if (index == 0) {
  //     return {
  //       ...regionBoundary,
  //       wrappedLongitude: regionBoundary.long
  //     }
  //   }

  //   let wrappedLongitude = calculateWrappedLongitude(regionBoundary.long, regionBoundaries[0].long)

  //   return {
  //     ...regionBoundary,
  //     wrappedLongitude
  //   }
  // })

  return regionBoundaries
}

export function EditableRegion({ globeInfo }) {
  // TODO: once I have an aray of searchable POIs, get rid of "lat, long" inputs, search the POIs for this ID, and extract the necessary data
  const editState = useSelector((state) => state.editPoiReducer)

  const [primaryLocationPinReactElement, setPrimaryLocationPinReactElement] = useState()
  const [regionPinReactElements, setRegionPinReactElements] = useState()
  const [regionMeshReactElements, setRegionMeshReactElements] = useState()
  const reduxDispatch = useDispatch()

  // Create PrimaryPOI pin mesh + (maybe) region pins + region mesh
  useEffect(() => {
    // console.log({ msg: "EditRegion()/useEffect()/editState.primaryPinPos", where: editState.primaryPinPos })
    if (!editState.editModeOn) {
      return
    }

    if (editState.primaryPinPos) {
      let regionBoundaries = editState.regionBoundaries
      if (regionBoundaries.length == 0) {
        regionBoundaries = createDefaultRegionBoundaries(editState.primaryPinPos, globeInfo)
      }

      reduxDispatch(
        editStateActions.setRegionBoundaries(regionBoundaries)
      )

      // setRegionMeshReactElements(
      //   <EditRegionMesh key={uuid()} globeInfo={globeInfo} />
      // )
    }
    else {
      setPrimaryLocationPinReactElement(null)
    }


    // if (editState.primaryPinPos) {
    //   let reactElement = (
    //     <PinMesh
    //       key={uuid()} // React requires unique IDs for all elements
    //       poiId={editState.poiId}
    //       name={meshNames.PoiPrimaryLocationPin}
    //       where={editState.primaryPinPos}
    //       globeInfo={globeInfo}
    //       colorHex={pinMeshInfo.mainPinColor}
    //       length={pinMeshInfo.length}
    //       scale={pinMeshInfo.mainPinScale}
    //       lookAt={globeInfo.pos} />
    //   )
    //   setPrimaryLocationPinReactElement(reactElement)

    //   // If this is a new POI, create default boundaries, else use what is already defined
    //   let regionBoundaries = editState.regionBoundaries
    //   if (regionBoundaries.length == 0) {
    //     regionBoundaries = createDefaultRegionBoundaries(editState.primaryPinPos, globeInfo)
    //   }

    //   setRegionMeshReactElements(
    //     <EditRegionMesh key={uuid()} globeInfo={globeInfo} />
    //   )
    // }
    // else {
    //   // De-select
    //   setPrimaryLocationPinReactElement(null)
    // }
  }, [editState.primaryPinPos])

  // Wait until after ThreeJs is done integrating the mesh into the scene before flagging to 
  // re-find the interactable meshes for the raycaster.
  useEffect(() => {
    // console.log({ msg: "EditRegion()/useEffect()/primaryLocationPinReactElement", where: primaryLocationPinReactElement })

    reduxDispatch(
      editStateActions.setPrimaryPinMeshExists(primaryLocationPinReactElement != null)
    )
  }, [primaryLocationPinReactElement])

  // Create region pins when the number of region boundary points change.
  useEffect(() => {
    // console.log({ msg: "EditRegion()/useEffect()/editState.regionBoundaries.length", value: editState.regionBoundaries.length })

    let reactElements = editState.regionBoundaries.map((where) => {
      return (
        <PinMesh
          key={uuid()}
          poiId={editState.poiId}
          name={meshNames.RegionBoundaryPin}
          where={where}
          globeInfo={globeInfo}
          colorHex={pinMeshInfo.regionPinColor}
          length={pinMeshInfo.length}
          scale={pinMeshInfo.regionPinScale}
          lookAt={globeInfo.pos} />
      )
    })
    setRegionPinReactElements(reactElements)
  }, [editState.regionBoundaries.length])

  return (
    <>
      {primaryLocationPinReactElement}
      {regionPinReactElements}
      {regionMeshReactElements}
    </>
  )
}
