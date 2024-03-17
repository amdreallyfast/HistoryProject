import * as THREE from "three"
import { v4 as uuid } from "uuid"
import { useSelector, useDispatch } from "react-redux"
import { mouseStateActions } from "../AppState/stateSliceMouseInfo"
import { ConvertLatLongToVec3, ConvertLatLongToXYZ, ConvertXYZToLatLong } from "./convertLatLongXYZ"
import { createWhereObjFromXYZ } from "./createWhere"
import { globeInfo, meshNames } from "./constValues"
import { editStateActions } from "../AppState/stateSliceEditPoi"
import { useEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { intersection, reduce } from "lodash"


// TODO: make into a component that reacts on mouse down, mouse up, mouse move, etc.


// const enableClickAndDrag = (globeIntersection, clickedMesh) => {
//   // Note: The region mesh will not have a pinId and this will be null. This is ok.
//   let pinId = clickedMesh.userData.whereId
//   let meshName = clickedMesh.name
//   const [x, y, z] = globeIntersection.point
//   let clickedMeshInfo = { pinId, meshName, x, y, z }
//   reduxDispatch(
//     editStateActions.enableClickAndDrag(clickedMeshInfo)
//   )
// }

// const updateClickAndDragPrimaryPin = (globeIntersection, globeInfo) => {
//   // Don't update if the mouse isn't moving.
//   const [x, y, z] = globeIntersection.point
//   let moved =
//     x != editState.primaryPinPos.x &&
//     y != editState.primaryPinPos.y &&
//     z != editState.primaryPinPos.z
//   if (!moved) {
//     return
//   }

//   let updatedPos = { x, y, z }
//   reduxDispatch(
//     editStateActions.updateClickAndDragGlobePos(updatedPos)
//   )
// }

// const updateClickAndDragRegionBoundaryPin = (globeIntersection, globeInfo) => {
//   const [x, y, z] = globeIntersection.point
//   let currPinPos = editState.regionBoundaries.find((boundaryMarker) => boundaryMarker.id == editState.selectedPinId)
//   if (!currPinPos) {
//     throw new Error("how did you select a pin that doesn't exist?")
//   }

//   let moved =
//     x != currPinPos.x &&
//     y != currPinPos.y &&
//     z != currPinPos.z
//   if (!moved) {
//     return
//   }

//   let updatedPos = { x, y, z }
//   reduxDispatch(
//     editStateActions.updateClickAndDragGlobePos(updatedPos)
//   )

//   // Update region boundaries to trigger:
//   //  (a) updating the meshes used in mouseclick intersection calculations
//   //  (b) redrawing the region mesh
//   let updatedBoundaries = editState.regionBoundaries.map((boundaryMarker, index) => {
//     if (boundaryMarker.id == editState.selectedPinId) {
//       let updatedWhere = createWhereObjFromXYZ(x, y, z, globeInfo)
//       updatedWhere.id = boundaryMarker.id
//       return updatedWhere
//     }
//     else {
//       // Not moving this marker. Return as-is.
//       return where
//     }
//   })

//   reduxDispatch(
//     editStateActions.setRegionBoundaries(updatedBoundaries)
//   )
// }

// const updateClickAndDragRegion = (globeIntersection, globeInfo) => {
// }

export const MouseHandler = () => {
  const mouseState = useSelector((state) => state.mouseInfoReducer)
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()
  const maxClickTimeMs = 400
  const maxClickCursorMovementPx = 1

  const mouseDownWorldPosNormalizedRef = useRef()

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

  // Record mouse down position and any intersections that have already been detected in the scene.
  useEffect(() => {
    // console.log({ msg: "MouseHandler()/useEffect()/mouseState.mouseDown", value: mouseState.mouseDown })

    if (!mouseState.mouseDown) {
      return
    }

    if (mouseState.cursorRaycastIntersections.firstNonGlobe) {
      let intersection = mouseState.cursorRaycastIntersections.firstNonGlobe
      mouseDownWorldPosNormalizedRef.current = new THREE.Vector3(
        intersection.point.x,
        intersection.point.y,
        intersection.point.z
      ).normalize()

      let selectedMeshName = intersection.mesh.name
      if (selectedMeshName == meshNames.PoiPrimaryLocationPin) {
        if (editState.editModeOn) {
          console.log(`start moving '${selectedMeshName}'`)
        }
        else {
          // Ignore mouse down on the POI PoiPrimaryLocationPin when not in edit mode.
          // Note: The mouse _up_ might incur mouse "click" handling though.
        }
      }
      else if (selectedMeshName == meshNames.RegionBoundaryPin) {
        if (editState.editModeOn) {
          console.log(`start moving '${selectedMeshName}'`)
        }
        else {
          throw new Error("Should not be able to start moving a RegionBoundaryPin outside of edit mode")
        }
      }
    }


    // // enableClickAndDrag(globeIntersection, clickedMesh)
    // let selectedMeshName = mouseState.cursorRaycastIntersections.firstNonGlobe?.meshName
    // let cursorGlobePos = mouseState.cursorRaycastIntersections.globe?.point

    // if (selectedMeshName && cursorGlobePos) {
    //   if (selectedMeshName == meshNames.PoiPrimaryLocationPin) {
    //     if (editState.editModeOn) {
    //       console.log(`start moving '${selectedMeshName}' to '${cursorGlobePos}'`)
    //     }
    //     else {
    //       // Ignore mouse down on the POI PoiPrimaryLocationPin when not in edit mode.
    //       // Note: The mouse _up_ might incur mouse "click" handling though.
    //     }
    //   }
    //   else if (selectedMeshName == meshNames.RegionBoundaryPin) {
    //     if (editState.editModeOn) {
    //       console.log(`start moving '${selectedMeshName}' to '${cursorGlobePos}'`)
    //     }
    //     else {
    //       throw new Error("Should not be able to start moving a RegionBoundaryPin outside of edit mode")
    //     }
    //   }
    // }
  }, [mouseState.mouseDown])

  // Determine if "mouse up" is short enough to be considered a "click" (and what to do if it is).
  useEffect(() => {
    // console.log({ msg: "MouseHandler()/useEffect()/mouseState.mouseUp", value: mouseState.mouseUp })

    if (!mouseState.mouseUp) {
      return
    }

    mouseDownWorldPosNormalizedRef.current = null

    let mouseUp = mouseState.mouseUp
    let mouseDown = mouseState.mouseDown
    let timeDiffMs = mouseUp.timeMs - mouseDown.timeMs
    let xDiff = Math.abs(mouseUp.pos.x - mouseDown.pos.x)
    let yDiff = Math.abs(mouseUp.pos.y - mouseDown.pos.y)
    let clicked = timeDiffMs < maxClickTimeMs && xDiff < maxClickCursorMovementPx && yDiff < maxClickCursorMovementPx
    if (clicked) {
      let selectedMeshName = mouseState.cursorRaycastIntersections.firstNonGlobe?.mesh.name
      let cursorGlobePos = mouseState.cursorRaycastIntersections.globe?.point
      if (editState.editModeOn && !editState.primaryPinPos && !selectedMeshName && cursorGlobePos) {
        // Edit mode: No region selected and clicked a blank part of the globe.
        console.log("clicked: create new region")
        createNewRegion(cursorGlobePos, globeInfo)
      }
      else if (selectedMeshName) {
        console.log(`clicked on mesh: '${selectedMeshName}'`)
      }
    }

    // Turn off click-and-drag
    if (editState.clickAndDrag) {
      reduxDispatch(
        editStateActions.disableClickAndDrag()
      )
    }

    // Reset mouse click.
    reduxDispatch(
      mouseStateActions.resetMouseUpDown()
    )
  }, [mouseState.mouseUp])

  // Create rotation quaternion between mouse down pos and curr mouse pos.
  useEffect(() => {
    // console.log({ msg: "MouseHandler()/useEffect()/mouseState.currPos", value: mouseState.currPos })

    let currTimeMs = (new Date()).getTime()

    let clickAndDrag = editState.editModeOn &&         // edit mode
      mouseDownWorldPosNormalizedRef.current &&        // clicked on a mesh (implicitly)
      mouseState.cursorRaycastIntersections.globe &&   // mouse is over the globe
      currTimeMs > maxClickTimeMs  // clicked long enough to not be mistaken for a regular click
    if (clickAndDrag) {
      let vFrom = mouseDownWorldPosNormalizedRef.current
      let currWorldPos = mouseState.cursorRaycastIntersections.globe.point
      let vTo = new THREE.Vector3(
        currWorldPos.x,
        currWorldPos.y,
        currWorldPos.z,
      ).normalize()

      let q = (new THREE.Quaternion()).setFromUnitVectors(vFrom, vTo)

      if (editState.clickAndDrag) {
        // Update

        // Update selected mesh position
        reduxDispatch(
          editStateActions.updateClickAndDrag({
            rotorQuaternion: {
              w: q.w,
              x: q.x,
              y: q.y,
              z: q.z,
            }
          })
        )

        console.log("----------")

        // // Trigger mesh move and region recalculation
        // reduxDispatch(
        //   editStateActions.regionBoundaryPinHasMoved()
        // )

        // if (editState.clickAndDrag.mesh.name == meshNames.Region) {
        //   // Move all pins
        // }
        // else if (editState.clickAndDrag.mesh.name == meshNames.RegionBoundaryPin) {
        // }
        // else if (editState.clickAndDrag.mesh.name == meshNames.PoiPrimaryLocationPin) {

        // }

        // if (editState.clickAndDrag.mesh.name == meshNames.RegionBoundaryPin) {
        //   // Update region boundaries to trigger:
        //   //  (a) updating the meshes used in mouseclick intersection calculations
        //   //  (b) redrawing the region mesh
        //   let updatedBoundaries = editState.regionBoundaries.map((boundaryMarker, index) => {
        //     if (editState.clickAndDrag.mesh.userData.whereId == boundaryMarker.id) {
        //       let originJson = editState.clickAndDrag.mesh.originPos
        //       let origin = new THREE.Vector3(originJson.x, originJson.y, originJson.z)
        //       let qOffsetJson = editState.clickAndDrag.initialOffsetQuaternion
        //       let qOffset = new THREE.Quaternion(qOffsetJson.x, qOffsetJson.y, qOffsetJson.z, qOffsetJson.w)
        //       let rotor = (new THREE.Quaternion()).multiplyQuaternions(q, qOffset)
        //       let newPos = origin.clone().applyQuaternion(rotor)

        //       let updatedWhere = createWhereObjFromXYZ(newPos.x, newPos.y, newPos.z, globeInfo)
        //       updatedWhere.id = boundaryMarker.id
        //       return updatedWhere
        //     }
        //     else {
        //       // Not moving this marker. Return as-is.
        //       return boundaryMarker
        //     }
        //   })

        //   reduxDispatch(
        //     editStateActions.setRegionBoundaries(updatedBoundaries)
        //   )
        // }



        // if (editState.clickAndDrag.mesh.name == meshNames.RegionBoundaryPin) {
        //   // Update region boundaries to trigger:
        //   //  (a) updating the meshes used in mouseclick intersection calculations
        //   //  (b) redrawing the region mesh
        //   let updatedBoundaries = editState.regionBoundaries.map((boundaryMarker, index) => {
        //     let thing = editState.clickAndDrag
        //     if (editState.clickAndDrag.mesh.userData.whereId == boundaryMarker.id) {
        //       // console.log("found it")

        //       let updatedWhere = createWhereObjFromXYZ(x, y, z, globeInfo)
        //       updatedWhere.id = boundaryMarker.id
        //       return updatedWhere
        //     }
        //     // if (boundaryMarker.id == editState.selectedPinId) {
        //     //   let updatedWhere = createWhereObjFromXYZ(x, y, z, globeInfo)
        //     //   updatedWhere.id = boundaryMarker.id
        //     //   return updatedWhere
        //     // }
        //     // else {
        //     //   // Not moving this marker. Return as-is.
        //     //   return where
        //     // }
        //   })
        //   // reduxDispatch(
        //   //   editStateActions.setRegionBoundaries(updatedBoundaries)
        //   // )
        // }


      }
      else {
        // Enable

        let globePos = mouseState.cursorRaycastIntersections.globe.point
        let globePosNormalized = (new THREE.Vector3(globePos.x, globePos.y, globePos.z)).normalize()

        let meshIntersection = mouseState.cursorRaycastIntersections.firstNonGlobe;
        let cursorPos = meshIntersection.point
        let cursorPosNormalized = (new THREE.Vector3(cursorPos.x, cursorPos.y, cursorPos.z)).normalize()

        let qOffset = (new THREE.Quaternion).setFromUnitVectors(globePosNormalized, cursorPosNormalized)

        reduxDispatch(
          editStateActions.enableClickAndDrag({
            mesh: meshIntersection.mesh,
            initialOffsetQuaternion: {
              w: qOffset.w,
              x: qOffset.x,
              y: qOffset.y,
              z: qOffset.z,
            },
            rotorQuaternion: {
              w: q.w,
              x: q.x,
              y: q.y,
              z: q.z,
            }
          })
        )
      }

      // let thing = vFrom.clone().applyQuaternion(q)
      // console.log({ msg: "moving", q, vTo, thing })
    }




    // let mouseDownCursorGlobePos = mouseDownCursorIntersectionRef.current.globe.point
    // let mouseDownCurrGlobPos = mouseState.cursorRaycastIntersections.globe

    // console.log({ selectedMeshName, cursorGlobePos })

  }, [mouseState.currPos])

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

