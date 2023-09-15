import { useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from "three"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Globe } from "./Globe"
import { PointsOfInterest } from "./PointsOfInterest"
import { Stars } from "./Stars"
import gsap from "gsap"

const globeInfo = {
  pos: new THREE.Vector3(0, 0, 0),
  radius: 5
}

function MyScene({ displayItemsJson, itemSelectedCallback, currSelectedUniqueId, poiInfoPopupElementRef, poiInfoTitleElementRef, mousePosCanvasNormalized }) {
  const poiAndGlobeMeshesRef = useRef()
  const threeJsStateModelRef = useRef()
  threeJsStateModelRef.current = useThree((state) => state)
  useEffect(() => {
    // Note: Extract the "Globe" mesh as well because the racaster's intersection calculations 
    // will get _all_ meshes in its path. I want to avoid intersections with POIs behind the
    // globe, but in order to do that, I need to have the globe in the calculation.
    const poiGlobeMeshes = []
    threeJsStateModelRef.current.scene.children.forEach(component => {
      if (component.name === "PoiGroup") {
        component.children.forEach(child => {
          poiGlobeMeshes.push(child)
        })
      }
      else if (component.name === "GlobeGroup") {
        component.children.forEach(child => {
          if (child.name === "Globe") {
            poiGlobeMeshes.push(child)
          }
        })
      }
    });

    poiAndGlobeMeshesRef.current = poiGlobeMeshes

    console.log({ "poiAndGlobeMeshesRef": poiAndGlobeMeshesRef.current })
  }, [threeJsStateModelRef.current])

  let lastIntersectedPoiMesh = null
  useFrame((state, delta) => {
    // console.log("useFrame()")

    // Construction of the group of points of interest may take a couple frames. Only run the 
    // "mouse intersects with object" logic once "useThree" returns a fully defined state model.
    if (poiAndGlobeMeshesRef.current == null || poiInfoPopupElementRef.current == null) {
      return
    }

    state.raycaster.setFromCamera(mousePosCanvasNormalized, state.camera)
    // console.log({ "mouse.x": mousePosCanvasNormalized.x, "mouse.y": mousePosCanvasNormalized.y })

    // Only consider intersections that are:
    // 1. Not the globe
    // 2. Not behind the globe
    // Note: Intersections are organized by increasing distance, making item 0 the closest.
    let intersectedPoiMesh = null
    const intersectedObjects = state.raycaster.intersectObjects(poiAndGlobeMeshesRef.current)
    // console.log({ intersectedPoiMesh: intersectedPoiMesh, lastIntersectedPoiMesh: lastIntersectedPoiMesh })
    if (intersectedObjects.length > 0) {
      let firstIntersection = intersectedObjects[0].object
      if (firstIntersection.name != "Globe") {
        intersectedPoiMesh = firstIntersection
      }
    }

    if (intersectedPoiMesh == null && lastIntersectedPoiMesh == null) {
      // No object => Turn off the popup
      gsap.set(poiInfoPopupElementRef.current, {
        display: "none"
      })
    }
    else if (intersectedPoiMesh?.uuid == lastIntersectedPoiMesh?.uuid) {
      // Same object => No change
    }
    else {
      // Change selection => change popup/highlight

      // Source (for fading style ("ease")):
      //  https://greensock.com/docs/v3/Eases
      if (intersectedPoiMesh != null) {
        // Turn on the popup.
        gsap.set(poiInfoPopupElementRef.current, { display: "block" })
        gsap.set(poiInfoTitleElementRef.current, { innerHTML: intersectedPoiMesh.userData.allInfo.name.common })

        // Fade in new.
        gsap.to(intersectedPoiMesh.material, {
          opacity: 1.0,
          duration: 0.15,
          ease: "None",
        })

      }

      if (lastIntersectedPoiMesh != null) {
        // Fade out old.
        gsap.to(lastIntersectedPoiMesh.material, {
          opacity: 0.4,
          duration: 0.15,
          ease: "None",
        })
      }
    }

    lastIntersectedPoiMesh = intersectedPoiMesh
  })

  return (
    <>
      <PerspectiveCamera makeDefault position={new THREE.Vector3(0, 0, 25)} fov={50} far={3000} />
      <OrbitControls />
      <spotLight position={(10, 15, 10)} angle={0.3} intensity={0.2} />

      <Globe globeRadius={globeInfo.radius} />
      <PointsOfInterest displayItemsJson={displayItemsJson} globePos={globeInfo.pos} globeRadius={globeInfo.radius} />
      <Stars />
    </>
  )
}

