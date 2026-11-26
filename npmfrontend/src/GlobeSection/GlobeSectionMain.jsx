import { useRef } from "react"
import { MOUSE } from "three"
import { useDispatch, useSelector } from "react-redux"
import { Canvas } from '@react-three/fiber'
import { Scene } from "./Scene"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { mouseStateActions } from "../AppState/stateSliceMouseInfo"
import { CameraDragLock } from "./CameraDragLock"
import { EditCursor } from "./EditCursor"
import { GlobeTestHook } from "./GlobeTestHook"
import { clientToNdc, cursorRaycast } from "./cursorRaycast"

// Middle-button drag pans (three.js default is DOLLY, which duplicated the wheel zoom); the wheel
// is the only zoom. Right-button drag also pans (three.js default). Module-level so the prop is
// the same object on every render (this component re-renders on every mouse move).
const ORBIT_MOUSE_BUTTONS = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }

export function GlobeSectionMain() {
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
      // Middle mouse button (DOM MouseEvent.button: 0 left, 1 middle, 2 right). Was
      // mislabeled "right". Recorded only; camera panning is handled by OrbitControls.
      reduxDispatch(mouseStateActions.setMiddleMouseIsDown(clickData))
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
      // Middle mouse button (see onCanvasMouseDown)
      reduxDispatch(mouseStateActions.setMiddleMouseIsUp(metadata))
    }
    else {
      // ignore other buttons
    }
  }

  return (
    <div ref={canvasContainerDivRef} className='w-full h-full bg-black border-4 border-red-500'>
      <Canvas
        onMouseMove={(e) => onCanvasMouseMove(e)}
        onMouseDown={(e) => onCanvasMouseDown(e)}
        onMouseUp={(e) => onCanvasMouseUp(e)}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={50} near={0.5} far={3000} />
        {/* Camera rotation/pan is frozen automatically while dragging a pin or the region (CameraDragLock). */}
        <OrbitControls makeDefault mouseButtons={ORBIT_MOUSE_BUTTONS} />
        <CameraDragLock />
        <EditCursor />
        {!import.meta.env.PROD && <GlobeTestHook />}
        <spotLight position={[10, 15, 10]} angle={0.3} intensity={0.2} />
        <Scene />
      </Canvas>
    </div>
  )
}
