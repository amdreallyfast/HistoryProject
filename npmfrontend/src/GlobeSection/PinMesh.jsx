import { useEffect, useRef } from "react"
import { globeInfo } from "./constValues"
import * as THREE from "three"
import { useSelector } from "react-redux"

export function PinMesh({ name, poiId, where, colorHex, length = 3, scale = 0.1, lookAt = new THREE.Vector3(0, 0, 1) }) {
  if (poiId == null) {
    throw new Error("'id' cannot be null")
  }
  if (where.id == null) {
    throw new Error("'where.id' cannot be null")
  }

  const editState = useSelector((state) => state.editPoiReducer)

  const meshRef = useRef()
  const materialRef = useRef()
  useEffect(() => {
    // console.log({ msg: "PinMesh()/useEffect()/meshRef" })
    meshRef.current.userData.poiId = poiId
    meshRef.current.userData.whereId = where.id

    // Make an equilateral triangle pyramid with the point facing center of the globe.
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
    meshRef.current.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -(length * scale)))

    // color
    meshRef.current.material.color = new THREE.Color(colorHex)

    // console.log("PinMesh finished")
  }, [meshRef.current, materialRef.current])

  useEffect(() => {
    if (editState.editModeOn) {
      if (editState.selectedPinId == meshRef.current.userData.whereId) {
        let { x, y, z } = editState.tentativeWhere
        meshRef.current.position.x = x
        meshRef.current.position.y = y
        meshRef.current.position.z = z
        meshRef.current.lookAt(globeInfo.pos)
        meshRef.current.geometry.attributes.position.needsUpdate = true
      }
    }
  }, [editState.tentativeWhere])

  return (
    <mesh ref={meshRef} name={name}>
      <meshBasicMaterial side={THREE.DoubleSide} opacity={0.8} transparent={false} wireframe={false} />
    </mesh>
  )
}
