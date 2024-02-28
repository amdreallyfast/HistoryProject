import * as THREE from "three"
import { v4 as uuid } from "uuid"
import { useSelector, useDispatch } from "react-redux"
import { mouseStateActions } from "../AppState/stateSliceMouseInfo"
import { ConvertLatLongToVec3, ConvertLatLongToXYZ, ConvertXYZToLatLong } from "./convertLatLongXYZ"
import { createWhereObjFromXYZ } from "./createWhere"
import { globeInfo, meshNames } from "./constValues"
import { editStateActions } from "../AppState/stateSliceEditPoi"
import { useEffect } from "react"
import { useFrame } from "@react-three/fiber"


// TODO: make into a component that reacts on mouse down, mouse up, mouse move, etc.


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

export const MouseHandler = () => {
  const mouseState = useSelector((state) => state.mouseInfoReducer)
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()

  const createNewRegion = (globePos, globeInfo) => {
    let x = globePos.x
    let y = globePos.y
    let z = globePos.z
    const [lat, long] = ConvertXYZToLatLong(x, y, z, globeInfo.radius)
    let whereObj = { id: uuid(), lat, long, x, y, z }
    reduxDispatch(
      editStateActions.setPrimaryPinPos(whereObj)
    )
  }

  useEffect(() => {
    console.log({ msg: "MouseHandler()/useEffect()/mouseState.mouseDown.timeMs", value: mouseState.mouseDown.timeMs })

    if (!mouseState.mouseDown.timeMs) {
      return
    }

    // enableClickAndDrag(globeIntersection, clickedMesh)
    let selectedMeshName = mouseState.cursorRaycastIntersections.firstNonGlobe?.meshName
    let cursorGlobePos = mouseState.cursorRaycastIntersections.globe?.point
    if (selectedMeshName && cursorGlobePos) {
      if (selectedMeshName == meshNames.PoiPrimaryLocationPin) {
        if (editState.editModeOn) {
          console.log(`start moving '${selectedMeshName}' to '${cursorGlobePos}'`)
        }
        else {
          // Ignore mouse down on the POI PoiPrimaryLocationPin when not in edit mode.
          // Note: The mouse _up_ might incur mouse "click" handling though.
        }
      }
      else if (selectedMeshName == meshNames.RegionBoundaryPin) {
        if (editState.editModeOn) {
          console.log(`start moving '${selectedMeshName}' to '${cursorGlobePos}'`)
        }
        else {
          throw new Error("Should not be able to start moving a RegionBoundaryPin outside of edit mode")
        }
      }
    }
  }, [mouseState.mouseDown.timeMs])

  useEffect(() => {
    console.log({ msg: "MouseHandler()/useEffect()/mouseState.mouseUp.timeMs", value: mouseState.mouseUp.timeMs })

    if (!mouseState.mouseUp.timeMs) {
      return
    }

    let mouseUp = mouseState.mouseUp
    let mouseDown = mouseState.mouseDown
    let timeDiffMs = mouseUp.timeMs - mouseDown.timeMs
    let xDiff = Math.abs(mouseUp.pos.x - mouseDown.pos.x)
    let yDiff = Math.abs(mouseUp.pos.y - mouseDown.pos.y)
    let clicked = timeDiffMs < 400 && xDiff < 3 && yDiff < 3
    if (clicked) {
      let selectedMeshName = mouseState.cursorRaycastIntersections.firstNonGlobe?.meshName
      let cursorGlobePos = mouseState.cursorRaycastIntersections.globe?.point
      if (editState.editModeOn && !editState.primaryPinPos && !selectedMeshName && cursorGlobePos) {
        // Edit mode: No region selected and clicked a blank part of the globe.
        console.log("clicked: create new region")
        createNewRegion(cursorGlobePos, globeInfo)
      }
    }

    reduxDispatch(
      mouseStateActions.resetMouseUpDown()
    )
  }, [mouseState.mouseUp.timeMs])



  // useEffect(() => {
  //   console.log({ msg: "MouseHandler()/useEffect()/mouseState.mouseClicked", value: mouseState.mouseClicked })

  //   if (!mouseState.mouseClicked) {
  //     return
  //   }
  //   else {
  //     console.log("mouse clicked curr position")
  //     reduxDispatch(
  //       mouseStateActions.resetMouseClicked
  //     )
  //   }
  // }, [mouseState.mouseClicked])

  useEffect(() => {
    let firstIntersection = mouseState.cursorRaycastIntersections.firstNonGlobe
    // console.log({ msg: "MouseHandler()/useEffect()/mouseState.cursorRaycastIntersections.firstNonGlobe", value: firstIntersection })

    // if (firstIntersection) {
    //   console.log(`hover over ${firstIntersection.meshName}`)
    // }
    // else {
    //   console.log("un-hover")
    // }
  }, [mouseState.cursorRaycastIntersections.firstNonGlobe])

  useEffect(() => {
    // TODO: ??display globe info if no other intersection??
    let globeIntersection = mouseState.cursorRaycastIntersections.globe
    // console.log({ msg: "MouseHandler()/useEffect()/mouseState.cursorRaycastIntersections.globe", value: globeIntersection })

    // if (globeIntersection) {
    //   console.log(`hover over ${globeIntersection.meshName}`)
    // }
    // else {
    //   console.log("un-hover")
    // }
  }, [mouseState.cursorRaycastIntersections.globe])

  return (
    <>
    </>
  )

  // update: (globeIntersection, firstIntersection, globeInfo) => {

  //   if (editState.editModeOn) {
  //     // Editing. Only affect the edited object, but still allow hovering over existing objects
  //     // to get cursory info.

  //     if (globeIntersection && editState.primaryPinPos == null && mouseState.mouseClicked) {
  //       console.log("clicked: create new region")
  //       // createNewRegion(globeIntersection, globeInfo)
  //     }
  //     else if (globeIntersection && mouseState.mouseIsDown && !mouseState.prevMouseIsDown) {
  //       console.log("mouse down")
  //       // let clickedMesh = firstIntersection.object
  //       // enableClickAndDrag(globeIntersection, clickedMesh)
  //     }
  //     else if (globeIntersection && mouseState.mouseIsDown && mouseState.prevMouseIsDown) {
  //       console.log("mouse still down")
  //       // if (editState.selectedMeshName == meshNames.PoiPrimaryLocationPin) {
  //       //   updateClickAndDragPrimaryPin(globeIntersection, globeInfo)
  //       // }
  //       // else if (editState.selectedMeshName == meshNames.RegionBoundaryPin) {
  //       //   updateClickAndDragRegionBoundaryPin(globeIntersection, globeInfo)
  //       // }
  //       // else if (editState.selectedMeshName == meshNames.Region) {
  //       //   updateClickAndDragRegion(globeIntersection, globeInfo)
  //       // }
  //     }

  //     // still clicking; continue click-and-drag
  //   }

  //   // ??combine??
  //   // prevMouseIsDown = mouseIsDown
  //   reduxDispatch(
  //     mouseStateActions.updateMouseIsDown()
  //   )

  //   // mouseClickedCurrPos = false
  //   reduxDispatch(
  //     mouseStateActions.disableMouseClick()
  //   )
  // }
}

