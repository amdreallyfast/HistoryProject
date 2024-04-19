import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { useDispatch, useSelector } from "react-redux"
import { meshNames, pinMeshInfo, regionInfo } from "../constValues"
import { PinMesh } from "../PinMesh"
import _ from "lodash"
import { v4 as uuid } from "uuid"
import { editStateActions } from "../../AppState/stateSliceEditPoi"
import { ConvertLatLongToVec3 } from "../convertLatLongXYZ"
import { createWhereObjFromXYZ } from "../createWhere"

// Input:
//  A: THREE.Vector3
//  B: THREE.Vector3
//  C: THREE.Vector3
const isEar = (A, B, C) => {
  // Use the right-hand rule to determine if v1 -> v2 -> v3 is:
  //  <180deg when viewed from above (cross product points into space)
  //  or
  //  >180deg when viewed from above (cross product points into the earth)
  let BA = (new THREE.Vector3()).subVectors(A, B)
  let BC = (new THREE.Vector3()).subVectors(C, B)
  let crossProduct = (new THREE.Vector3()).crossVectors(BC, BA)
  let crossProductPoint = (new THREE.Vector3()).addVectors(B, crossProduct)

  // Right-hande rule points up?
  let convex = crossProductPoint.lengthSq() > B.lengthSq()
  return convex
}

// Note: Don't worry about the point being "out of plane" because, at this point in the 
// calculation, all the points are expected to be on exactly the same plane.
// Input:
//  p: THREE.Vector3
//  A: THREE.Vector3
//  B: THREE.Vector3
//  C: THREE.Vector3
const pointInCone = (p, A, B, C) => {
  // Is the point within the cone centered on B?
  let BA = (new THREE.Vector3()).subVectors(A, B).normalize()
  let BC = (new THREE.Vector3()).subVectors(C, B).normalize()
  let Bp = (new THREE.Vector3()).subVectors(p, B).normalize()
  let cosThetaCone = BA.dot(BC)
  let cosThetaPoint = BA.dot(Bp)
  return cosThetaPoint < cosThetaCone
}

// Input:
//  p: THREE.Vector3
//  A: THREE.Vector3
//  B: THREE.Vector3
//  C: THREE.Vector3
const pointInTriangle = (p, A, B, C) => {
  // Is the point within the cone starting at A?
  if (pointInCone(p, A, B, C)) {
    return true
  }
  else if (pointInCone(p, B, C, A)) {
    return true
  }
  else if (pointInCone(p, C, A, B)) {
    return true
  }
  return false
}

// Input:
//  allPoints: THREE.Vector3 array
//  A: THREE.Vector3
//  B: THREE.Vector3
//  C: THREE.Vector3
const noOtherPointsInTriangle = (allPoints, A, B, C) => {
  allPoints.forEach((point) => {
    // simple reference comparison
    let otherPoint = (point != A) && (point != B) && (point != C)
    if (otherPoint && pointInTriangle(point, A, B, C)) {
      return false
    }
  })

  return true
}

