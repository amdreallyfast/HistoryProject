import * as THREE from "three"
import { useEffect, useRef } from "react"
import { useSelector, useDispatch } from "react-redux"
import { mouseStateActions } from "../AppState/stateSliceMouseInfo"
import { editStateActions } from "../AppState/stateSliceEditPoi"
import { globeInfo, meshNames } from "./constValues"
import { createSpherePointFromXYZ } from "./createSpherePoint"

export const MouseHandler = () => {
  const mouseState = useSelector((state) => state.mouseInfoReducer)
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()
  const maxClickTimeMs = 200
  const maxClickCursorMovementPx = 1

  // const createNewRegion = (posOnGlobe, globeInfo) => {
  //   let x = posOnGlobe.x
  //   let y = posOnGlobe.y
  //   let z = posOnGlobe.z
  //   let spherePoint = createSpherePointFromXYZ(x, y, z, globeInfo.radius)
  //   reduxDispatch(editStateActions.setPrimaryLoc(spherePoint))
  // }

  const createNewRegion = (globeInfo) => {
    let globeIntersection = mouseState.cursorRaycasting.intersections[0]
    let relativeToGlobe = {
      x: globeIntersection.absolute.x - globeInfo.pos.x,
      y: globeIntersection.absolute.y - globeInfo.pos.y,
      z: globeIntersection.absolute.z - globeInfo.pos.z,
    }
    let spherePoint = createSpherePointFromXYZ(relativeToGlobe.x, relativeToGlobe.y, relativeToGlobe.z, globeInfo.radius)
    reduxDispatch(editStateActions.setPrimaryLoc(spherePoint))
  }

  const updateClickAndDrag = () => {
    // TODO: only "calculate mouse down relative to globe normalized" only once
    //  ??maybe? is the overhead of designing this worth the benefit of avoiding a single normalization every frame?
    let mouseDown = mouseState.leftMouseDown.intersection
    let mouseRelative = mouseDown.relativeToGlobe
    let mouseDownNormalized = new THREE.Vector3(mouseRelative.x, mouseRelative.y, mouseRelative.z).normalize()

    let globeIndex = mouseState.cursorRaycasting.globeIndex
    let cursorGlobe = mouseState.cursorRaycasting.intersections[globeIndex].relativeToGlobe
    let cursorGlobeNormalized = new THREE.Vector3(cursorGlobe.x, cursorGlobe.y, cursorGlobe.z).normalize()

    // Rotation on the globe from where the left mouse was pressed to where it is now.
    let qRotor = (new THREE.Quaternion()).setFromUnitVectors(mouseDownNormalized, cursorGlobeNormalized)
    let qOffsetJson = editState.clickAndDrag.initialOffsetQuaternion
    let qOffset = new THREE.Quaternion(qOffsetJson.x, qOffsetJson.y, qOffsetJson.z, qOffsetJson.w)

    let qFullRotor = (new THREE.Quaternion()).multiplyQuaternions(qRotor, qOffset)
    let rotorData = {
      rotorQuaternion: {
        w: qFullRotor.w,
        x: qFullRotor.x,
        y: qFullRotor.y,
        z: qFullRotor.z,
      }
    }
    reduxDispatch(editStateActions.updateClickAndDrag(rotorData))
  }

  const enableClickAndDrag = () => {
    let mouseDown = mouseState.leftMouseDown.intersection
    let mouseRelative = mouseDown.relativeToGlobe
    let mouseDownNormalized = new THREE.Vector3(mouseRelative.x, mouseRelative.y, mouseRelative.z).normalize()

    let globeIndex = mouseState.cursorRaycasting.globeIndex
    let cursorGlobe = mouseState.cursorRaycasting.intersections[globeIndex].relativeToGlobe
    let cursorGlobeNormalized = new THREE.Vector3(cursorGlobe.x, cursorGlobe.y, cursorGlobe.z).normalize()

    // Rotation on the globe from where the left mouse was pressed to where it is now.
    let qRotor = (new THREE.Quaternion()).setFromUnitVectors(mouseDownNormalized, cursorGlobeNormalized)

    // Offset rotation to account for starting click-and-drag on the pin bounding box.
    // Note: There is some distance between the raycaster's intersection of the pin bounding box 
    // mesh (on the surface of the globe) and the globe itself. To avoid snapping the origin of 
    // the mesh to the cursor's position, account for the offset between the two points.
    // Also Note: If the mesh under the cursor at the time of enabling is the globe (possible if 
    // the cursor is moved quickly after clicking the pin), then the offset will be 0.
    let meshIntersection = mouseState.cursorRaycasting.intersections[0]
    let relative = meshIntersection.relativeToGlobe
    let meshIntersectionNormalized = new THREE.Vector3(relative.x, relative.y, relative.z).normalize()

    let qOffset = (new THREE.Quaternion).setFromUnitVectors(cursorGlobeNormalized, meshIntersectionNormalized)
    let qFullRotor = (new THREE.Quaternion()).multiplyQuaternions(qRotor, qOffset)
    let clickAndDragData = {
      mesh: mouseDown.mesh,
      initialOffsetQuaternion: {
        w: qOffset.w,
        x: qOffset.x,
        y: qOffset.y,
        z: qOffset.z,
      },
      rotorQuaternion: {
        w: qFullRotor.w,
        x: qFullRotor.x,
        y: qFullRotor.y,
        z: qFullRotor.z,
      }
    }
    reduxDispatch(editStateActions.enableClickAndDrag(clickAndDragData))
  }



  // Fast local flags to avoid race conditions.
  // Problem: A race condition was encountered (8/9/2024) in which the "mouse up" and "mouse move"
  // handlers were called on the same frame, and the former tries to turn click-and-drag off, but
  // the latter tries to update it or turn it on. State values are not updated until the next
  // frame.
  // Solution: Use a local reference. It can be updated immediately and can be used int he scope 
  // of both handlers.
  const clickAndDragEnabledRef = useRef(false)
  const leftMouseDownRef = useRef(false)

  // Left mouse down
  useEffect(() => {
    // console.log({ "MouseHandler useEffect mouseState.leftMouseDown": mouseState.leftMouseDown })

    if (!mouseState.leftMouseDown) {
      return
    }

    // let intersection = mouseState.leftMouseDown.intersection
    // if (intersection.mesh.name == meshNames.PinBoundingBox) {
    //   if (mouseState.leftMouseDown.intersection) {
    //     reduxDispatch(editStateActions.setSelectedPinId(intersection.mesh.userData.locationId))
    //   }
    //   else {
    //     reduxDispatch(editStateActions.setSelectedPinId(null))
    //   }
    // }

    // On pin click, select that location. Elsewhere, de-select.

    let clickedPin = mouseState.leftMouseDown.intersection?.mesh.name == meshNames.PinBoundingBox
    if (clickedPin) {
      let locId = mouseState.leftMouseDown.intersection.mesh.userData.locationId
      reduxDispatch(mouseStateActions.setSelectedLocId(locId))
    }
    // else {
    //   reduxDispatch(mouseStateActions.setSelectedLocId(null))
    // }


    leftMouseDownRef.current = true
  }, [mouseState.leftMouseDown])

  // Mouse up
  useEffect(() => {
    // console.log({ "MouseHandler useEffect mouseState.leftMouseUp": mouseState.leftMouseUp })

    if (!mouseState.leftMouseUp || !mouseState.leftMouseDown) {
      // Watch for mouse up without a mouse down.
      // Corner case: If you start the program and immediately try to load an image by 
      // double-clicking in the "browse" dialog, the selection will register on the second mouse 
      // down (not up), and then the mouse up is caught by the program, triggering this 
      // useEffect(...) without a corresponding mouse down.
      return
    }

    // Determine if "mouse up" is short enough to be considered a "click" (and what to do if it is).
    let leftMouseUp = mouseState.leftMouseUp
    let leftMouseDown = mouseState.leftMouseDown
    let timeDiffMs = leftMouseUp.timeMs - leftMouseDown.timeMs
    let xDiff = Math.abs(leftMouseUp.pos.x - leftMouseDown.pos.x)
    let yDiff = Math.abs(leftMouseUp.pos.y - leftMouseDown.pos.y)
    let clicked = timeDiffMs < maxClickTimeMs && xDiff < maxClickCursorMovementPx && yDiff < maxClickCursorMovementPx
    if (clicked) {
      // On globe click, (potentially) create new region
      let clickedGlobe = (mouseState.cursorRaycasting.globeIndex == 0)
      let noRegionCreated = !editState.primaryLoc
      if (editState.editModeOn && clickedGlobe && noRegionCreated) {
        createNewRegion(globeInfo)
      }

      // If you didn't click a location pin, de-select.
      let clickedPin = leftMouseDown.intersection?.mesh.name == meshNames.PinBoundingBox
      if (!clickedPin) {
        reduxDispatch(mouseStateActions.setSelectedLocId(null))
      }
    }

    // Turn off click-and-drag
    if (editState.clickAndDrag) {
      reduxDispatch(editStateActions.disableClickAndDrag())
      clickAndDragEnabledRef.current = false
    }

    // Reset mouse click.
    reduxDispatch(mouseStateActions.resetLeftMouse())

    leftMouseDownRef.current = false
  }, [mouseState.leftMouseUp])

  // Mouse move (click-and-drag)
  useEffect(() => {
    // console.log({ "MouseHandler useEffect mouseState.currPos": mouseState.currPos })

    if (!editState.editModeOn) {
      // Do not allow click-and-drag.
      return
    }
    else if (!mouseState.leftMouseDown?.intersection) {
      // Nothing selected
      return
    }
    else if (!leftMouseDownRef.current) {
      // Race condition. See variable description for details.
      return
    }
    else if (mouseState.cursorRaycasting.globeIndex < 0) {
      // Cursor is not over the globe, so we can't click-and-drag the mesh to a new location.
      return
    }

    let clickTimeMs = (new Date()).getTime() - mouseState.leftMouseDown.timeMs
    if (clickTimeMs < maxClickTimeMs) {
      // Too soon.
      return
    }

    if (clickAndDragEnabledRef.current) {
      updateClickAndDrag()
      return
    }
    else {
      let pinSelected = mouseState.leftMouseDown.intersection.mesh.name == meshNames.PinBoundingBox
      let regionSelected = mouseState.leftMouseDown.intersection.mesh.name == meshNames.Region
      if (pinSelected || regionSelected) {
        enableClickAndDrag()
        clickAndDragEnabledRef.current = true
      }
    }
  }, [mouseState.currPos])

  // Need to return some HTML so simply that this can be a component.
  return (
    <>
    </>
  )
}
