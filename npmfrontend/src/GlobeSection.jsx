import { useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from "three"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Globe } from "./Globe"
import { PointsOfInterest } from "./PointsOfInterest"
import { Stars } from "./Stars"

const globeInfo = {
  pos: new THREE.Vector3(0, 0, 0),
  radius: 5
}

export function GlobeSection({ displayItemsJson, itemSelectedCallback, currSelectedUniqueId }) {
  const mousePosCanvasNormalizedRef = useRef({
    x: 0,
    y: 0
  })
  const poiInfoPopupElementRef = useRef()
  const poiInfoTitleElementRef = useRef()

  // TODO: ??use canvas size instead of window size when calculating normalized mouse coordinates??
  const canvasRef = useRef()

  function onMouseMoveCanvas(e) {
    // Normalize mouse coordinates to [-1,+1] on x and y.
    // Note: This event from React Three Fiber appears to have reversed ThreeJs' default coordinate 
    // system's "y" axis. OpenGL, and consequently ThreeJs, have canvas y=0 at the bottom, but 
    // this event puts y=0 at the top. When the ThreeJs raycaster performs its calculations, it is 
    // expecting the input coordinates to be on the range x,y=[-1,+1], and specifically y=-1 to be 
    // the bottom, just like with OpenGL. So we need to negate the y sign.
    mousePosCanvasNormalizedRef.current = {
      x: ((e.clientX / window.innerWidth) * 2) - 1,
      y: -((e.clientY / window.innerHeight) * 2) + 1
    }

    if (poiInfoPopupElementRef) {
      poiInfoPopupElementRef.current.style.left = `${e.clientX}px`
      poiInfoPopupElementRef.current.style.top = `${e.clientY}px`
    }
  }

  return (
    <>
      <div ref={poiInfoPopupElementRef} className="fixed bg-gray-600 bg-opacity-75 px-4 py-2 w-1/6 rounded-lg">
        <h2 ref={poiInfoTitleElementRef} className="text-white text-xs">
          Title placeholder
        </h2>
      </div>

      <div className='flex flex-col h-full'>
        <div className="w-full h-full bg-blue-950 border-4 border-red-500">
          <Canvas ref={canvasRef} onMouseMove={(e) => onMouseMoveCanvas(e)}>
            <PerspectiveCamera makeDefault position={new THREE.Vector3(0, 0, 25)} fov={50} far={3000} />
            <OrbitControls />
            <spotLight position={(10, 15, 10)} angle={0.3} intensity={0.2} />

            <Globe globeRadius={globeInfo.radius} />
            <PointsOfInterest displayItemsJson={displayItemsJson} globePos={globeInfo.pos} globeRadius={globeInfo.radius} />
            <Stars />
          </Canvas>
        </div>
      </div>
    </>
  )
}