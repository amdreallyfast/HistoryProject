import { useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Canvas } from '@react-three/fiber'
import { Scene } from "./Scene"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { mouseStateActions } from "../AppState/stateSliceMouseInfo"
import { CameraDragLock } from "./CameraDragLock"
import { GlobeTestHook } from "./GlobeTestHook"
import { clientToNdc, cursorRaycast } from "./cursorRaycast"

export function GlobeSectionMain() {
  // Toggle with CTRL key.
  const [cameraRotateEnabled, setCameraRotateEnabled] = useState(true)
  const [cameraPanEnabled, setCameraPanEnabled] = useState(true)
  const mouseState = useSelector((state) => state.mouseInfoReducer)
  const reduxDispatch = useDispatch()

  const canvasContainerDivRef = useRef()

  function convertClientXYToScreenSpaceXY(clientX, clientY) {
    // Normalized [-1,+1] screen space for the raycaster. Uses the canvas's actual on-screen
    // rectangle (see clientToNdc), which replaced the earlier hand-computed container offsets
    // (border, offsetLeft, +1 px) and must match what the press-time raycast uses.
    const canvas = canvasContainerDivRef.current.querySelector("canvas")
    return clientToNdc(clientX, clientY, canvas)
  }

  function onCanvasMouseMove(e) {
    // console.log({ "onCanvasMouseMove": e })

    if (canvasContainerDivRef.current == null) {
      return
    }

    let normalized = convertClientXYToScreenSpaceXY(e.clientX, e.clientY)
    let mousePos = {
      x: normalized.x,
      y: normalized.y
    }
    reduxDispatch(mouseStateActions.setMousePos(mousePos))
  }

  function onCanvasMouseDown(e) {
    // console.log({ "onCanvasMouseDown": e })

    let normalized = convertClientXYToScreenSpaceXY(e.clientX, e.clientY)
    // Raycast at the exact pixel pressed, not the per-frame result, which can trail the cursor
    // by 1-2 frames (see cursorRaycast.js). Falls back to the stored result only before Scene
    // has registered the raycast (first frames after load).
    let pressIntersections = cursorRaycast.atClient(e.clientX, e.clientY)
    let meshIntersection = pressIntersections
      ? pressIntersections[0]
      : mouseState.cursorRaycasting.intersections[0]
    let clickData = {
      timeMs: (new Date()).getTime(),
      pos: {
        x: normalized.x,
        y: normalized.y
      },
      intersection: meshIntersection
    }

    if (e.button == 0) {
      // Left mouse button
      reduxDispatch(mouseStateActions.setLeftMouseIsDown(clickData))
    }
    else if (e.button == 1) {
      // Right mouse button
      reduxDispatch(mouseStateActions.setRightMouseIsDown(clickData))
    }
    else {
      // ignore other buttons
      console.log("ignore")
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
      reduxDispatch(mouseStateActions.setLeftMouseIsUp(metadata))
    }
    else if (e.button == 1) {
      // Right mouse button
      reduxDispatch(mouseStateActions.setRightMouseIsUp(metadata))
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
        <OrbitControls makeDefault enableRotate={cameraRotateEnabled} enablePan={cameraPanEnabled} />
        <CameraDragLock />
        {!import.meta.env.PROD && <GlobeTestHook />}
        <spotLight position={[10, 15, 10]} angle={0.3} intensity={0.2} />
        <Scene />
      </Canvas>
    </div>
  )
}
