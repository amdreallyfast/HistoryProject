import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { useDispatch, useSelector } from "react-redux"
import { meshNames, pinMeshInfo, regionInfo } from "../constValues"
import { PinMesh } from "../PinMesh"
import _ from "lodash"
import { v4 as uuid } from "uuid"
import { editStateActions } from "../../AppState/stateSliceEditPoi"
import { ConvertLatLongToVec3 } from "../convertLatLongXYZ"
import { createSpherePointFromXYZ } from "../createSpherePoint"
import { EditRegionMesh } from "./EditRegionMesh"

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
    let rotatedPoint = createSpherePointFromXYZ(rotatedOffsetVector.x, rotatedOffsetVector.y, rotatedOffsetVector.z, globeInfo.radius)
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
    console.log({ "EditableRegion useEffect: editState.primaryLoc": editState.primaryLoc })
    if (!editState.editModeOn) {
      return
    }

    if (editState.primaryLoc) {
      let regionBoundaries = editState.regionBoundaries
      if (regionBoundaries.length == 0) {
        regionBoundaries = createDefaultRegionBoundaries(editState.primaryLoc, globeInfo)
      }
      reduxDispatch(editStateActions.setRegionBoundaries(regionBoundaries))

      setPrimaryLocationPinReactElement(
        <PinMesh
          key={uuid()}
          pinType={meshNames.PrimaryPin}
          eventId={editState.eventId}
          spherePoint={editState.primaryLoc}
          globeInfo={globeInfo}
          colorHex={pinMeshInfo.primaryPinColor}
          length={pinMeshInfo.length}
          scale={pinMeshInfo.primaryPinScale}
          lookAt={globeInfo.pos} />
      )
      setRegionMeshReactElements(
        <EditRegionMesh key={uuid()} sphereRadius={globeInfo.radius} />
      )
    }
    else {
      setPrimaryLocationPinReactElement(null)
    }
  }, [editState.primaryLoc?.id])

  // Set flag to alert that the primary POI pin's meshes are present in ThreeJs' scene and need 
  // to be added to the list of things for the raycaster to check against.
  useEffect(() => {
    // console.log({ "EditableRegion useEffect primaryLocationPinReactElement": primaryLocationPinReactElement })

    reduxDispatch(editStateActions.setUpdatedPrimaryPinMeshInScene())
  }, [primaryLocationPinReactElement])

  // Same for region meshes (there are several of them (pins, etc.)).
  useEffect(() => {
    // console.log({ "EditableRegion useEffect regionMeshesUpdated": regionPinReactElements, mesh: regionMeshReactElements })

    reduxDispatch(editStateActions.setUpdatedRegionMeshesInScene())
  }, [regionPinReactElements, regionMeshReactElements])

  // Create region pins when the number of region boundary points change.
  useEffect(() => {
    // console.log({ "EditableRegion useEffect editState.regionBoundaries.length": editState.regionBoundaries.length })

    let reactElements = editState.regionBoundaries.map((spherePoint) => {
      return (
        <PinMesh
          key={uuid()}
          pinType={meshNames.RegionBoundaryPin}
          eventId={editState.eventId}
          spherePoint={spherePoint}
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