export function GlobeSectionMain({ displayItemsJson, itemSelectedCallback, currSelectedUniqueId }) {
  const mousePosCanvasNormalizedRef = useRef({
    x: 0,
    y: 0
  })
  const canvasContainerDivRef = useRef()
  const poiInfoPopupElementRef = useRef()
  const poiInfoTitleElementRef = useRef()

  // TODO: ??use canvas size instead of window size when calculating normalized mouse coordinates??
  const canvasRef = useRef()

  function onMouseMoveCanvas(e) {
    if (canvasContainerDivRef.current == null || poiInfoPopupElementRef.current == null) {
      return
    }

    // Normalize mouse coordinates to [-1,+1] on x and y for the raycaster, which expects screen 
    // space coordinates as follows:
    //  x: -1 (left) to +1 (right)
    //  y: -1 (bottom) to +1 (top)
    // Note: Have to offset the event's "client" coordinates. They do not match up with the 
    // physical location of the canvas. I expect clientX = 0 to be the left edge, and clientY to
    // be the bottom edge, but they aren't. The calculations do not take into account when the
    // canvas is _not_ anchored on the origin (upper left). Calculate the offset yourself.
    // Also Note: Negate the Y when normalizing. This event reverses ThreeJs' default coordinate 
    // system's Y axis. OpenGL, and consequently ThreeJs, have canvas y=0 at the bottom, but 
    // this event puts y=0 at the top (like all modern visual coordinate systems). So we need to
    // negate the Y axis when calculating OpenGL screen space coordinates.
    let canvasX = e.clientX - canvasContainerDivRef.current.offsetLeft
    let canvasY = e.clientY - canvasContainerDivRef.current.offsetTop
    let canvasNormalizedX = ((canvasX / canvasContainerDivRef.current.clientWidth) * 2) - 1
    let canvasNormalizedY = -((canvasY / canvasContainerDivRef.current.clientHeight) * 2) + 1
    // console.log({ "canvas.x": canvasNormalizedX, "canvas.y": canvasNormalizedY })
    mousePosCanvasNormalizedRef.current.x = canvasNormalizedX
    mousePosCanvasNormalizedRef.current.y = canvasNormalizedY

    if (poiInfoPopupElementRef) {
      poiInfoPopupElementRef.current.style.left = `${e.clientX}px`
      poiInfoPopupElementRef.current.style.top = `${e.clientY}px`
    }

    // console.log({
    //   "mouse.x": mousePosCanvasNormalizedRef.current.x,
    //   "mouse.y": mousePosCanvasNormalizedRef.current.y
    // })
  }

  // useEffect(() => {
  //   let htmlElement = document.getElementById("bergle")
  //   console.log({ "htmlElement": htmlElement })
  // }, [])

  return (
    <>
      <div ref={poiInfoPopupElementRef} className="fixed bg-gray-600 bg-opacity-75 px-4 py-2 w-1/6 rounded-lg">
        <h2 ref={poiInfoTitleElementRef} className="text-white text-xs">
          Title placeholder
        </h2>
      </div>

      <div ref={canvasContainerDivRef} className='w-full h-full bg-blue-950 border-4 border-red-500'>
        <Canvas ref={canvasRef} onMouseMove={(e) => onMouseMoveCanvas(e)}>
          <MyScene
            displayItemsJson={displayItemsJson}
            itemSelectedCallback={itemSelectedCallback}
            currSelectedUniqueId={currSelectedUniqueId}
            poiInfoPopupElementRef={poiInfoPopupElementRef}
            poiInfoTitleElementRef={poiInfoTitleElementRef}
            mousePosCanvasNormalized={mousePosCanvasNormalizedRef.current}
          >
          </MyScene>
        </Canvas>
      </div>
    </>
  )
}