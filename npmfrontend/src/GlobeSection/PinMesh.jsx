import { useEffect, useMemo, useRef } from "react"
import { meshNames, globeInfo } from "./constValues"
import * as THREE from "three"
import { ConvertLatLongToXYZ } from "./convertLatLongXYZ"
import { useDispatch } from "react-redux"
import { intersectableMeshesStateActions } from "../AppState/stateSliceIntersectableMeshes"

export function PinMesh({ name, id, where, scale = 0.1, lookAt = new THREE.Vector3(0, 0, 1) }) {
  // Geometry is identical for all PoiPins, so only need to make it once.
  // const memo = useMemo(() => {
  //   // debug && console.log("PoiPin(): useMemo")

  //   // Make a triangle column with a point.
  //   let vertices = []
  //   let indices = []

  //   // From "Region"
  //   let myGeometry = new THREE.BoxGeometry(3, 3, 3, 3)
  //   console.log(myGeometry)
  //   vertices.push(...myGeometry.attributes.position.array)
  //   indices.push(...myGeometry.index.array)

  //   const geometry = new THREE.BufferGeometry()
  //   let valuesPerVertex = 3
  //   let posAttribute = new THREE.Float32BufferAttribute(vertices, valuesPerVertex)
  //   geometry.setAttribute("position", posAttribute)

  //   let valuesPerIndex = 1
  //   let indicesAttribute = new THREE.Uint32BufferAttribute(indices, valuesPerIndex)
  //   geometry.setIndex(indicesAttribute)

  //   geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -(constrainedHeight * 0.5)))

  //   return {
  //     height: constrainedHeight,
  //     geometry: geometry
  //   }
  // }, [])

  if (id == null) {
    throw new Error("'id' cannot be null")
  }
  if (where.id == null) {
    throw new Error("'where.id' cannot be null")
  }

  const meshRef = useRef()
  const materialRef = useRef()
  const reduxDispatch = useDispatch()
  useEffect(() => {
    // console.log({ msg: "PinMesh()/useEffect()/meshRef" })
    meshRef.current.userData.poiId = id
    meshRef.current.userData.whereId = where.id

    // Make an equilateral triangle pyramid with the point facing center of the globe.
    let sqrt3Over2 = Math.sqrt(3.0) / 2.0
    let oneHalf = 0.5
    let pinLength = 3

    // Note: ThreeJs's "lookat(...)" function orients the object's local Z axis at the specified
    // world space point.
    let baseVertex1 = new THREE.Vector3(0, 1, 0)
    // let baseVertex2 = new THREE.Vector3(-sqrt2Over2, 0, -sqrt2Over2)
    // let baseVertex3 = new THREE.Vector3(+sqrt2Over2, 0, -sqrt2Over2)
    let baseVertex2 = new THREE.Vector3(-sqrt3Over2, -oneHalf, 0)
    let baseVertex3 = new THREE.Vector3(+sqrt3Over2, -oneHalf, 0)
    let topVertex = new THREE.Vector3(0, 0, pinLength)
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
    meshRef.current.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -(pinLength * scale)))


    // // From "Region"
    // let myGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
    // console.log(myGeometry)
    // vertices.push(...myGeometry.attributes.position.array)
    // indices.push(...myGeometry.index.array)
    // meshRef.current.geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)


    // reduxDispatch(
    //   intersectableMeshesStateActions.add(meshRef.current)
    // )
    // console.log({ msg: "PinMesh", value: meshRef.current })

    console.log("PinMesh finished")
  }, [meshRef.current, materialRef.current])

  function onMeshClick(e) {
    console.log({ msg: "PinMesh()/onMeshClick", value: e })
  }

  // return (
  //   // <mesh name={meshNames.LatLongPin} ref={meshRef} onClick={(e) => onMeshClick(e)}>
  //   //   <meshBasicMaterial color={0xff0000} ref={materialRef} transparent={true} />
  //   // </mesh>

  //   <mesh ref={meshRef} name={name}>
  //     <meshBasicMaterial color={0xff0000} side={THREE.DoubleSide} opacity={0.8} transparent={false} wireframe={false} />
  //   </mesh>
  // )
  return (
    <mesh ref={meshRef} name={name} onClick={onMeshClick}>
      <meshBasicMaterial color={0xff0000} side={THREE.DoubleSide} opacity={0.8} transparent={false} wireframe={false} />
    </mesh>
  )
}
