// One answer to "what's under this point on the globe canvas?", shared by:
//  - Scene's per-frame hover raycast (cursor position stored in Redux), and
//  - press-time raycasts at the exact pixel pressed (GlobeSectionMain.onCanvasMouseDown, which
//    feeds MouseHandler's drag, and CameraDragLock).
//
// Why press-time raycasts: the per-frame result trails the cursor by 1-2 frames (mousemove ->
// Redux -> re-render -> next frame's raycast). Measured 2026-11-25: a press within ~16 ms of the
// cursor arriving used the previous position's result. Raycasting at the pressed pixel removes
// that lag, and because every caller goes through the same function (same camera, same mesh
// list, same pixel conversion), they can't disagree about what was pressed.
//
// Scene registers the raycast function because it owns the camera, the raycaster, and the
// cached mesh list. Same idea as sharedDragRotor: a plain module, not Redux, for values needed
// synchronously.

// Page (client) pixels -> normalized device coordinates for the raycaster:
//  x: -1 (left) to +1 (right)
//  y: -1 (bottom) to +1 (top). Note the Y flip: OpenGL/three.js has y=0 at the bottom, while
//  DOM events have y=0 at the top.
// Uses the canvas's actual on-screen rectangle, so borders, margins, and nesting of the
// containers around it don't matter.
export function clientToNdc(clientX, clientY, canvasElement) {
  const rect = canvasElement.getBoundingClientRect()
  return {
    x: ((clientX - rect.left) / rect.width) * 2 - 1,
    y: -(((clientY - rect.top) / rect.height) * 2) + 1,
  }
}

let raycastAtClientImpl = null

export const cursorRaycast = {
  // Called by Scene whenever its mesh list changes. Returns an unregister function.
  register(impl) {
    raycastAtClientImpl = impl
    return () => {
      if (raycastAtClientImpl === impl) {
        raycastAtClientImpl = null
      }
    }
  },

  // Intersections (closest first, same shape as mouseInfoReducer.cursorRaycasting.intersections)
  // at a page pixel. Returns null (not []) if Scene hasn't registered yet, so callers can tell
  // "not ready, use the stored per-frame result" apart from "nothing there".
  atClient(clientX, clientY) {
    return raycastAtClientImpl ? raycastAtClientImpl(clientX, clientY) : null
  },
}
