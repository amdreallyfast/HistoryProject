import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { useDispatch, useSelector } from "react-redux"
import { createSpherePointFromXYZ } from "./createSpherePoint"
import { meshNames } from "./constValues"
import { editStateActions } from "../AppState/stateSliceEditPoi"
import _ from "lodash"

export function PinMesh({ pinType, eventId, spherePoint, globeInfo, colorHex, length = 3, scale = 0.1, lookAt = new THREE.Vector3(0, 0, 1) }) {
  if (!pinType) {
    throw new Error(`'${Object.keys({ pinType })}' must be defined`)
  }
  if (!eventId) {
    throw new Error(`'${Object.keys({ eventId })}' must be defined`)
  }
  if (!(spherePoint?.id)) {
    throw new Error(`'${Object.keys({ spherePoint })}.id' must be defined`)
  }

  const editState = useSelector((state) => state.editPoiReducer)
  const mouseState = useSelector((state) => state.mouseInfoReducer)
  const reduxDispatch = useDispatch()
  const meshRef = useRef()
  const boxMeshRef = useRef()

  // For use during click-and-drag. Update once click-and-drag ends.
  const originalPosRef = useRef()

  const colors = {
    normal: 0xffffff,
    highlight: 0x00f0f0,
  }

  function makePin() {
    const sqrt3Over2 = Math.sqrt(3.0) / 2.0
    const oneHalf = 0.5

    // Make an equilateral triangle pyramid with the point facing the center of the globe.
    // Note: Values from the unit circle, 120deg apart.
    // Also Note: ThreeJs's "lookat(...)" function considers the object's local Z axis to be the 
    // "pointing" axis.
    let baseVertex1 = new THREE.Vector3(0, 1, 0)
    let baseVertex2 = new THREE.Vector3(-sqrt3Over2, -oneHalf, 0)
    let baseVertex3 = new THREE.Vector3(+sqrt3Over2, -oneHalf, 0)
    let topVertex = new THREE.Vector3(0, 0, length)
    let vertices = [...baseVertex1, ...baseVertex2, ...baseVertex3, ...topVertex]
    let indices = []
    indices.push(0, 1, 2) // base (top)
    indices.push(0, 3, 1) // face 1
    indices.push(1, 3, 2) // face 2
    indices.push(2, 3, 0) // face 3

    // vertices
    let valuesPerVertex = 3
    let posAttribute = new THREE.Float32BufferAttribute(vertices, valuesPerVertex)
    meshRef.current.geometry.setAttribute("position", posAttribute)

    // indices
    let valuesPerIndex = 1
    let indicesAttribute = new THREE.Uint32BufferAttribute(indices, valuesPerIndex)
    meshRef.current.geometry.setIndex(indicesAttribute)

    // scale
    meshRef.current.geometry.scale(scale, scale, scale)

    // Move into position.
    // Note: The pyramid base's local Z is 0. Once moved into position, rotate the object's local 
    // Z axis so that +Z points at the globe center. At that point, the object's base will be at 
    // the globe's surface and the top will be inside the globe, so we need to back off the 
    // length of the pin.
    meshRef.current.position.x = spherePoint.x
    meshRef.current.position.y = spherePoint.y
    meshRef.current.position.z = spherePoint.z
    meshRef.current.lookAt(lookAt)

    // Mesh origin was the top of the pin. Shift the whole thing so that the end of the pin (
    // after rotating via lookat(...)) is barely touching the surface of the globe.
    meshRef.current.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -(length * scale)))

    // color
    meshRef.current.material.color = new THREE.Color(colorHex)

    meshRef.current.geometry.attributes.position.needsUpdate = true
  }

  function makeBoundingBox() {
    const sqrt3Over2 = Math.sqrt(3.0) / 2.0
    let pinMaxWidth = sqrt3Over2 * 2
    let boundingBoxWidth = pinMaxWidth * 2
    let boundingBoxHeight = length * 1.1
    let boxGeometry = new THREE.BoxGeometry(boundingBoxWidth, boundingBoxHeight, boundingBoxWidth)

    // vertices
    let valuesPerVertex = 3
    let posAttribute = new THREE.Float32BufferAttribute(boxGeometry.attributes.position.array, valuesPerVertex)
    boxMeshRef.current.geometry.setAttribute("position", posAttribute)

    // indices
    let valuesPerIndex = 1
    let indicesAttribute = new THREE.Uint32BufferAttribute(boxGeometry.index.array, valuesPerIndex)
    boxMeshRef.current.geometry.setIndex(indicesAttribute)

    boxMeshRef.current.position.x = spherePoint.x
    boxMeshRef.current.position.y = spherePoint.y
    boxMeshRef.current.position.z = spherePoint.z
    boxMeshRef.current.geometry.scale(scale, scale, scale)
    boxMeshRef.current.lookAt(lookAt)

    // Box geometry origin is the center of the mass. Shift it out of the globe surface so that 
    // one end is barely touching.
    boxMeshRef.current.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -(0.5 * length * scale)))

    // boxMeshRef.current.material.color = new THREE.Color(0x00f0f0)

    boxMeshRef.current.geometry.attributes.position.needsUpdate = true
  }

  // Create pin mesh when mesh reference is available.
  useEffect(() => {
    // console.log({ "PinMesh.useEffect[meshRef.current]": meshRef.current })
    if (!meshRef.current) {
      return
    }

    makePin()
    originalPosRef.current = meshRef.current.position.clone()
  }, [meshRef.current])

  // Create box mesh when mesh reference is available.
  useEffect(() => {
    // console.log({ "PinMesh.useEffect[boxMeshRef.current]": meshRef.current })
    if (!boxMeshRef.current) {
      return
    }

    makeBoundingBox()

    // Assign metadata so that cursor interactions can figure out what event corresponds to this.
    boxMeshRef.current.userData.eventId = eventId
    boxMeshRef.current.userData.locationId = spherePoint.id
  }, [meshRef.current, boxMeshRef.current])


  // Update click-and-drag
  useEffect(() => {
    // Don't move the pin unless we're in edit mode.
    if (!editState.editModeOn || !editState.clickAndDrag) {
      return
    }

    let moveThisPin = (editState.clickAndDrag?.mesh.uuid == boxMeshRef.current.uuid)
    let moveAllPins = (editState.clickAndDrag?.mesh.name == meshNames.Region)
    if (!moveThisPin && !moveAllPins) {
      // No change
      // console.log("not me")
      return
    }

    // Calculate
    let qValues = editState.clickAndDrag.rotorQuaternion
    let qRotor = new THREE.Quaternion(qValues.x, qValues.y, qValues.z, qValues.w)
    let newPos = originalPosRef.current.clone().applyQuaternion(qRotor)

    // Move pin
    meshRef.current.position.x = newPos.x
    meshRef.current.position.y = newPos.y
    meshRef.current.position.z = newPos.z
    meshRef.current.lookAt(globeInfo.pos)
    meshRef.current.geometry.attributes.position.needsUpdate = true

    // Move bounding box
    boxMeshRef.current.position.x = newPos.x
    boxMeshRef.current.position.y = newPos.y
    boxMeshRef.current.position.z = newPos.z
    boxMeshRef.current.lookAt(globeInfo.pos)
    boxMeshRef.current.geometry.attributes.position.needsUpdate = true

    // Update state
    let loc = createSpherePointFromXYZ(newPos.x, newPos.y, newPos.z, globeInfo.radius)
    loc.id = spherePoint.id

    if (pinType == meshNames.PrimaryPin) {
      reduxDispatch(editStateActions.setPrimaryLoc(loc))
    }
    else if (pinType == meshNames.RegionBoundaryPin) {
      // Re-create region mesh whenever a boundary pin moves
      // Note: Yes, even when all pins move at once. See designNotes.txt for explanation.
      reduxDispatch(editStateActions.updateRegionBoundaryPin(loc))
    }
    else {
      throw new Error(`Unrecognized pin type '${pinType}'`)
    }
  }, [editState.clickAndDrag?.rotorQuaternion])

  // Update following click-and-drag
  useEffect(() => {
    if (!mouseState.leftMouseUp) {
      return
    }

    if (!originalPosRef.current.equals(meshRef.current.position)) {
      // Record updated position
      // Note: The mesh position has already been updated in real time. We just need to update 
      // this position reference for the next click-and-drag.
      originalPosRef.current = meshRef.current.position.clone()
    }

  }, [mouseState.leftMouseUp])

  // Hover: Update color (unless it is selected).
  useEffect(() => {
    let cursorHovering = mouseState.hoverLocId == spherePoint.id
    let isSelected = mouseState.hoverLocId == mouseState.selectedLocId
    if (cursorHovering && !isSelected) {
      // console.log({"highlight hover": mouseState.hoverLocId})
      boxMeshRef.current.material.color = new THREE.Color(colors.highlight)
      boxMeshRef.current.material.opacity = 0.5
    }

    let prevCursorHovering = mouseState.prevHoverLocId == spherePoint.id
    let isStillSelected = mouseState.prevHoverLocId == mouseState.selectedLocId
    if (prevCursorHovering && !isStillSelected) {
      // console.log({"depose hover": mouseState.hoverLocId})
      boxMeshRef.current.material.color = new THREE.Color(colors.normal)
      boxMeshRef.current.material.opacity = 0.2
    }
  }, [mouseState.hoverLocId])

  // Selected: Update color (but differently than hover).
  useEffect(() => {
    if (mouseState.selectedLocId == spherePoint.id) {
      boxMeshRef.current.material.color = new THREE.Color(colors.highlight)
      boxMeshRef.current.material.opacity = 0.7
    }

    if (mouseState.prevSelectedLocId == spherePoint.id) {
      boxMeshRef.current.material.color = new THREE.Color(colors.normal)
      boxMeshRef.current.material.opacity = 0.2
    }

  }, [mouseState.selectedLocId])

  return (
    <>
      <mesh ref={meshRef} name={pinType}>
        <meshBasicMaterial side={THREE.DoubleSide} opacity={0.8} transparent={false} wireframe={false} />
      </mesh>
      <mesh ref={boxMeshRef} name={meshNames.PinBoundingBox}>
        <meshBasicMaterial opacity={0.2} transparent={true} />
      </mesh>
    </>
  )
}

