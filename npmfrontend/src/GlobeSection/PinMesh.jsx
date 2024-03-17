import { useEffect, useRef } from "react"
import * as THREE from "three"
import { useDispatch, useSelector } from "react-redux"
import { createWhereObjFromXYZ } from "./createWhere"
import { meshNames } from "./constValues"
import { editStateActions } from "../AppState/stateSliceEditPoi"
import _ from "lodash"

export function PinMesh({ name, poiId, where, globeInfo, colorHex, length = 3, scale = 0.1, lookAt = new THREE.Vector3(0, 0, 1) }) {
  if (poiId == null) {
    throw new Error("'id' cannot be null")
  }
  if (where.id == null) {
    throw new Error("'where.id' cannot be null")
  }

  const editState = useSelector((state) => state.editPoiReducer)
  const mouseState = useSelector((state) => state.mouseInfoReducer)
  const reduxDispatch = useDispatch()

  // For use during click-and-drag. Update once click-and-drag ends.
  const preMovePos = useRef()

  const meshRef = useRef()
  const boxMeshRef = useRef()

  function makePin() {
    // Make an equilateral triangle pyramid with the point facing center of the globe.
    // Note: Values from the unit circle, 120deg apart.
    let sqrt3Over2 = Math.sqrt(3.0) / 2.0
    let oneHalf = 0.5

    // Note: ThreeJs's "lookat(...)" function orients the object's local Z axis at the specified
    // world space point.
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
    meshRef.current.position.x = where.x
    meshRef.current.position.y = where.y
    meshRef.current.position.z = where.z
    meshRef.current.lookAt(lookAt)

    // Mesh origin was the top of the pin. Shift the whole thing so that the end of the pin (
    // after rotating via lookat(...)) is barely touching the surface of the globe.
    meshRef.current.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -(length * scale)))

    // color
    meshRef.current.material.color = new THREE.Color(colorHex)

    meshRef.current.geometry.attributes.position.needsUpdate = true
  }

  function makeBoundingBox() {
    let sqrt3Over2 = Math.sqrt(3.0) / 2.0
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

    boxMeshRef.current.position.x = where.x
    boxMeshRef.current.position.y = where.y
    boxMeshRef.current.position.z = where.z
    boxMeshRef.current.geometry.scale(scale, scale, scale)
    boxMeshRef.current.lookAt(lookAt)

    // Box geometry origin is the center of the mass. Shift it out of the globe surface so that 
    // one end is barely touching.
    boxMeshRef.current.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -(0.5 * length * scale)))

    boxMeshRef.current.geometry.attributes.position.needsUpdate = true
  }

  // Create meshes
  useEffect(() => {
    // console.log({ msg: "PinMesh()/useEffect()/meshRef" })
    if (!meshRef.current || !boxMeshRef.current) {
      return
    }

    makePin()
    makeBoundingBox()

    preMovePos.current = meshRef.current.position.clone()

    boxMeshRef.current.userData.poiId = poiId
    boxMeshRef.current.userData.whereId = where.id
  }, [meshRef.current, boxMeshRef.current])


  // Update click-and-drag
  useEffect(() => {
    // Don't move the pin (ex: PrimaryPOI pin) unless we're in edit mode.
    if (!editState.editModeOn) {
      return
    }

    let moveThisPinOnly = (editState.clickAndDrag?.mesh.uuid == boxMeshRef.current.uuid)
    let moveAllPins = (editState.clickAndDrag?.mesh.name == meshNames.Region)
    let newPos = preMovePos.current
    if (moveThisPinOnly) {
      let qMouseJson = editState.clickAndDrag.rotorQuaternion
      let qMouse = new THREE.Quaternion(qMouseJson.x, qMouseJson.y, qMouseJson.z, qMouseJson.w)

      let qOffsetJson = editState.clickAndDrag.initialOffsetQuaternion
      let qOffset = new THREE.Quaternion(qOffsetJson.x, qOffsetJson.y, qOffsetJson.z, qOffsetJson.w)

      let rotor = (new THREE.Quaternion()).multiplyQuaternions(qMouse, qOffset)

      newPos = preMovePos.current.clone().applyQuaternion(rotor)
    }
    else if (moveAllPins) {
      let qMouseJson = editState.clickAndDrag.rotorQuaternion
      let qMouse = new THREE.Quaternion(qMouseJson.x, qMouseJson.y, qMouseJson.z, qMouseJson.w)

      newPos = preMovePos.current.clone().applyQuaternion(qMouse)
    }
    else {
      // No change
      return
    }

    // Move Pin
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




    if (name == meshNames.RegionBoundaryPin) {


      // 3/16/2024, 23:26
      //  Pin move -> update region boundary -> redraw region mesh geometry -> ??why is the intersection lost??
      //  I can click-and-drag the region mesh even with the mesh rotation turned off, but if I deactivate this update, then it doesn't move



      let updatedWhere = createWhereObjFromXYZ(newPos.x, newPos.y, newPos.z, globeInfo)
      updatedWhere.id = where.id
      reduxDispatch(
        editStateActions.updateRegionBoundaryPin(updatedWhere)
      )
    }

  }, [editState.clickAndDrag?.rotorQuaternion])

  // Update following click-and-drag
  useEffect(() => {
    if (!mouseState.mouseUp) {
      return
    }

    if (!preMovePos.current.equals(meshRef.current.position)) {
      // Record updated position
      // Note: The mesh position was already been updated in real time. We just need to update 
      // this position reference for the next click-and-drag.
      preMovePos.current = meshRef.current.position.clone()
    }

  }, [mouseState.mouseUp])

  return (
    <>
      <mesh ref={meshRef} name={name}>
        <meshBasicMaterial side={THREE.DoubleSide} opacity={0.8} transparent={false} wireframe={false} />
      </mesh>
      <mesh ref={boxMeshRef} name={meshNames.PinBoundingBox}>
        <meshBasicMaterial opacity={0.2} transparent={true} />
      </mesh>
    </>
  )
}
