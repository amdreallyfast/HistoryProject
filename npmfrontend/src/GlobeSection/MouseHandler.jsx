import * as THREE from "three"
import { v4 as uuid } from "uuid"
import { useSelector, useDispatch } from "react-redux"
import { mouseStateActions } from "../AppState/stateSliceMouseInfo"
import { ConvertXYZToLatLong } from "./convertLatLongXYZ"
import { globeInfo, meshNames } from "./constValues"
import { editStateActions } from "../AppState/stateSliceEditPoi"
import { useEffect, useRef } from "react"

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

  // Mouse down
  useEffect(() => {
    // console.log({ msg: "MouseHandler()/useEffect()/mouseState.mouseDown", value: mouseState.mouseDown })

    if (!mouseState.mouseDown) {
      return
    }
    console.log({ intersection: mouseState.cursorRaycastIntersections.firstNonGlobe, globe: mouseState.cursorRaycastIntersections.globe })


    // Record mouse down position and any intersections that have already been detected in the scene.
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
  }, [mouseState.mouseDown])

  // Mouse up
  useEffect(() => {
    // console.log({ msg: "MouseHandler()/useEffect()/mouseState.mouseUp", value: mouseState.mouseUp })

    if (!mouseState.mouseUp) {
      return
    }

    mouseDownWorldPosNormalizedRef.current = null

    // Determine if "mouse up" is short enough to be considered a "click" (and what to do if it is).
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

  // Mouse move
  useEffect(() => {
    // console.log({ msg: "MouseHandler()/useEffect()/mouseState.currPos", value: mouseState.currPos })

    let currTimeMs = (new Date()).getTime()
    let clickAndDrag = editState.editModeOn &&         // edit mode
      mouseDownWorldPosNormalizedRef.current &&        // implicitly clicked on a mesh
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

        console.log("-------------------------")
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
