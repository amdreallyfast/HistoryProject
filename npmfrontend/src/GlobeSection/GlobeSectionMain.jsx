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

function MyScene(
  {
    displayItemsJson,
    itemSelectedCallback,
    currSelectedItemRef,
    poiInfoPopupElementRef,
    poiInfoTitleElementRef,
    mousePosCanvasScreenSpaceRef,
    mouseClickedCurrPosRef
  }) {
  const poiAndGlobeMeshesRef = useRef()
  const threeJsStateModelRef = useRef()
  threeJsStateModelRef.current = useThree((state) => state)
  useEffect(() => {
    console.log({ msg: "GlobeSectionMain(): useEffect()" })

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

  let lastMouseHoverPoiMeshRef = useRef()
  // let prevSelectedPoiMeshRef = useRef()
  let currSelectedPoiMeshRef = useRef()
  useFrame((state, delta) => {
    // console.log("useFrame()")


    // console.log({ mouseClickedCurrPos: mouseClickedCurrPosRef.current })


    // Construction of the group of points of interest and the ThreeJs state model may take a 
    // couple frames. Wait until then.
    if (poiAndGlobeMeshesRef.current == null || poiInfoPopupElementRef.current == null) {
      return
    }

    // Check for outside changes.
    let newPoiSelectedFromTheOutside =
      currSelectedItemRef.current != null &&
      currSelectedItemRef.current?.myUniqueId != currSelectedPoiMeshRef.current?.userData.allInfo.myUniqueId

    let poiDeselectedFromTheOutside =
      currSelectedItemRef.current == null &&
      currSelectedPoiMeshRef.current != null

    if (newPoiSelectedFromTheOutside) {
      console.log({ msg: "newPoiSelectedFromTheOutside" })

      // Fade out the old (if it exists).
      if (currSelectedPoiMeshRef.current) {
        gsap.to(currSelectedPoiMeshRef.current.material, {
          color: currSelectedPoiMeshRef.current.userData.originalColor,
          opacity: 0.4,
          duration: 0.15
        })
      }

      // Find the mesh representing the new selection and fade it in.
      poiAndGlobeMeshesRef.current.forEach((mesh) => {
        // Check for changes in the currently selected item from outside mechanisms.
        if (mesh.name != "Globe") {
          let isCurrSelected = mesh.userData.allInfo.myUniqueId == currSelectedItemRef.current?.myUniqueId
          if (isCurrSelected) {
            // Fade in the new.
            gsap.to(mesh.material, {
              color: mesh.userData.selectedColor,
              opacity: 1.0,
              duration: 0.15
            })
            currSelectedPoiMeshRef.current = mesh
          }
        }
      })

      return
    }
    else if (poiDeselectedFromTheOutside) {
      console.log({ msg: "poiDeselectedFromTheOutside" })

      // Fade out the old.
      gsap.to(currSelectedPoiMeshRef.current.material, {
        color: currSelectedPoiMeshRef.current.userData.originalColor,
        opacity: 0.4,
        duration: 0.15
      })
      currSelectedPoiMeshRef.current = null

      return
    }

    // Check for changes from _inside_ the GlobeSection.
    state.raycaster.setFromCamera(mousePosCanvasScreenSpaceRef.current, state.camera)
    // console.log({ "mouse.x": mousePosCanvasNormalized.x, "mouse.y": mousePosCanvasNormalized.y })

    let mouseHoverPoiMesh = null
    // let clickedPoiMesh = null

    // Only consider intersections that are:
    // 1. Not the globe
    // 2. Not behind the globe
    // Note: Intersections are organized by increasing distance, making item 0 the closest.
    const intersectedObjects = state.raycaster.intersectObjects(poiAndGlobeMeshesRef.current)
    // console.log({ intersectedPoiMesh: intersectedPoiMesh, lastIntersectedPoiMesh: lastIntersectedPoiMesh })
    if (intersectedObjects.length > 0) {
      let firstIntersection = intersectedObjects[0].object
      if (firstIntersection.name != "Globe") {
        mouseHoverPoiMesh = firstIntersection
      }
    }

    // console.log({ curr: currSelectedPoiMeshRef.current, prev: prevSelectedPoiMeshRef.current })

    // Occurs when the mouse drifts from the world (or space) to a POI.
    let newPoiHover =
      mouseHoverPoiMesh != null && lastMouseHoverPoiMeshRef.current == null

    // Occurs when the mouse drifts from a POI to the world (or space).
    let leavingPoiHover =
      mouseHoverPoiMesh == null && lastMouseHoverPoiMeshRef.current != null

    // Occurs when the mouse drifts from one POI to another without going through a space where 
    // there is no POI. Need to shift focus w/out turning off the info popup.
    let changingPoiHover =
      mouseHoverPoiMesh != null && lastMouseHoverPoiMeshRef.current != null &&
      mouseHoverPoiMesh?.uuid != lastMouseHoverPoiMeshRef.current?.uuid

    // Occurs when the mouse is stationary over a POI and is clicked.
    let clickedSamePoiHover =
      mouseHoverPoiMesh != null && lastMouseHoverPoiMeshRef.current != null &&
      mouseHoverPoiMesh?.uuid == lastMouseHoverPoiMeshRef.current?.uuid &&
      mouseClickedCurrPosRef.current == true

    // const fadeIn = (meshMaterial) => {
    //   gsap.to(meshMaterial, {
    //     opacity: 1.0,
    //     duration: 0.15
    //   })
    // }

    if (newPoiHover) {
      console.log({ msg: "newPoiHover" })

      // Turn on the popup.
      gsap.set(poiInfoPopupElementRef.current, {
        display: "block"
      })
      gsap.set(poiInfoTitleElementRef.current, {
        innerHTML: mouseHoverPoiMesh.userData.allInfo.name.common
      })

      // console.log({
      //   r: mouseHoverPoiMesh.material.color.r,
      //   g: mouseHoverPoiMesh.material.color.g,
      //   b: mouseHoverPoiMesh.material.color.b,
      //   opacity: mouseHoverPoiMesh.material.opacity
      // })
      // Fade in the new (unless it's the currently selected POI; leave that alone).
      if (mouseHoverPoiMesh.uuid != currSelectedPoiMeshRef.current?.uuid) {
        gsap.to(mouseHoverPoiMesh.material, {
          opacity: 1.0,
          duration: 0.15
        })
      }
    }
    else if (leavingPoiHover) {
      console.log({ msg: "leavingPoiHover" })

      // Turn off the popup
      gsap.set(poiInfoPopupElementRef.current, {
        display: "none"
      })

      // Fade out the old (unless it's the currently selected POI; leave that alone).
      if (lastMouseHoverPoiMeshRef.current.uuid != currSelectedPoiMeshRef.current?.uuid) {
        gsap.to(lastMouseHoverPoiMeshRef.current.material, {
          opacity: 0.4,
          duration: 0.15
        })
      }
    }
    else if (changingPoiHover) {
      console.log({ msg: "changingPoiHover" })

      // Fade in the new
      gsap.to(mouseHoverPoiMesh.material, {
        opacity: 1.0,
        duration: 0.15
      })

      // Fade out the old (unless it's the currently selected POI).
      if (lastMouseHoverPoiMeshRef.current.uuid != currSelectedPoiMeshRef.current?.uuid) {
        gsap.to(lastMouseHoverPoiMeshRef.current.material, {
          opacity: 0.4,
          duration: 0.15
        })
      }
    }
    else if (clickedSamePoiHover) {
      console.log({ msg: "clickedSamePoiHover" })

      // Only allow a single click to process
      mouseClickedCurrPosRef.current = false

      if (mouseHoverPoiMesh.uuid == currSelectedPoiMeshRef.current?.uuid) {
        // The currently selected item is clicked again

        // Fade in the original color.
        gsap.set(mouseHoverPoiMesh.material, {
          color: mouseHoverPoiMesh.userData.originalColor,
          duration: 2.0
        })

        // And de-select.
        currSelectedPoiMeshRef.current = null
        itemSelectedCallback(null)
      }
      else {
        // A new item is clicked.

        // Fade in highlight color.
        gsap.set(mouseHoverPoiMesh.material, {
          color: mouseHoverPoiMesh.userData.selectedColor,
          duration: 2.0
        })

        // If there is a previous selection, fade that one back to the original color.
        if (currSelectedPoiMeshRef.current) {
          gsap.set(currSelectedPoiMeshRef.current.material, {
            color: currSelectedPoiMeshRef.current.userData.originalColor,
            duration: 2.0
          })
        }

        // And select.
        currSelectedPoiMeshRef.current = mouseHoverPoiMesh
        itemSelectedCallback(mouseHoverPoiMesh.userData.allInfo)
      }
    }
    else {
      // console.log({ msg: "no POI hover" })

      // Not hovering over any POI. Ignore.
    }

    lastMouseHoverPoiMeshRef.current = mouseHoverPoiMesh
  })


  return (
    <>
      <PerspectiveCamera makeDefault position={new THREE.Vector3(0, 0, 25)} fov={50} far={3000} />
      <OrbitControls />
      <spotLight position={(10, 15, 10)} angle={0.3} intensity={0.2} />

      <Globe globeRadius={globeInfo.radius} />
      <PointsOfInterest displayItemsJson={displayItemsJson} globePos={globeInfo.pos} globeRadius={globeInfo.radius} currSelectedItemRef={currSelectedItemRef} />
      <Stars />
    </>
  )
}

export function GlobeSectionMain({ displayItemsJson, itemSelectedCallback, currSelectedItemRef }) {
  const mousePosCanvasScreenSpaceRef = useRef({
    x: 0,
    y: 0
  })
  const mouseClickedCurrPosRef = useRef(false)
  const canvasContainerDivRef = useRef()
  const poiInfoPopupElementRef = useRef()
  const poiInfoTitleElementRef = useRef()

  // TODO: ??use canvas size instead of window size when calculating normalized mouse coordinates??
  const canvasRef = useRef()

  function onMouseMoveCanvas(e) {
    if (canvasContainerDivRef.current == null || poiInfoPopupElementRef.current == null) {
      return
    }

    mouseClickedCurrPosRef.current = false

    // Normalize mouse coordinates to [-1,+1] on x and y for the raycaster, which expects screen 
    // space coordinates as follows:
    //  x: -1 (left) to +1 (right)
    //  y: -1 (bottom) to +1 (top)
    // Adjustments due to current (9/15/2023) quirks in React Three Fiber's canvas event system:
    //  1. (e.clientX == 0) != left edge, and (e.clientY == 0) != top edge. The calculation does 
    //    not take into account when the canvas is _not_ anchored in the upper left.
    //  2. The canvas offset needs info from the containing <div> element. The <div> has an 
    //    offset, and within there the div's "client" (in this case, the canvas) has an offset
    //    from the <div>
    //  3. Negate the Y when normalizing. This event reverses ThreeJs' default coordinate system's
    //    Y axis. OpenGL, and consequently ThreeJs, have canvas y=0 at the bottom, but this event
    //    puts y=0 at the top (like all modern visual coordinate systems). So we need to negate 
    //    the Y axis when calculating OpenGL screen space coordinates.
    let canvasX = e.clientX - canvasContainerDivRef.current.clientLeft - canvasContainerDivRef.current.offsetLeft + 1
    let canvasY = e.clientY - canvasContainerDivRef.current.clientTop - canvasContainerDivRef.current.offsetTop
    let canvasNormalizedX = ((canvasX / canvasContainerDivRef.current.clientWidth) * 2) - 1
    let canvasNormalizedY = -((canvasY / canvasContainerDivRef.current.clientHeight) * 2) + 1
    // console.log({ "canvas.x": canvasNormalizedX, "canvas.y": canvasNormalizedY })
    mousePosCanvasScreenSpaceRef.current.x = canvasNormalizedX
    mousePosCanvasScreenSpaceRef.current.y = canvasNormalizedY

    // The POI info popup, however, seems to be able to follow the unfiltered canvasX. 
    // ...*shrug*
    if (poiInfoPopupElementRef) {
      poiInfoPopupElementRef.current.style.left = `${e.clientX}px`
      poiInfoPopupElementRef.current.style.top = `${e.clientY}px`
    }
  }

  function onMouseClickCanvas(e) {
    console.log({ "canvas.x": e.clientX, "canvas.y": e.clientY })
    mouseClickedCurrPosRef.current = true
  }

  // useEffect(() => {
  //   console.log({ "canvasContainer": canvasContainerDivRef.current })
  // }, [])

  return (
    <>
      <div ref={poiInfoPopupElementRef} className="fixed bg-gray-600 bg-opacity-75 px-4 py-2 w-1/6 rounded-lg">
        <h2 ref={poiInfoTitleElementRef} className="text-white text-xs">
          Title placeholder
        </h2>
      </div>

      <div ref={canvasContainerDivRef} className='w-full h-full bg-black border-4 border-red-500'>
        <Canvas ref={canvasRef} onMouseMove={(e) => onMouseMoveCanvas(e)} onClick={(e) => onMouseClickCanvas(e)}>
          <MyScene
            displayItemsJson={displayItemsJson}
            itemSelectedCallback={itemSelectedCallback}
            currSelectedItemRef={currSelectedItemRef}
            poiInfoPopupElementRef={poiInfoPopupElementRef}
            poiInfoTitleElementRef={poiInfoTitleElementRef}
            mousePosCanvasScreenSpaceRef={mousePosCanvasScreenSpaceRef}
            mouseClickedCurrPosRef={mouseClickedCurrPosRef}
          >
          </MyScene>
        </Canvas>
      </div>
    </>
  )
}