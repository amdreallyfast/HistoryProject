import { describe, it, expect } from "vitest"
import { editCursorFor, editCursors } from "./editCursors"
import { meshNames } from "./constValues"

const pin = meshNames.PinBoundingBox
const region = meshNames.Region

describe("editCursorFor", () => {
  it("is the default cursor outside edit mode, whatever is hovered or pressed", () => {
    expect(editCursorFor({ editModeOn: false, hoveredMeshName: region })).toBe("")
    expect(editCursorFor({ editModeOn: false, hoveredMeshName: pin, pressedMeshName: pin })).toBe("")
  })

  it("hover: hollow arrows over the region, grab over a pin, default elsewhere", () => {
    expect(editCursorFor({ editModeOn: true, hoveredMeshName: region })).toBe(editCursors.regionHover)
    expect(editCursorFor({ editModeOn: true, hoveredMeshName: pin })).toBe("grab")
    expect(editCursorFor({ editModeOn: true, hoveredMeshName: meshNames.Globe })).toBe("")
    expect(editCursorFor({ editModeOn: true, hoveredMeshName: undefined })).toBe("")
  })

  it("pressed: the press decides, even after the cursor moves off the mesh", () => {
    expect(editCursorFor({ editModeOn: true, hoveredMeshName: meshNames.Globe, pressedMeshName: region })).toBe(editCursors.regionPressed)
    expect(editCursorFor({ editModeOn: true, hoveredMeshName: meshNames.Globe, pressedMeshName: pin })).toBe("grabbing")
    expect(editCursorFor({ editModeOn: true, hoveredMeshName: region, pressedMeshName: "" })).toBe("")
  })

  it("region cursors are hollow vs solid four-way arrows with a centered hotspot and move fallback", () => {
    expect(editCursors.regionHover).toMatch(/^url\("data:image\/svg\+xml,.+"\) 12 12, move$/)
    expect(decodeURIComponent(editCursors.regionHover)).toContain('fill="#ffffff" stroke="#000000"')
    expect(decodeURIComponent(editCursors.regionPressed)).toContain('fill="#000000" stroke="#ffffff"')
  })
})
