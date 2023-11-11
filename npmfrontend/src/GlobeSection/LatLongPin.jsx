import { useEffect, useMemo, useRef } from "react"
import { meshNames } from "./constValues"

export function LatLongPin({ globePos, globeRadius, latLongJson }) {
  // Geometry is identical for all PoiPins, so only need to make it once.
  const memo = useMemo(() => {
    // debug && console.log("PoiPin(): useMemo")

    // Make a triangle column with a point.
    let pointsVertices = []

    // From "Region"
    const geometry = new THREE.BufferGeometry()
    let valuesPerVertex = 3
    let positionAttribute = new THREE.Float32BufferAttribute(pointsVertices, valuesPerVertex)
    geometry.setAttribute("position", positionAttribute)
    geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -(constrainedHeight * 0.5)))

    return {
      height: constrainedHeight,
      geometry: geometry
    }
  }, [])

  const meshRef = useRef()
  const materialRef = useRef()
  useEffect(() => {
    console.log("LatLongPin -> meshRef useEffect()")
  }, [meshRef.current, materialRef.current])

  function onMeshClick(e) {
    console.log({ onMeshClick: e })
  }

  return (
    <mesh name={meshNames.LatLongPin} ref={meshRef} geometry={memo.geometry} onClick={(e) => onMeshClick(e)}>
      <meshBasicMaterial ref={materialRef} transparent={true} />
    </mesh>
  )
}
