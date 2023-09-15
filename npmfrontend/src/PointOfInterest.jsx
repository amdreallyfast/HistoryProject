import gsap from "gsap"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

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
  //??necessary since I'm using the "fromTo" approach??
  const useEffectRanRef = useRef(false)
  const pointRef = useRef()
  useEffect(() => {
    if (useEffectRanRef.current === false) {
      // POI info for user
      pointRef.current.userData.allInfo = poiInfoJson

      let latRad = (poiInfoJson.latlng[0] / 180.0) * Math.PI
      let longRad = (poiInfoJson.latlng[1] / 180.0) * Math.PI

      let sphericalPos = new THREE.Vector3()
      sphericalPos.x = globeRadius * Math.cos(latRad) * Math.sin(longRad)
      sphericalPos.y = globeRadius * Math.sin(latRad)
      sphericalPos.z = globeRadius * Math.cos(latRad) * Math.cos(longRad)

      pointRef.current.position.x = sphericalPos.x
      pointRef.current.position.y = sphericalPos.y
      pointRef.current.position.z = sphericalPos.z

      // Point into the globe so that the box stands on end relative to the surface.
      pointRef.current.lookAt(globePos)

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
      gsap.fromTo(pointRef.current.scale,
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

      useEffectRanRef.current = true
    }
  }, [])

  return (
    <mesh name={poiInfoJson.name.common} ref={pointRef} geometry={pointMemo.geometry}>
      <meshBasicMaterial color={0x3bf7ff} transparent={true} opacity={0.4} />
    </mesh>
  )
}