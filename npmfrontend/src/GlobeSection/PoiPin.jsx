import gsap from "gsap"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { meshNames } from "./constValues"
import { ConvertLatLongToXYZ } from "./convertLatLongXYZ"

export function PoiPin({ globePos, globeRadius, poiInfoJson }) {
  // debug && console.log("PoiPin(): begin")

  // Geometry is identical for all PoiPins, so only need to make it once.
  const memo = useMemo(() => {
    // debug && console.log("PoiPin(): useMemo")

    const height = 0.8
    const width = 0.1
    const depth = 0.1

    const constrainedHeight = Math.min(Math.max(height, 0.05), 3)
    const constrainedWidth = Math.min(Math.max(width, 0.05), 0.3)
    const constrainedDepth = Math.min(Math.max(depth, 0.05), 0.3)

    const geometry = new THREE.BoxGeometry(constrainedWidth, constrainedDepth, constrainedHeight)
    geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -(constrainedHeight * 0.5)))

    return {
      height: constrainedHeight,
      geometry: geometry
    }
  }, [])

  // Move the mesh into position once the mesh reference is available.
  // Note: Only do this once. The gsap transformations are cumulative.
  const meshRef = useRef()
  const materialRef = useRef()
  useEffect(() => {
    // console.log("PoiPin -> meshRef useEffect()")

    meshRef.current.userData.poiInfoJson = poiInfoJson  // all info about the object
    meshRef.current.userData.originalColor = new THREE.Color(0x3bf7ff)
    meshRef.current.userData.highlightColor = new THREE.Color(0xff0000)
    meshRef.current.userData.originalOpacity = 0.4
    meshRef.current.userData.highlightOpacity = 1

    // Move the POI box to the location on the globe indicated by lat/long.
    let lat = poiInfoJson.latlng[0]
    let long = poiInfoJson.latlng[1]
    const [x, y, z] = ConvertLatLongToXYZ(lat, long, globeRadius)
    meshRef.current.position.x = x
    meshRef.current.position.y = y
    meshRef.current.position.z = z

    // Rotate the box to look at the globe so that the box stands on end relative to the surface.
    meshRef.current.lookAt(globePos)

    // Default
    materialRef.current.color = meshRef.current.userData.originalColor
    materialRef.current.opacity = meshRef.current.userData.originalOpacity

    // Animate the height
    // Source:
    //  https://greensock.com/docs/v3/GSAP/gsap.fromTo()
    // Note: _Any_ state change that causes re-rendering will cause this "useEffect" to run 
    // again, and if it is the same geometry as the last render, then the scaling will be stacked 
    // and the prior animation, though discarded, will still have left it's mark on the mesh's 
    // scale. Circumvent this by specifying both "from" and "to".
    // Also Note: It takes a few frames to clean up the old animation objects, during which time 
    // there will be a couple frames with flicker betweent he old and the new value, but after 
    // that it will be smooth again.
    gsap.fromTo(meshRef.current.scale,
      {
        z: 1
      },
      {
        z: 0,
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: "linear",
        delay: Math.random(1)
      })
  }, [meshRef.current, materialRef.current])

  return (
    <mesh name={meshNames.PoiPin} ref={meshRef} geometry={memo.geometry}>
      <meshBasicMaterial ref={materialRef} transparent={true} />
    </mesh>
  )
}