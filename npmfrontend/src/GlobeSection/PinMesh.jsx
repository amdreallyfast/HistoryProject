import { useEffect, useRef } from "react"
// import { globeInfo } from "./constValues"
import * as THREE from "three"
import { useDispatch, useSelector } from "react-redux"
import { Box } from "@react-three/drei"
import { createWhereObjFromXYZ } from "./createWhere"
import { meshNames } from "./constValues"
import { editStateActions } from "../AppState/stateSliceEditPoi"
// import { editStateActions } from "../AppState/stateSliceEditPoi"
// import { uniqueId, update } from "lodash"


export function PinMesh({ name, poiId, where, globeInfo, colorHex, length = 3, scale = 0.1, lookAt = new THREE.Vector3(0, 0, 1) }) {
  if (poiId == null) {
    throw new Error("'id' cannot be null")
  }
  if (where.id == null) {
    throw new Error("'where.id' cannot be null")
  }

  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()

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
    // let boxGeometry = new THREE.BoxGeometry(1, 1, 1)

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

  useEffect(() => {
    console.log({ msg: "PinMesh()/useEffect()/meshRef" })
    if (!meshRef.current || !boxMeshRef.current) {
      return
    }

    makePin()
    makeBoundingBox()

    boxMeshRef.current.userData.poiId = poiId
    boxMeshRef.current.userData.whereId = where.id


    // boxMeshRef.current.position.x = where.x
    // boxMeshRef.current.position.y = where.y
    // boxMeshRef.current.position.z = where.z
    // boxMeshRef.current.lookAt(lookAt)
    // boxMeshRef.current.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -(length * scale)))

    // console.log("PinMesh finished")
  }, [meshRef.current, boxMeshRef])



  // TODO: move boxMeshRef initialization into its own UseEffect
  // TODO: set userData for both pin and box meshes




  useEffect(() => {
    // if (editState.editModeOn) {
    //   if (editState.clickAndDrag?.meshUuid == meshRef.current.uuid) {
    //     // console.log({ msg: "pin", meshName: meshRef.current.name })

    //     // // Move to position specified by the quaternion rotor. 
    //     // // Note: Apply the rotor to the pre-click-and-drag location, which was recorded when 
    //     // // click-and-drag was enabled.
    //     // let originJson = editState.clickAndDrag.meshPos
    //     // let origin = new THREE.Vector3(originJson.x, originJson.y, originJson.z)

    //     // let qJson = editState.clickAndDrag.quaternionRotor
    //     // let q = new THREE.Quaternion(qJson.x, qJson.y, qJson.z, qJson.w)

    //     // let newPos = origin.clone().applyQuaternion(q)
    //     // // console.log({ from: origin.x, to: newPos.x })
    //     // meshRef.current.position.x = newPos.x
    //     // meshRef.current.position.y = newPos.y
    //     // meshRef.current.position.z = newPos.z
    //     // meshRef.current.lookAt(globeInfo.pos)
    //     // meshRef.current.geometry.attributes.position.needsUpdate = true
    //   }
    //   else {
    //     let moveThisPinOnly = (editState.clickAndDrag?.mesh.uuid == boxMeshRef.current.uuid)
    //     // let moveAllBoundaryPins = (editState.clickAndDrag?.mesh.name == meshNames.Region)
    //     let moveAllBoundaryPins = false
    //     // console.log(`thisPin: '${editState.clickAndDrag?.mesh.uuid}', box: '${boxMeshRef.current.uuid}'`)
    //     if (moveThisPinOnly || (moveAllBoundaryPins && name == meshNames.RegionBoundaryPin)) {
    //       // console.log("hello?")
    //       // // Move to position specified by the quaternion rotor. 
    //       // // Note: Apply the rotor to the pre-click-and-drag location, which was recorded when 
    //       // // click-and-drag was enabled.
    //       // let originJson = editState.clickAndDrag.mesh.originPos
    //       // let origin = new THREE.Vector3(originJson.x, originJson.y, originJson.z)

    //       // let qJson = editState.clickAndDrag.rotorQuaternion
    //       // let q = new THREE.Quaternion(qJson.x, qJson.y, qJson.z, qJson.w)

    //       // let qOffsetJson = editState.clickAndDrag.initialOffsetQuaternion
    //       // let qOffset = new THREE.Quaternion(qOffsetJson.x, qOffsetJson.y, qOffsetJson.z, qOffsetJson.w)

    //       // let rotor = (new THREE.Quaternion()).multiplyQuaternions(q, qOffset)

    //       // let newPos = origin.clone().applyQuaternion(rotor)
    //       // // console.log({ from: origin.x, to: newPos.x })

    //       // // Move Pin
    //       // meshRef.current.position.x = newPos.x
    //       // meshRef.current.position.y = newPos.y
    //       // meshRef.current.position.z = newPos.z
    //       // meshRef.current.lookAt(globeInfo.pos)
    //       // meshRef.current.geometry.attributes.position.needsUpdate = true

    //       // // Move bounding box
    //       // boxMeshRef.current.position.x = newPos.x
    //       // boxMeshRef.current.position.y = newPos.y
    //       // boxMeshRef.current.position.z = newPos.z
    //       // boxMeshRef.current.lookAt(globeInfo.pos)
    //       // boxMeshRef.current.geometry.attributes.position.needsUpdate = true

    //       let qOriginJson = editState.clickAndDrag.mesh.originQuaternion
    //       let qOrigin = new THREE.Quaternion(qOriginJson.x, qOriginJson.y, qOriginJson.z, qOriginJson.w)

    //       let qMouseJson = editState.clickAndDrag.rotorQuaternion
    //       let qMouse = new THREE.Quaternion(qMouseJson.x, qMouseJson.y, qMouseJson.z, qMouseJson.w)

    //       let qFrom = qOrigin
    //       let qTo = (new THREE.Quaternion()).multiplyQuaternions(qOrigin, qMouse)
    //       console.log(`from {x: ${qFrom.x}, y: ${qFrom.y}, z: ${qFrom.z}, w: ${qFrom.w}} to {x: ${qTo.x}, y: ${qTo.y}, z: ${qTo.z}, w: ${qTo.w}}`)

    //       // meshRef.current.quaternion.multiplyQuaternions(qOrigin, qMouse)
    //       // boxMeshRef.current.quaternion.multiplyQuaternions(qOrigin, qMouse)
    //     }
    //     // else {
    //     //   console.log("not you")
    //     // }
    //   }
    //   // else if (editState.clickAndDrag?.mesh.uuid == boxMeshRef.current.uuid) {
    //   //   // console.log({ msg: "box", meshName: meshRef.current.name })

    //   //   // Move to position specified by the quaternion rotor. 
    //   //   // Note: Apply the rotor to the pre-click-and-drag location, which was recorded when 
    //   //   // click-and-drag was enabled.
    //   //   let originJson = editState.clickAndDrag.mesh.originPos
    //   //   let origin = new THREE.Vector3(originJson.x, originJson.y, originJson.z)

    //   //   let qJson = editState.clickAndDrag.rotorQuaternion
    //   //   let q = new THREE.Quaternion(qJson.x, qJson.y, qJson.z, qJson.w)

    //   //   let qOffsetJson = editState.clickAndDrag.initialOffsetQuaternion
    //   //   let qOffset = new THREE.Quaternion(qOffsetJson.x, qOffsetJson.y, qOffsetJson.z, qOffsetJson.w)

    //   //   let rotor = (new THREE.Quaternion()).multiplyQuaternions(q, qOffset)

    //   //   let newPos = origin.clone().applyQuaternion(rotor)
    //   //   // console.log({ from: origin.x, to: newPos.x })

    //   //   // Move Pin
    //   //   meshRef.current.position.x = newPos.x
    //   //   meshRef.current.position.y = newPos.y
    //   //   meshRef.current.position.z = newPos.z
    //   //   meshRef.current.lookAt(globeInfo.pos)
    //   //   meshRef.current.geometry.attributes.position.needsUpdate = true

    //   //   // Move bounding box
    //   //   boxMeshRef.current.position.x = newPos.x
    //   //   boxMeshRef.current.position.y = newPos.y
    //   //   boxMeshRef.current.position.z = newPos.z
    //   //   boxMeshRef.current.lookAt(globeInfo.pos)
    //   //   boxMeshRef.current.geometry.attributes.position.needsUpdate = true

    //   //   // ??why does enabling this make the useEffect condition stop responding??
    //   //   // if (name == meshNames.RegionBoundaryPin) {
    //   //   //   // Update region boundaries
    //   //   //   let updatedBoundaries = editState.regionBoundaries.map((boundaryMarker, index) => {
    //   //   //     if (where.id == boundaryMarker.id) {
    //   //   //       // console.log("found it")
    //   //   //       let updatedWhere = createWhereObjFromXYZ(newPos.x, newPos.y, newPos.z, globeInfo)
    //   //   //       updatedWhere.id = boundaryMarker.id
    //   //   //       return updatedWhere
    //   //   //     }
    //   //   //     else {
    //   //   //       // Not moving this marker. Return as-is.
    //   //   //       return boundaryMarker
    //   //   //     }
    //   //   //   })

    //   //   //   // reduxDispatch(
    //   //   //   //   editStateActions.setRegionBoundaries(updatedBoundaries)
    //   //   //   // )
    //   //   // }
    //   // }
    //   // else if (editState.clickAndDrag?.mesh.name == meshNames.Region && name == meshNames.RegionBoundaryPin) {
    //   //   // console.log(`Moving region boundary pin '${where.id}'`)
    //   // }
    //   // console.log({ msg: "compare", mesh1: editState.clickAndDrag?.mesh.name, mesh2: meshNames.Region, thisMesh: name })

    //   // if (editState.selectedPinId == meshRef.current.userData.whereId) {
    //   //   // if (editState.selectedRegionBoundary?.id == meshRef.current.userData.whereId) {
    //   //   // console.log({ clickAndDragPos: editState.clickAndDragGlobePos, offset: editState.clickAndDragMeshOffset })
    //   //   // console.log({ regionBoundaries: editState.regionBoundaries })
    //   //   // console.log({ msg: "PinMesh()/useEffect()/editState.clickAndDragGlobePos", value: editState.clickAndDragGlobePos })

    //   //   // meshRef.current.position.x = editState.clickAndDragGlobePos.x + editState.clickAndDragMeshOffset.x
    //   //   // meshRef.current.position.y = editState.clickAndDragGlobePos.y + editState.clickAndDragMeshOffset.y
    //   //   // meshRef.current.position.z = editState.clickAndDragGlobePos.z + editState.clickAndDragMeshOffset.z
    //   //   meshRef.current.position.x = editState.clickAndDragGlobePos.x
    //   //   meshRef.current.position.y = editState.clickAndDragGlobePos.y
    //   //   meshRef.current.position.z = editState.clickAndDragGlobePos.z

    //   //   meshRef.current.lookAt(globeInfo.pos)
    //   //   meshRef.current.geometry.attributes.position.needsUpdate = true





    //   //   // reduxDispatch(
    //   //   //   editStateActions.triggerRegionRedraw()  // TODO: delete
    //   //   // )
    //   // }
    // }
  }, [editState.clickAndDrag])

  return (
    <>
      <mesh ref={meshRef} name={name}>
        <meshBasicMaterial side={THREE.DoubleSide} opacity={0.8} transparent={false} wireframe={false} />
      </mesh>
      <mesh ref={boxMeshRef} name={name}>
        <meshBasicMaterial opacity={0.2} transparent={true} />
      </mesh>
    </>
  )
}
