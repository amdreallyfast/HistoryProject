import { useFrame } from "@react-three/fiber"
import gsap from "gsap"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

// TODO: rename -> "POIBox"
export function PointOfInterest({ globePos, globeRadius, poiInfoJson }) {
  // debug && console.log("SinglePoint(): begin")

  const pointMemo = useMemo(() => {
    // debug && console.log("SinglePoint(): useMemo")

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
    console.log("POI UseEffect")

    meshRef.current.userData.poiInfoJson = poiInfoJson  // all info about the object
    meshRef.current.userData.originalColor = new THREE.Color(0x3bf7ff)
    meshRef.current.userData.highlightColor = new THREE.Color(0xff0000)
    meshRef.current.userData.originalOpacity = 0.4
    meshRef.current.userData.highlightOpacity = 1

    // Move the POI box to the location on the globe indicated by lat/long.
    let latRad = (poiInfoJson.latlng[0] / 180.0) * Math.PI
    let longRad = (poiInfoJson.latlng[1] / 180.0) * Math.PI

    let sphericalPos = new THREE.Vector3()
    let projectionOfRadiusOntoXZPlane = globeRadius * Math.cos(latRad)
    sphericalPos.x = Math.sin(longRad) * projectionOfRadiusOntoXZPlane
    sphericalPos.y = Math.sin(latRad) * globeRadius
    sphericalPos.z = Math.cos(longRad) * projectionOfRadiusOntoXZPlane

    meshRef.current.position.x = sphericalPos.x
    meshRef.current.position.y = sphericalPos.y
    meshRef.current.position.z = sphericalPos.z

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
  })

  return (
    <mesh name={"PoiMesh"} ref={meshRef} geometry={pointMemo.geometry}>
      <meshBasicMaterial ref={materialRef} transparent={true} />
    </mesh>
  )
}