// Generate triangles from the boundary markers based on "ear clipping" algorithm
// Input:
//  points: array of {
//    coord: THREE.Vector3,
//    vertexIndex: int
//  }
const generateRegionMeshIndicesByEarClippingAlgorithm = (points) => {
  if (points.length < 3) {
    throw Error("Need at least 3 poitns to make a triangle")
  }

  let meshIndices = []
  let lineIndicesDict = {} // Dictionary to avoid duplicate pairs

  const makeTriangle = (index1, index2, index3) => {
    // Triangle mesh
    meshIndices.push(index1)
    meshIndices.push(index2)
    meshIndices.push(index3)

    // Lines for triangle edges
    // A -> B
    lineIndicesDict[`${index1},${index2}`] = true
    lineIndicesDict[`${index2},${index1}`] = true

    // A -> C
    lineIndicesDict[`${index1},${index3}`] = true
    lineIndicesDict[`${index3},${index1}`] = true

    // B -> C
    lineIndicesDict[`${index2},${index3}`] = true
    lineIndicesDict[`${index3},${index2}`] = true
  }

  // Ear-clipping algorithm
  let meshCalculationId = uuid()
  let startIndex = 0
  while (points.length > 3) {
    console.log(`${meshCalculationId}: startIndex '${startIndex}'`)
    let index1 = (startIndex + 0) % points.length
    let index2 = (startIndex + 1) % points.length
    let index3 = (startIndex + 2) % points.length

    let A = points[index1]
    let B = points[index2]
    let C = points[index3]

    let triangleIsConvex = isEar(A.coord, B.coord, C.coord)
    let triangleIsEmpty = noOtherPointsInTriangle(points.map((point) => point.coord), A.coord, B.coord, C.coord)
    if (triangleIsConvex && triangleIsEmpty) {
      makeTriangle(A.vertexIndex, B.vertexIndex, C.vertexIndex)

      // Clip off the middle point
      let before = points.slice(0, index2)
      let after = points.slice(index2 + 1, points.length)
      points = before.concat(after)

      // Begin again
      startIndex = 0
    }
    else {
      startIndex += 1
      if (startIndex > (points.length * 2)) {
        throw Error("Iterated all points twice with no triangles. Something is wrong.")
      }
    }
  }

  // Last triangle. 
  let A = points[0]
  let B = points[1]
  let C = points[2]
  makeTriangle(A.vertexIndex, B.vertexIndex, C.vertexIndex)

  // Get line indices
  // Note: Have to extract the unique line indices from the dictionary.
  // Also Note: They were keyed in duplicate pairs, so skip every other one.
  let lineIndices = []
  const indexPairsStrArr = Object.keys(lineIndicesDict)
  for (let i = 0; i < indexPairsStrArr.length; i += 2) {
    let indexPairs = indexPairsStrArr[i].split(",")
    lineIndices.push(indexPairs[0])
    lineIndices.push(indexPairs[1])
  }

  return [meshIndices, lineIndices]
}

function GenerateRegionGeometry(regionBoundaries, globeInfo) {
  // // Create a "wrapped" longitude in the event that the region crosses the 179E <--> 179W 
  // // longitude line. That -179 <--> +179 border makes the vector mach weird.
  // let regionBoundaries2D = regionBoundaries.map((boundaryMarker, index) => {
  //   // // mod 360
  //   // let wrappedLongitude = (boundaryMarker.long + 360.0) % 360
  //   // return {
  //   //   coord: new THREE.Vector2(wrappedLongitude, boundaryMarker.lat),
  //   //   vertexIndex: index
  //   // }

  //   // // compare with marker [0]
  //   // if (index == 0) {
  //   //   let wrappedLongitude = boundaryMarker.long
  //   //   return {
  //   //     coord: new THREE.Vector2(wrappedLongitude, boundaryMarker.lat),
  //   //     vertexIndex: index
  //   //   }
  //   // }
  //   // else {
  //   //   let wrappedLongitude = calculateWrappedLongitude(boundaryMarker.long, regionBoundaries[0].long)
  //   //   return {
  //   //     coord: new THREE.Vector2(wrappedLongitude, boundaryMarker.lat),
  //   //     vertexIndex: index
  //   //   }
  //   // }

  //   let wrappedLongitude = boundaryMarker.long
  //   return {
  //     coord: new THREE.Vector2(wrappedLongitude, boundaryMarker.lat),
  //     vertexIndex: index
  //   }
  // })

  let points = regionBoundaries.map((boundaryMarker, index) => {
    return {
      coord: new THREE.Vector3(boundaryMarker.x, boundaryMarker.y, boundaryMarker.z),
      vertexIndex: index
    }
  })

  let vertices = []
  regionBoundaries.forEach((boundaryMarker, index) => {
    let vertex = new THREE.Vector3(boundaryMarker.x, boundaryMarker.y, boundaryMarker.z)
    vertex.normalize()
    vertex.multiplyScalar(globeInfo.radius * 1.2)
    vertices.push(vertex.x)
    vertices.push(vertex.y)
    vertices.push(vertex.z)
  })

  const [meshIndices, lineIndices] = generateRegionMeshIndicesByEarClippingAlgorithm(points)

  return {
    vertices: vertices,
    regionMeshIndicesArr: meshIndices,
    regionLineIndicesArr: lineIndices
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

    // Line
    // Note: Re-use the mesh vertices. Same vertices, different indices.
    regionLinesRef.current.geometry.setAttribute("position", new THREE.Float32BufferAttribute(geometry.vertices, valuesPerVertex))
    regionLinesRef.current.geometry.setIndex(new THREE.Uint32BufferAttribute(geometry.regionLineIndicesArr, valuesPerIndex))
    regionLinesRef.current.geometry.attributes.position.needsUpdate = true
    regionLinesRef.current.geometry.computeBoundingSphere()
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

      <line ref={regionLinesRef} name={meshNames.RegionLines} width={1}>
        <lineBasicMaterial color={0xff0000} />
      </line>
    </>
  )
}



