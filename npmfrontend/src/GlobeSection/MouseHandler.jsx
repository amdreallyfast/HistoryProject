import { useSelector, useDispatch } from "react-redux"
import { mouseStateActions } from "../AppState/stateSliceMouseInfo"
import { ConvertLatLongToVec3, ConvertLatLongToXYZ, ConvertXYZToLatLong } from "./convertLatLongXYZ"
import { createWhereObjFromXYZ } from "./createWhere"
import { globeInfo, meshNames } from "./constValues"
import { editStateActions } from "../AppState/stateSliceEditPoi"

const createNewRegion = (globeIntersection, globeInfo) => {
  const [x, y, z] = globeIntersection.point
  const [lat, long] = ConvertXYZToLatLong(x, y, z, globeInfo.radius)
  let whereObj = { id: uuid(), lat, long, x, y, z }
  reduxDispatch(
    editStateActions.setPrimaryLocation(whereObj)
  )
}

const enableClickAndDrag = (globeIntersection, clickedMesh) => {
  // Note: The region mesh will not have a pinId and this will be null. This is ok.
  let pinId = clickedMesh.userData.whereId
  let meshName = clickedMesh.name
  const [x, y, z] = globeIntersection.point
  let clickedMeshInfo = { pinId, meshName, x, y, z }
  reduxDispatch(
    editStateActions.enableClickAndDrag(clickedMeshInfo)
  )
}

const updateClickAndDragPrimaryPin = (globeIntersection, globeInfo) => {
  // Don't update if the mouse isn't moving.
  const [x, y, z] = globeIntersection.point
  let moved =
    x != editState.primaryPinPos.x &&
    y != editState.primaryPinPos.y &&
    z != editState.primaryPinPos.z
  if (!moved) {
    return
  }

  let updatedPos = { x, y, z }
  reduxDispatch(
    editStateActions.updateClickAndDragGlobePos(updatedPos)
  )
}

const updateClickAndDragRegionBoundaryPin = (globeIntersection, globeInfo) => {
  const [x, y, z] = globeIntersection.point
  let currPinPos = editState.regionBoundaries.find((boundaryMarker) => boundaryMarker.id == editState.selectedPinId)
  if (!currPinPos) {
    throw new Error("how did you select a pin that doesn't exist?")
  }

  let moved =
    x != currPinPos.x &&
    y != currPinPos.y &&
    z != currPinPos.z
  if (!moved) {
    return
  }

  let updatedPos = { x, y, z }
  reduxDispatch(
    editStateActions.updateClickAndDragGlobePos(updatedPos)
  )

  // Update region boundaries to trigger:
  //  (a) updating the meshes used in mouseclick intersection calculations
  //  (b) redrawing the region mesh
  let updatedBoundaries = editState.regionBoundaries.map((boundaryMarker, index) => {
    if (boundaryMarker.id == editState.selectedPinId) {
      let updatedWhere = createWhereObjFromXYZ(x, y, z, globeInfo)
      updatedWhere.id = boundaryMarker.id
      return updatedWhere
    }
    else {
      // Not moving this marker. Return as-is.
      return where
    }
  })

  reduxDispatch(
    editStateActions.setRegionBoundaries(updatedBoundaries)
  )
}

const updateClickAndDragRegion = (globeIntersection, globeInfo) => {
}


export const mouseHandler = {


  update: (globeIntersection, firstIntersection, globeInfo) => {
    const mouseState = useSelector((state) => state.mouseInfoReducer)
    const editState = useSelector((state) => state.editPoiReducer)

    if (editState.editModeOn) {
      // Editing. Only affect the edited object, but still allow hovering over existing objects
      // to get cursory info.

      if (globeIntersection && editState.primaryPinPos == null && mouseState.mouseClickedCurrPos) {
        console.log("clicked: create new region")
        // createNewRegion(globeIntersection, globeInfo)
      }
      else if (globeIntersection && mouseState.mouseIsDown && !mouseState.prevMouseIsDown) {
        console.log("mouse down")
        // let clickedMesh = firstIntersection.object
        // enableClickAndDrag(globeIntersection, clickedMesh)
      }
      else if (globeIntersection && mouseState.mouseIsDown && mouseState.prevMouseIsDown) {
        console.log("mouse still down")
        // if (editState.selectedMeshName == meshNames.PoiPrimaryLocationPin) {
        //   updateClickAndDragPrimaryPin(globeIntersection, globeInfo)
        // }
        // else if (editState.selectedMeshName == meshNames.RegionBoundaryPin) {
        //   updateClickAndDragRegionBoundaryPin(globeIntersection, globeInfo)
        // }
        // else if (editState.selectedMeshName == meshNames.Region) {
        //   updateClickAndDragRegion(globeIntersection, globeInfo)
        // }
      }

      // still clicking; continue click-and-drag
    }

    // ??combine??
    // prevMouseIsDown = mouseIsDown
    reduxDispatch(
      mouseStateActions.updateMouseIsDown()
    )

    // mouseClickedCurrPos = false
    reduxDispatch(
      mouseStateActions.disableMouseClick()
    )
  }
}
