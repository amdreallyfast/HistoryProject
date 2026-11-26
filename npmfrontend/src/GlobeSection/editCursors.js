import { meshNames } from "./constValues"

// Edit-mode mouse cursors, so it's obvious what a drag will move (TODO "Globe: edit-mode hover
// cursors for region and pins", options compared and chosen 2026-11-25):
//  - region: four-way arrows, hollow on hover, solid while pressed/dragging. CSS has no
//    hollow/solid variants of `move`, so these are custom 24x24 SVG cursors with the hotspot at
//    the center and the built-in `move` as fallback.
//  - pin: `grab` on hover, `grabbing` while pressed/dragging.
//  - anywhere else, and outside edit mode: the default cursor ("").

const FOUR_WAY_ARROW_POINTS =
  "12,1 16,5 13.5,5 13.5,10.5 19,10.5 19,8 23,12 19,16 19,13.5 13.5,13.5 13.5,19 16,19 " +
  "12,23 8,19 10.5,19 10.5,13.5 5,13.5 5,16 1,12 5,8 5,10.5 10.5,10.5 10.5,5 8,5"

const fourWayArrowCursor = (fill, stroke) => {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">` +
    `<polygon points="${FOUR_WAY_ARROW_POINTS}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 12 12, move`
}

export const editCursors = {
  regionHover: fourWayArrowCursor("#ffffff", "#000000"), // hollow
  regionPressed: fourWayArrowCursor("#000000", "#ffffff"), // solid
  pinHover: "grab",
  pinPressed: "grabbing",
  none: "",
}

// hoveredMeshName: closest mesh under the cursor (per-frame raycast).
// pressedMeshName: what the current left press grabbed (press-time raycast / active drag), or
// undefined when no button is down. While pressed, the press decides, even if the cursor has
// moved off the mesh mid-drag.
export function editCursorFor({ editModeOn, hoveredMeshName, pressedMeshName }) {
  if (!editModeOn) {
    return editCursors.none
  }
  if (pressedMeshName !== undefined) {
    if (pressedMeshName === meshNames.PinBoundingBox) return editCursors.pinPressed
    if (pressedMeshName === meshNames.Region) return editCursors.regionPressed
    return editCursors.none // e.g. rotating the camera from empty globe
  }
  if (hoveredMeshName === meshNames.PinBoundingBox) return editCursors.pinHover
  if (hoveredMeshName === meshNames.Region) return editCursors.regionHover
  return editCursors.none
}
