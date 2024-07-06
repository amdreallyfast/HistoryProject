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
  const maxClickTimeMs = 400
  const maxClickCursorMovementPx = 1

  const mouseLeftButtonDownWorldPosNormalizedRef = useRef()

  const createNewRegion = (globePos, globeInfo) => {
    let x = globePos.x
    let y = globePos.y
    let z = globePos.z
    let spherePoint = createSpherePointFromXYZ(x, y, z, globeInfo.radius)
    reduxDispatch(
      editStateActions.setPrimaryPin(spherePoint)
    )
  }

  // Mouse down
  useEffect(() => {
    // console.log({ msg: "MouseHandler()/useEffect()/mouseState.leftMouseDown", value: mouseState.leftMouseDown })

    if (!mouseState.leftMouseDown) {
      return
    }
    // console.log({ intersection: mouseState.cursorRaycastIntersections.firstNonGlobe, globe: mouseState.cursorRaycastIntersections.globe })

    // Record mouse down position and any intersections that have already been detected in the scene.
    if (mouseState.cursorRaycastIntersections.firstNonGlobe) {
      let intersection = mouseState.cursorRaycastIntersections.firstNonGlobe
      mouseLeftButtonDownWorldPosNormalizedRef.current = new THREE.Vector3(
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
  }, [mouseState.leftMouseDown])

  // Mouse up
  useEffect(() => {
    // console.log({ msg: "MouseHandler()/useEffect()/mouseState.leftMouseUp", value: mouseState.leftMouseUp })

    if (!mouseState.leftMouseUp) {
      return
    }

    mouseLeftButtonDownWorldPosNormalizedRef.current = null

    // Determine if "mouse up" is short enough to be considered a "click" (and what to do if it is).
    let leftMouseUp = mouseState.leftMouseUp
    let leftMouseDown = mouseState.leftMouseDown
    let timeDiffMs = leftMouseUp.timeMs - leftMouseDown.timeMs
    let xDiff = Math.abs(leftMouseUp.pos.x - leftMouseDown.pos.x)
    let yDiff = Math.abs(leftMouseUp.pos.y - leftMouseDown.pos.y)
    let clicked = timeDiffMs < maxClickTimeMs && xDiff < maxClickCursorMovementPx && yDiff < maxClickCursorMovementPx
    if (clicked) {
      let selectedMeshName = mouseState.cursorRaycastIntersections.firstNonGlobe?.mesh.name
      let cursorGlobePos = mouseState.cursorRaycastIntersections.globe?.point
      if (editState.editModeOn && !editState.primaryPin && !selectedMeshName && cursorGlobePos) {
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
      mouseStateActions.resetLeftMouseUpDown()
    )
  }, [mouseState.leftMouseUp])

  // Mouse move
  useEffect(() => {
    // console.log({ msg: "MouseHandler()/useEffect()/mouseState.currPos", value: mouseState.currPos })

    let currTimeMs = (new Date()).getTime()
    let clickAndDrag = editState.editModeOn &&         // edit mode
      mouseLeftButtonDownWorldPosNormalizedRef.current &&        // implicitly clicked on a mesh
      mouseState.cursorRaycastIntersections.globe &&   // mouse is over the globe
      currTimeMs > maxClickTimeMs  // clicked long enough to not be mistaken for a regular click
    if (clickAndDrag) {
      let vFrom = mouseLeftButtonDownWorldPosNormalizedRef.current
      let currWorldPos = mouseState.cursorRaycastIntersections.globe.point
      let vTo = new THREE.Vector3(
        currWorldPos.x,
        currWorldPos.y,
        currWorldPos.z,
      ).normalize()
      let q = (new THREE.Quaternion()).setFromUnitVectors(vFrom, vTo)

      if (editState.clickAndDrag) {
        // Update selected mesh position
        let qOffsetJson = editState.clickAndDrag.initialOffsetQuaternion
        let qOffset = new THREE.Quaternion(qOffsetJson.x, qOffsetJson.y, qOffsetJson.z, qOffsetJson.w)

        let rotor = (new THREE.Quaternion()).multiplyQuaternions(q, qOffset)
        reduxDispatch(
          editStateActions.updateClickAndDrag({
            rotorQuaternion: {
              w: rotor.w,
              x: rotor.x,
              y: rotor.y,
              z: rotor.z,
            }
          })
        )

        // console.log("-------------------------")
      }
      else {
        // Enable

        // Create rotation quaternion between mouse down pos and curr mouse pos.
        // Note: There is some distance between the raycerster's intersection of the mesh on top 
        // of the globe and the globe itself. To avoid snapping the mesh to the cursor's 
        // position, account for the offset between the two points.
        let globePos = mouseState.cursorRaycastIntersections.globe.point
        let globePosNormalized = (new THREE.Vector3(globePos.x, globePos.y, globePos.z)).normalize()

        let meshIntersection = mouseState.cursorRaycastIntersections.firstNonGlobe;
        let cursorPos = meshIntersection.point
        let cursorPosNormalized = (new THREE.Vector3(cursorPos.x, cursorPos.y, cursorPos.z)).normalize()

        let qOffset = (new THREE.Quaternion).setFromUnitVectors(globePosNormalized, cursorPosNormalized)
        let rotor = (new THREE.Quaternion()).multiplyQuaternions(q, qOffset)

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
              w: rotor.w,
              x: rotor.x,
              y: rotor.y,
              z: rotor.z,
            }
          })
        )
      }
    }
  }, [mouseState.currPos])

  useEffect(() => {
    // console.log({ msg: "MouseHandler()/useEffect()/mouseState.cursorRaycastIntersections.firstNonGlobe", value: mouseState.cursorRaycastIntersections.firstNonGlobe })
    let firstIntersection = mouseState.cursorRaycastIntersections.firstNonGlobe

    // TODO: display info on hover

  }, [mouseState.cursorRaycastIntersections.firstNonGlobe])

  useEffect(() => {
    // console.log({ msg: "MouseHandler()/useEffect()/mouseState.cursorRaycastIntersections.globe", value: mouseState.cursorRaycastIntersections.globe })
    let globeIntersection = mouseState.cursorRaycastIntersections.globe

    // TODO: display info on hover

  }, [mouseState.cursorRaycastIntersections.globe])

  return (
    <>
    </>
  )
}
