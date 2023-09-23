import { useRef } from "react"
import { Canvas } from '@react-three/fiber'
import { Scene } from "./Scene"

export function GlobeSectionMain() {
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

    // Normalize mouse coordinates to screen space for the raycaster ([-1,+1] on x and y):
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

    // The POI info popup, however, seems to be able to follow the unfiltered canvasX...*shrug*.
    if (poiInfoPopupElementRef) {
      poiInfoPopupElementRef.current.style.left = `${e.clientX}px`
      poiInfoPopupElementRef.current.style.top = `${e.clientY}px`
    }
  }

  function onMouseClickCanvas(e) {
    // console.log({ "canvas.x": e.clientX, "canvas.y": e.clientY })
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
          <Scene
            poiInfoPopupElementRef={poiInfoPopupElementRef}
            poiInfoTitleElementRef={poiInfoTitleElementRef}
            mousePosCanvasScreenSpaceRef={mousePosCanvasScreenSpaceRef}
            mouseClickedCurrPosRef={mouseClickedCurrPosRef}
          >
          </Scene>
        </Canvas>
      </div>
    </>
  )
}