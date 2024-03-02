import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { poiStateActions } from "../AppState/stateSlicePoi"
import { editStateActions } from "../AppState/stateSliceEditPoi"
import * as THREE from "three"
import { Globe } from "./Globe"
import { AnimatedBarMesh } from "./AnimatedBarMesh"
import { globeInfo, meshNames, groupNames } from "./constValues"
import { EditRegion, ShowRegion } from "./Region"
import { ConvertLatLongToVec3, ConvertLatLongToXYZ, ConvertXYZToLatLong } from "./convertLatLongXYZ"
import { Box, Stars } from "@react-three/drei"
import { PinMesh } from "./PinMesh"
import { v4 as uuid } from "uuid";
import _, { first, update } from "lodash"
import { createWhereObjFromXYZ } from "./createWhere"
import { mouseStateActions } from "../AppState/stateSliceMouseInfo"
import { MouseHandler } from "./MouseHandler"

// Extract only what is needed for the state machine.
// Note: An object with functions cannot be stored as state. Need to extract the values 
// manually and construct a new JSON object with this info.
const parseIntersectionForState = (intersection) => {
  return {
    point: {
      x: intersection.point.x,
      y: intersection.point.y,
      z: intersection.point.z,
    },
    mesh: {
      name: intersection.object.name,
      uuid: intersection.object.uuid,
      pos: {
        x: intersection.object.position.x,
        y: intersection.object.position.y,
        z: intersection.object.position.z,
      },
      userData: {
        poi: intersection.object.userData?.poiId,
        whereId: intersection.object.userData?.whereId,
      }
    }
  }
}

