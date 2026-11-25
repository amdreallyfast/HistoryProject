import { useEffect } from "react"
import { useThree } from "@react-three/fiber"
import { useStore } from "react-redux"
import { meshNames } from "./constValues"
import { cursorRaycast } from "./cursorRaycast"

// Freezes the camera for the duration of a left-button press that starts on an editable pin
// or the editable region, so dragging them never also rotates/pans the camera.
//
// Why it is safe to keep separate from the pins, the region, and MouseHandler:
//  - It decides "this press grabbed a pin/region" with the same press-time raycast
//    (cursorRaycast.atClient at the pressed pixel) that GlobeSectionMain stores as
//    leftMouseDown.intersection and MouseHandler uses to start the drag, so the two can't
//    disagree about what was grabbed.
//  - It only toggles `controls.enabled` on the default camera controls. No other component
//    reads or writes that flag. (This replaced a manual Ctrl-key toggle, removed 2026-11-25.)
//
// Timing: three.js OrbitControls decides rotate vs pan inside its own pointerdown handler, so
// the camera must be locked before that runs. A capture-phase listener on `window` runs before
// any listener on the canvas or its wrapper, and the lock is applied synchronously (not via
// React state, which would only take effect on the next render).
//
// Note: _Must_ be a child of react-three/fiber "Canvas", and the camera controls must be
// registered with `makeDefault`.
export function CameraDragLock() {
  const controls = useThree((state) => state.controls)
  const reduxStore = useStore()

  useEffect(() => {
    if (!controls) {
      return
    }

    let locked = false

    const onPointerDown = (e) => {
      if (e.button !== 0) {
        return
      }
      if (!controls.domElement || !controls.domElement.contains(e.target)) {
        // Press was outside the globe (search box, details panel, ...).
        return
      }

      const state = reduxStore.getState()
      if (!state.editEventReducer.editModeOn) {
        return
      }

      // Same press-time raycast GlobeSectionMain.onCanvasMouseDown uses for MouseHandler's drag:
      // same function, same pixel, same camera, nothing runs in between, so same answer.
      const pressIntersections = cursorRaycast.atClient(e.clientX, e.clientY)
      const grabbed = pressIntersections
        ? pressIntersections[0]
        : state.mouseInfoReducer.cursorRaycasting.intersections[0]
      const grabbedMeshName = grabbed?.mesh.name
      if (grabbedMeshName === meshNames.PinBoundingBox || grabbedMeshName === meshNames.Region) {
        controls.enabled = false
        locked = true
      }
    }

    // Release on pointerup anywhere (the drag may end off the canvas), on cancel, and if the
    // window loses focus mid-drag, so the camera can never stay frozen.
    const release = () => {
      if (locked) {
        controls.enabled = true
        locked = false
      }
    }

    window.addEventListener("pointerdown", onPointerDown, { capture: true })
    window.addEventListener("pointerup", release)
    window.addEventListener("pointercancel", release)
    window.addEventListener("blur", release)
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, { capture: true })
      window.removeEventListener("pointerup", release)
      window.removeEventListener("pointercancel", release)
      window.removeEventListener("blur", release)
      release()
    }
  }, [controls, reduxStore])

  return null
}
