import { useEffect, useMemo, useRef } from "react"
import { meshNames, globeInfo } from "./constValues"
import * as THREE from "three"
import { ConvertLatLongToXYZ } from "./convertLatLongXYZ"

export function LatLongPin({ latLong }) {
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

  const meshRef = useRef()
  const materialRef = useRef()
  useEffect(() => {
    // console.log("LatLongPin -> useEffect [meshRef]")

    // Make a triangle column with a point.
    let vertices = []
    let indices = []

    let sqrt3Over2 = Math.sqrt(3.0) / 2.0
    let oneHalf = 0.5
    let pinLength = 3
    let scaleFactor = 0.1

    // Note: ThreeJs's "lookat(...)" function orients the object's local Z axis at the specified
    // world space point.
    let baseVertex1 = new THREE.Vector3(0, 1, 0)
    // let baseVertex2 = new THREE.Vector3(-sqrt2Over2, 0, -sqrt2Over2)
    // let baseVertex3 = new THREE.Vector3(+sqrt2Over2, 0, -sqrt2Over2)
    let baseVertex2 = new THREE.Vector3(-sqrt3Over2, -oneHalf, 0)
    let baseVertex3 = new THREE.Vector3(+sqrt3Over2, -oneHalf, 0)
    let topVertex = new THREE.Vector3(0, 0, pinLength)
    vertices.push(...baseVertex1, ...baseVertex2, ...baseVertex3, ...topVertex)
    indices.push(0, 1, 2) // base
    indices.push(0, 3, 1) // face 1
    indices.push(1, 3, 2) // face 2
    indices.push(2, 3, 0) // face 3

    let valuesPerVertex = 3
    let posAttribute = new THREE.Float32BufferAttribute(vertices, valuesPerVertex)
    meshRef.current.geometry.setAttribute("position", posAttribute)

    let valuesPerIndex = 1
    let indicesAttribute = new THREE.Uint32BufferAttribute(indices, valuesPerIndex)
    meshRef.current.geometry.setIndex(indicesAttribute)

    meshRef.current.geometry.scale(scaleFactor, scaleFactor, scaleFactor)

    const [x, y, z] = ConvertLatLongToXYZ(latLong.lat, latLong.long, globeInfo.radius)
    meshRef.current.position.x = x
    meshRef.current.position.y = y
    meshRef.current.position.z = z

    meshRef.current.lookAt(globeInfo.pos)
    meshRef.current.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -(pinLength * scaleFactor)))


    // // From "Region"
    // let myGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
    // console.log(myGeometry)
    // vertices.push(...myGeometry.attributes.position.array)
    // indices.push(...myGeometry.index.array)
    // meshRef.current.geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)



  }, [meshRef.current, materialRef.current])

  function onMeshClick(e) {
    console.log({ onMeshClick: e })
  }

  return (
    // <mesh name={meshNames.LatLongPin} ref={meshRef} onClick={(e) => onMeshClick(e)}>
    //   <meshBasicMaterial color={0xff0000} ref={materialRef} transparent={true} />
    // </mesh>

    <mesh ref={meshRef}>
      <meshBasicMaterial color={0xff0000} side={THREE.DoubleSide} opacity={0.8} transparent={true} wireframe={true} />
    </mesh>
  )
}