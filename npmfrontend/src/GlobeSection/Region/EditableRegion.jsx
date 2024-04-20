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
import { generateRegionMesh } from "./generateRegionMesh"

function EditRegionMesh({ }) {
  // const [originalRegionBoundaries, setOriginalRegionBoundaries] = useState()
  const editState = useSelector((state) => state.editPoiReducer)
  let regionMeshRef = useRef()
  let regionLinesRef = useRef()

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

    let vertices = []
    let rawVertices = []
    editState.regionBoundaries.forEach((value, index) => {
      vertices.push(new THREE.Vector3(value.x * 1.2, value.y * 1.2, value.z * 1.2))
      rawVertices.push(value.x * 1.2)
      rawVertices.push(value.y * 1.2)
      rawVertices.push(value.z * 1.2)
    })

    let geometry = generateRegionMesh(vertices)
    let valuesPerVertex = 3
    let valuesPerIndex = 1

    // // Region mesh
    // regionMeshRef.current.geometry.setAttribute("position", new THREE.Float32BufferAttribute(geometry.vertices, valuesPerVertex))
    // regionMeshRef.current.geometry.setIndex(new THREE.Uint32BufferAttribute(geometry.triangles, valuesPerIndex))
    // regionMeshRef.current.geometry.attributes.position.needsUpdate = true
    // regionMeshRef.current.geometry.computeBoundingSphere()

    // Line
    // Note: Re-use the mesh vertices. Same vertices, different indices.
    regionLinesRef.current.geometry.setAttribute("position", new THREE.Float32BufferAttribute(geometry.vertices, valuesPerVertex))
    regionLinesRef.current.geometry.setIndex(new THREE.Uint32BufferAttribute(geometry.lines, valuesPerIndex))
    regionLinesRef.current.geometry.attributes.position.needsUpdate = true
    regionLinesRef.current.geometry.computeBoundingSphere()
  }, [editState.regionBoundaries])

  return (
    <>
      <mesh ref={regionMeshRef} name={meshNames.Region}>
        <meshBasicMaterial color={0x000ff0} side={THREE.DoubleSide} wireframe={false} />
      </mesh>

      <line ref={regionLinesRef} name={meshNames.RegionLines} width={10}>
        <lineBasicMaterial color={0xff0000} />
      </line>
    </>
  )
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
    let rotatedPoint = createWhereObjFromXYZ(rotatedOffsetVector.x, rotatedOffsetVector.y, rotatedOffsetVector.z, globeInfo.radius)
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
    // console.log({ msg: "EditableRegion()/useEffect()/editState.primaryPinPos", where: editState.primaryPinPos })
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
        <EditRegionMesh key={uuid()} />
      )
    }
    else {
      setPrimaryLocationPinReactElement(null)
    }
  }, [editState.primaryPinPos])

  // Set flag to alert that the primary POI pin's meshes are present in ThreeJs' scene and need 
  // to be added to the list of things for the raycaster to check against.
  useEffect(() => {
    // console.log({ msg: "EditableRegion()/useEffect()/primaryLocationPinReactElement", value: primaryLocationPinReactElement })

    reduxDispatch(
      editStateActions.setUpdatedPrimaryPinMeshInScene()
    )
  }, [primaryLocationPinReactElement])

  // Same for region meshes (there are several of them (pins, etc.)).
  useEffect(() => {
    console.log({ msg: "EditableRegion()/useEffect()/regionMeshesUpdated", pins: regionPinReactElements, mesh: regionMeshReactElements })

    reduxDispatch(
      editStateActions.setUpdatedRegionMeshesInScene()
    )
  }, [regionPinReactElements, regionMeshReactElements])

  // Create region pins when the number of region boundary points change.
  useEffect(() => {
    // console.log({ msg: "EditableRegion()/useEffect()/editState.regionBoundaries.length", value: editState.regionBoundaries.length })

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