// Generate a set of default points in a circle around the origin.
// We _want_ a longitude that can wrap. When the region straddles the 179E <--> 179W longitude
// line, a vector from p1 -> p2 might wrap all the way around the globe instead of taking the 
// shortest path. To fix this, make a longitude that can wrap.
const calculateWrappedLongitude = (long, longCompare) => {
  let expandedLongitude = null
  let smallestLongDiff = 10000

  // Ex:
  //  long = -175 (west)
  //  longCompare = -165 (west)
  let diff1 = Math.abs(longCompare - long)
  if (diff1 < smallestLongDiff) {
    expandedLongitude = long
    smallestLongDiff = diff1
  }

  // Ex:
  //  long = -175 (west)
  //  longCompare = +175 (west)
  let longPlus360 = long + 360
  let diff2 = Math.abs(longCompare - longPlus360)
  if (diff2 < smallestLongDiff) {
    expandedLongitude = longPlus360
    smallestLongDiff = diff2
  }

  // Ex:
  //  long = +175 (east)
  //  longCompare = -175 (west)
  let longMinus360 = long - 360
  let diff3 = Math.abs(longCompare - longMinus360)
  if (diff3 < smallestLongDiff) {
    expandedLongitude = longMinus360
    smallestLongDiff = diff3
  }

  return expandedLongitude
}

// Generate a set of default points in a circle around the origin.
// Note: Have to do this in 3D space because lat/long get squished near the poles, while 3D 
// rotation with a quaternion does not.
const createDefaultRegionBoundaries = (origin, globeInfo) => {
  let regionBoundaries = []

  // Up a bit 
  // Note: The Latitude change is always a constant distance (unlike the longitude), so use that 
  // and rotate in a circle. 
  let offset = {
    lat: origin.lat + regionInfo.defaultRegionRadius,
    long: origin.long
  }
  let offsetPoint = ConvertLatLongToVec3(offset.lat, offset.long, globeInfo.radius)

  // Generate the rest of the default region points by rotating the offset around the origin.
  let originCoord = new THREE.Vector3(origin.x, origin.y, origin.z)
  let rotationAxis = (new THREE.Vector3()).subVectors(originCoord, globeInfo.pos).normalize()
  const rotateOffset = (radians) => {
    let rotatedOffsetVector = offsetPoint.clone().applyAxisAngle(rotationAxis, radians)
    let rotatedPoint = createWhereObjFromXYZ(rotatedOffsetVector.x, rotatedOffsetVector.y, rotatedOffsetVector.z, globeInfo)
    return rotatedPoint
  }
  for (let radians = 0; radians < (Math.PI * 2); radians += (Math.PI / 4)) {
    let rotated = rotateOffset(radians)
    regionBoundaries.push(rotated)
  }

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

      setRegionMeshReactElements(
        <EditRegionMesh key={uuid()} globeInfo={globeInfo} />
      )
    }
    else {
      setPrimaryLocationPinReactElement(null)
    }
  }, [editState.primaryPinPos])

  // Set flag to alert that the primary POI pin's meshes are present in ThreeJs' scene and need 
  // to be added to the list of things for the raycaster to check against.
  useEffect(() => {
    // console.log({ msg: "EditRegion()/useEffect()/primaryLocationPinReactElement", where: primaryLocationPinReactElement })

    reduxDispatch(
      editStateActions.setUpdatedPrimaryPinMeshInScene()
    )
  }, [primaryLocationPinReactElement])

  // Same for region meshes (there are several of them).
  useEffect(() => {
    // console.log({ msg: "EditRegion()/useEffect()/regionPinReactElements", where: regionPinReactElements })

    reduxDispatch(
      editStateActions.setUpdatedRegionMeshesInScene()
    )
  }, [regionPinReactElements])



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