// Note: _Must_ be a child element of react-three/fiber "Canvas".
export function Scene(
  {
    poiInfoPopupElementRef,
    poiInfoTitleElementRef
  }) {
  const mouseState = useSelector((state) => state.mouseInfoReducer)
  const poiState = useSelector((state) => state.poiReducer)
  const editState = useSelector((state) => state.editPoiReducer)

  const reduxDispatch = useDispatch()

  // Not strictly HTML.
  const [poiReactElements, setPoiReactElements] = useState()
  const [editRegionReactElements, setEditRegionReactElements] = useState()

  const [meshes, setMeshes] = useState()
  const getThreeJsState = useThree((state) => state.get)
  let currSelectedPoiMeshRef = useRef()

  const earthGlobeInfo = globeInfo

  // Create interactable ThreeJs elements out of new search results.
  useEffect(() => {
    // console.log({ msg: "Scene()/useEffect()/poiState.allPois", value: poiState.allPois })

    let poiInfo = []
    poiState.allPois?.forEach((poi) => {
      // skip any item being edited
      if (poi.id != editState.poiId) {
        poiInfo.push({
          id: poi.id,
          where: poi.where
        })
      }
    })

    setPoiReactElements(
      poiInfo.map((info, index) => {
        return (
          <ShowRegion poiId={null} lat={info.where.lat} long={info.where.long} globePos={globeInfo.pos} />
        )
      })
    )
  }, [poiState.allPois])

  // If "edit mode" on, create an editable region for the edited POI.
  useEffect(() => {
    // console.log({ msg: "Scene()/useEffect()/editState.editModeOn", value: editState.editModeOn })

    if (editState.editModeOn) {
      // TODO: set edit state info to current POI info
      setEditRegionReactElements((
        <EditRegion globeInfo={earthGlobeInfo} />
      ))
    }
    else {
      setEditRegionReactElements(null)
    }
  }, [editState.editModeOn])

  // Extract meshes from various groups so that it is easy to filter them.
  // Note: It is more efficient to find these only when the mesh collections change rather than 
  // doing it every frame just before the raycaster runs.
  useEffect(() => {
    // console.log({ msg: "Scene()/useEffect()/meshes changed", where: editState.primaryPinPos, regionBoundaries: editState.regionBoundaries })

    const meshesArr = []

    // Recursive
    const findMeshes = (components) => {
      components.forEach((component) => {
        if (component.type == "Group") {
          if (component.children.length > 0) {
            findMeshes(component.children)
          }
        }
        else if (component.type == "Mesh") {
          if (component.name != meshNames.Stars && component.name != meshNames.GlobeAtmosphere) {
            meshesArr.push(component)
          }
        }
      })
    }

    findMeshes(getThreeJsState().scene.children)
    // console.log({ interactableMeshes: meshesArr })
    setMeshes(meshesArr)

  }, [poiReactElements, editState.primaryPinMeshExists, editState.regionBoundaries])

  // Update POI highlight.
  // Note: This useEffect() will only trigger (if I got this right) _after_ allPois and the 
  // follow-up poiReactElements are created, so they should all be there.
  useEffect(() => {
    // console.log({ msg: "Scene()/useEffect()/poiState.selectedPoi", value: poiState.selectedPoi })

    if (poiState.selectedPoi) {
      // Should have exactly 1 matching element.
      // Note: If there is more or less than 1 with the same guid, then there is a problem.
      let result = meshes.filter((mesh) => mesh.userData?.poiInfoJson?.myUniqueId == poiState.selectedPoi.myUniqueId)
      let selectedPoiMesh = result[0]

      // Fade in the new selected item.
      //??use GSAP somehow??
      selectedPoiMesh.material.color = selectedPoiMesh.userData.highlightColor
      selectedPoiMesh.material.opacity = selectedPoiMesh.userData.highlightOpacity

      // Record for later use during "useFrame".
      currSelectedPoiMeshRef.current = selectedPoiMesh
    }

    if (poiState.prevSelectedPoi) {
      // let prevSelectedEement = document.getElementById(poiState.prevSelectedPoi.myUniqueId)
      let result = meshes.filter((mesh) => mesh.userData.poiInfoJson?.myUniqueId == poiState.prevSelectedPoi.myUniqueId)
      let selectedPoiMesh = result[0]

      // Fade out the previously selected item.
      //??use GSAP somehow??
      selectedPoiMesh.material.color = selectedPoiMesh.userData.originalColor
      selectedPoiMesh.material.opacity = selectedPoiMesh.userData.originalOpacity
    }

  }, [poiState.selectedPoi])

  // Handle mouse hover and mouse click.
  let prevMouseIsDownRef = useRef(false)
  let prevMouseHoverPoiMeshRef = useRef()

  // Determine cursor intersections
  useFrame((state) => {
    // console.log("useFrame()")

    // Construction of the React elements and ThreeJs meshes may take a few frames. Wait.
    if (meshes == null || poiInfoPopupElementRef.current == null) {
      return
    }

    // Only consider "mouse hover" intersections that are:
    // 1. Not the globe
    // 2. Not behind the globe
    // Note: Intersections are organized by increasing distance, making item 0 the closest.
    let mouseHoverPoiMesh = null
    state.raycaster.setFromCamera(mouseState.currPos, state.camera)
    const intersections = state.raycaster.intersectObjects(meshes)
    if (intersections.length > 0) {
      let firstIntersection = intersections[0]
      let globeIntersection = intersections.find((intersection) => intersection.object.name == meshNames.Globe)

      if (firstIntersection.object.name == meshNames.Globe) {
        reduxDispatch(
          mouseStateActions.setCursorRaycastIntersections({
            firstNonGlobe: null,
            globe: parseIntersectionForState(firstIntersection)
          })
        )
      }
      else if (globeIntersection) {
        reduxDispatch(
          mouseStateActions.setCursorRaycastIntersections({
            firstNonGlobe: parseIntersectionForState(firstIntersection),
            globe: parseIntersectionForState(globeIntersection)
          })
        )
      }
      else {
        // Mesh intersection, but not with globe. The mouse must be hovering over open space 
        // (maybe a mesh on the edge of the hemisphere?)
        reduxDispatch(
          mouseStateActions.setCursorRaycastIntersections({
            firstNonGlobe: parseIntersectionForState(firstIntersection),
            globe: null
          })
        )
      }
    }
    else {
      // De-activate the cursor intersections, but only if they are on. Don't incur excess events.
      if (mouseState.cursorRaycastIntersections.first || mouseState.cursorRaycastIntersections.globe) {
        reduxDispatch(
          mouseStateActions.resetCursorRaycastIntersections()
        )
      }
    }

    // Occurs when the mouse drifts from the world (or space) to a POI.
    let newPoiHover =
      mouseHoverPoiMesh != null && prevMouseHoverPoiMeshRef.current == null

    // Occurs when the mouse drifts from a POI to the world (or space).
    let leavingPoiHover =
      mouseHoverPoiMesh == null && prevMouseHoverPoiMeshRef.current != null

    // Occurs when the mouse drifts from one POI to another without going through open space 
    // in-between. Need to shift focus w/out turning off the info popup.
    let changingPoiHover =
      mouseHoverPoiMesh != null && prevMouseHoverPoiMeshRef.current != null &&
      mouseHoverPoiMesh?.uuid != prevMouseHoverPoiMeshRef.current?.uuid

    // Occurs when the mouse is stationary over a POI and is clicked. Creates new selectedPoi.
    // let clickedSamePoiHover =
    //   mouseHoverPoiMesh != null && prevMouseHoverPoiMeshRef.current != null &&
    //   mouseHoverPoiMesh?.uuid == prevMouseHoverPoiMeshRef.current?.uuid &&
    //   mouseInfoRef.current.mouseClickedCurrPos
    let clickedSamePoiHover =
      mouseHoverPoiMesh != null && prevMouseHoverPoiMeshRef.current != null &&
      mouseHoverPoiMesh?.uuid == prevMouseHoverPoiMeshRef.current?.uuid

    if (newPoiHover) {
      // console.log({ msg: "newPoiHover" })

      // Turn on the popup.
      //??use GSAP somehow??
      poiInfoPopupElementRef.current.style.display = "block"
      poiInfoTitleElementRef.current.innerHTML = mouseHoverPoiMesh.userData.poiInfoJson.name.common

      // Fade-in a highlight of the hovered item.
      // Note: Ignore if it is the currently selected POI. Leave that alone.
      if (mouseHoverPoiMesh.uuid != currSelectedPoiMeshRef.current?.uuid) {
        //??use GSAP somehow??
        mouseHoverPoiMesh.material.opacity = 1.0
      }
    }
    else if (leavingPoiHover) {
      // console.log({ msg: "leavingPoiHover" })

      // Turn off the popup
      //??use GSAP somehow??
      poiInfoPopupElementRef.current.style.display = "none"

      // Fade-out the POI highlight.
      // Note: Ignore if it was the currently selected POI. Leave that alone.
      if (prevMouseHoverPoiMeshRef.current.uuid != currSelectedPoiMeshRef.current?.uuid) {
        //??use GSAP somehow??
        prevMouseHoverPoiMeshRef.current.material.opacity = prevMouseHoverPoiMeshRef.current.userData.originalOpacity
      }
    }
    else if (changingPoiHover) {
      // console.log({ msg: "changingPoiHover" })

      // Change the popup's info:
      //??use GSAP somehow??
      poiInfoTitleElementRef.current.innerHTML = mouseHoverPoiMesh.userData.poiInfoJson.name.common

      // Fade in the new
      //??use GSAP somehow??
      mouseHoverPoiMesh.material.opacity = mouseHoverPoiMesh.userData.highlightOpacity

      // Fade out the old (unless it's the currently selected POI).
      if (prevMouseHoverPoiMeshRef.current.uuid != currSelectedPoiMeshRef.current?.uuid) {
        //??use GSAP somehow??
        prevMouseHoverPoiMeshRef.current.material.opacity = prevMouseHoverPoiMeshRef.current.userData.originalOpacity
      }
    }
    else if (clickedSamePoiHover) {
      console.log({ msg: "clickedSamePoiHover" })

      if (mouseHoverPoiMesh.uuid == currSelectedPoiMeshRef.current?.uuid) {
        // The currently selected item is clicked again => de-selected
        currSelectedPoiMeshRef.current = null
        reduxDispatch(setSelectedPoi(null))
      }
      else {
        // A new item is clicked.
        currSelectedPoiMeshRef.current = mouseHoverPoiMesh
        reduxDispatch(setSelectedPoi(mouseHoverPoiMesh.userData.poiInfoJson))
      }
    }
    else {
      // Not hovering over any POI. Ignore.
      // console.log("no POI hover")
    }

    // End of frame. Mouse handling done.
    prevMouseHoverPoiMeshRef.current = mouseHoverPoiMesh
    // mouseInfoRef.current.mouseClickedCurrPos = false
  })

  return (
    <>
      <MouseHandler />
      <Stars />
      <Globe globeRadius={earthGlobeInfo.radius} />
      <group name={groupNames.PoiGroup}>
        {poiReactElements}
      </group>
      <group name={groupNames.EditRegionGroup}>
        {editRegionReactElements}
      </group>
    </>
  )
}
