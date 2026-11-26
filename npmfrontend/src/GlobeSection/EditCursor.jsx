import { useEffect } from "react"
import { useThree } from "@react-three/fiber"
import { useSelector } from "react-redux"
import { editCursorFor } from "./editCursors"

// Sets the globe canvas's mouse cursor in edit mode (see editCursors.js). Reads existing state
// only: the per-frame hover raycast, the press-time raycast stored with the left press, and the
// active drag. Like CameraDragLock, nothing else needs to know it exists.
//
// Note: _Must_ be a child of react-three/fiber "Canvas".
export function EditCursor() {
  const canvas = useThree((state) => state.gl.domElement)
  const editModeOn = useSelector((state) => state.editEventReducer.editModeOn)
  const hoveredMeshName = useSelector((state) => state.mouseInfoReducer.cursorRaycasting.intersections[0]?.mesh.name)
  const pressedMeshName = useSelector((state) => {
    const leftMouseDown = state.mouseInfoReducer.leftMouseDown
    if (!leftMouseDown) {
      return undefined
    }
    // The active drag if one started; otherwise what the press landed on ("" = nothing).
    return state.editEventReducer.clickAndDrag?.mesh?.name ?? leftMouseDown.intersection?.mesh.name ?? ""
  })

  const cursor = editCursorFor({ editModeOn, hoveredMeshName, pressedMeshName })

  useEffect(() => {
    canvas.style.cursor = cursor
  }, [canvas, cursor])

  useEffect(() => () => {
    canvas.style.cursor = ""
  }, [canvas])

  return null
}
