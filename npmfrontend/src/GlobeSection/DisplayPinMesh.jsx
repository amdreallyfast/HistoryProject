import { useEffect, useRef } from "react"
import * as THREE from "three"

export function DisplayPinMesh({ spherePoint, globeInfo, colorHex, length = 3, scale = 0.1, lookAt = new THREE.Vector3(0, 0, 0) }) {
  const meshRef = useRef()

  function makePin() {
    const sqrt3Over2 = Math.sqrt(3.0) / 2.0
    const oneHalf = 0.5

    // Make an equilateral triangle pyramid with the point facing the center of the globe.
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
    meshRef.current.position.x = spherePoint.x
    meshRef.current.position.y = spherePoint.y
    meshRef.current.position.z = spherePoint.z
    meshRef.current.lookAt(lookAt)

    // Shift so the end of the pin barely touches the globe surface.
    meshRef.current.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -(length * scale)))

    // color
    meshRef.current.material.color = new THREE.Color(colorHex)

    meshRef.current.geometry.attributes.position.needsUpdate = true
  }

  // Create pin geometry when mesh reference is available.
  useEffect(() => {
    if (!meshRef.current) {
      return
    }

    makePin()
  }, [meshRef.current])

  // Update position when spherePoint changes (e.g., after edit submit).
  useEffect(() => {
    if (!meshRef.current) {
      return
    }

    meshRef.current.position.x = spherePoint.x
    meshRef.current.position.y = spherePoint.y
    meshRef.current.position.z = spherePoint.z
    meshRef.current.lookAt(lookAt)
  }, [spherePoint])

  // Update color when colorHex changes (for highlighting).
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.material.color = new THREE.Color(colorHex)
    }
  }, [colorHex])

  return (
    <mesh ref={meshRef}>
      <meshBasicMaterial side={THREE.DoubleSide} opacity={0.8} transparent={false} wireframe={false} />
    </mesh>
  )
}
