import { useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Canvas } from '@react-three/fiber'
import { Scene } from "./Scene"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { mouseStateActions } from "../AppState/stateSliceMouseInfo"

export function GlobeSectionMain() {
  // Toggle with CTRL key.
  const [cameraRotateEnabled, setCameraRotateEnabled] = useState(true)
  const [cameraPanEnabled, setCameraPanEnabled] = useState(true)
  const mouseState = useSelector((state) => state.mouseInfoReducer)
  const reduxDispatch = useDispatch()

  const canvasContainerDivRef = useRef()
  const poiInfoPopupElementRef = useRef()
  const poiInfoTitleElementRef = useRef()

  function convertClientXYToScreenSpaceXY(clientX, clientY) {
    // Adjustments due to current (9/15/2023) quirks in React Three Fiber's canvas event system:
    //  1. The "client" coordinates from the canvas are based on the parent container. Parent 
    //    container margins or borders can shift the actual starting position of the canvas. If 
    //    the canvas is not perfectly anchored in the upper left, then 
    //    (clientX == 0) != left edge
    //    (clientY == 0) != top edge
    //  2. The canvas offset needs info from the containing <div> element. The <div> has an 
    //    offset. This offset is found within the <div>'s "client" object (in this case, the 
    //    canvas).
    let canvasX = clientX - canvasContainerDivRef.current.clientLeft - canvasContainerDivRef.current.offsetLeft + 1
    let canvasY = clientY - canvasContainerDivRef.current.clientTop - canvasContainerDivRef.current.offsetTop

    // Normalize mouse coordinates to screen space for the raycaster ([-1,+1] on x and y):
    //  x: -1 (left) to +1 (right)
    //  y: -1 (bottom) to +1 (top)
    //  Note: Another quirk: Negate the Y when normalizing. 
    //    This event reverses ThreeJs' default coordinate system's Y axis. OpenGL, and 
    //    consequently ThreeJs, have canvas y=0 at the bottom, but React Three Fiber's event 
    //    system, like all modern canvas systems, puts y=0 at the top, and so we need to negate 
    //    the Y axis when calculating OpenGL screen space coordinates.
    let canvasNormalizedX = ((canvasX / canvasContainerDivRef.current.clientWidth) * 2) - 1
    let canvasNormalizedY = -((canvasY / canvasContainerDivRef.current.clientHeight) * 2) + 1
    // console.log({ "canvas.x": canvasNormalizedX, "canvas.y": canvasNormalizedY })

    return {
      x: canvasNormalizedX,
      y: canvasNormalizedY
    }
  }

  function onCanvasMouseMove(e) {
    // console.log(e)

    if (canvasContainerDivRef.current == null || poiInfoPopupElementRef.current == null) {
      return
    }

    let normalized = convertClientXYToScreenSpaceXY(e.clientX, e.clientY)
    reduxDispatch(
      mouseStateActions.setMousePos({
        x: normalized.x,
        y: normalized.y
      })
    )

    // Note: The POI info pop's position, unlike the mouse, seems to be able to follow the 
    // unfiltered client (that is, the canvas)...*shrug*.
    if (poiInfoPopupElementRef) {
      poiInfoPopupElementRef.current.style.left = `${e.clientX}px`
      poiInfoPopupElementRef.current.style.top = `${e.clientY}px`
    }
  }

  function onCanvasMouseDown(e) {
    // console.log({ "onCanvasMouseDown": e })

    let normalized = convertClientXYToScreenSpaceXY(e.clientX, e.clientY)
    let metadata = {
      timeMs: (new Date()).getTime(),
      pos: {
        x: normalized.x,
        y: normalized.y
      }
    }

    if (e.button == 0) {
      // Left mouse button
      reduxDispatch(
        mouseStateActions.setLeftMouseIsDown(metadata)
      )
    }
    else if (e.button == 1) {
      // Right mouse button
      reduxDispatch(
        mouseStateActions.setRightMouseIsDown(metadata)
      )
    }
    else {
      // ignore other buttons
    }
  }

  function onCanvasMouseUp(e) {
    // console.log({ "onCanvasMouseUp": e })

    let normalized = convertClientXYToScreenSpaceXY(e.clientX, e.clientY)
    let metadata = {
      timeMs: (new Date()).getTime(),
      pos: {
        x: normalized.x,
        y: normalized.y
      }
    }

    if (e.button == 0) {
      // Left mouse button
      reduxDispatch(
        mouseStateActions.setLeftMouseIsUp(metadata)
      )
    }
    else if (e.button == 1) {
      // Right mouse button
      reduxDispatch(
        mouseStateActions.setRightMouseIsUp(metadata)
      )
    }
    else {
      // ignore other buttons
    }
  }

  function onCanvasKeyDown(e) {
    // console.log({ "onCanvasKeyDown": e })

    if (e.ctrlKey) {
      if (cameraRotateEnabled) {
        console.log("disable rotate")
        setCameraRotateEnabled(false)
      }

      if (cameraPanEnabled) {
        console.log("disable pan")
        setCameraPanEnabled(false)
      }
    }
  }

  function onCanvasKeyUp(e) {
    // console.log({ "onCanvasKeyUp": e })

    if (!e.ctrlKey) {
      if (!cameraRotateEnabled) {
        console.log("enable rotate")
        setCameraRotateEnabled(true)
      }

      if (!cameraPanEnabled) {
        console.log("enable pan")
        setCameraPanEnabled(true)
      }
    }
  }

  return (
    <>
      {/* TODO: ??how to make this opaque, or at least easier to read?? */}
      <div ref={poiInfoPopupElementRef} className="fixed hidden bg-gray-900 bg-opacity-0 px-4 py-2 w-1/6 rounded-lg bg-transparent">
        <h2 ref={poiInfoTitleElementRef} className="text-white text-lg">
          Title placeholder
        </h2>
      </div>

      <div ref={canvasContainerDivRef} className='w-full h-full bg-black border-4 border-red-500'>
        <Canvas
          // Note: tabIndex must exist for the canvas to take focus and respond to key presses.
          tabIndex={0}
          onMouseMove={(e) => onCanvasMouseMove(e)}
          onMouseDown={(e) => onCanvasMouseDown(e)}
          onMouseUp={(e) => onCanvasMouseUp(e)}
          onKeyDown={(e) => onCanvasKeyDown(e)}
          onKeyUp={(e) => onCanvasKeyUp(e)}
        >
          <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={50} near={0.5} far={3000} />
          <OrbitControls enableRotate={cameraRotateEnabled} enablePan={cameraPanEnabled} />
          <spotLight position={(10, 15, 10)} angle={0.3} intensity={0.2} />
          <Scene
            poiInfoPopupElementRef={poiInfoPopupElementRef}
            poiInfoTitleElementRef={poiInfoTitleElementRef}
          >
          </Scene>
        </Canvas>
      </div>
    </>
  )
}