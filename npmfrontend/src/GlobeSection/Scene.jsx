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
import _ from "lodash"

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


  // Create interactable ThreeJs elements out of new search results.
  useEffect(() => {
    console.log({ msg: "Scene()/useEffect()/poiState.allPois", value: poiState.allPois })

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
        <EditRegion />
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
    // console.log({ msg: "Scene()/useEffect()/meshes changed", where: editState.preciseLocation, regionBoundaries: editState.regionBoundaries })

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

  }, [poiReactElements, editState.preciseLocationPinMeshExists, editState.regionBoundariesPinMeshCount])

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
      let globeInsersection = intersections.find((intersection) => intersection.object.name == meshNames.Globe)
      let firstIntersection = intersections[0]

      // // Take the first intersection (that is, the object closest to camera).
      // let intersection = intersections[0]

      // TODO: handle scenarios:
      //  1. No location exists yet (new entry)
      //    => set location
      //  2. Clicked on "where" pin
      //    => click to drag
      //    ??how to set location on mouse release??
      //  3. Clicked on region point
      //    => click to drag
      //    ??how to set location on mouse release??
      //  4. Else location exists, but didn't click on any "where" pin or region points 
      //    => do nothing

      if (editState.editModeOn) {
        // Editing. Only affect the edited object, but still allow hovering over existing objects
        // to get cursory info.


        if (mouseState.mouseClickedCurrPos) {
          if (globeInsersection) {
            // If no region exists yet, create one here.
            if (editState.preciseLocation == null) {
              const [x, y, z] = globeInsersection.point
              const [lat, long] = ConvertXYZToLatLong(x, y, z, globeInfo.radius)
              reduxDispatch(
                editStateActions.setPreciseLocation({
                  id: uuid(), // new location => new guid
                  lat: lat,
                  long: long,
                  x: x,
                  y: y,
                  z: z
                })
              )
            }
          }
        }

        //??isolate mouse click handling to a function??
        else if (mouseState.mouseIsDown && prevMouseIsDownRef.current) {
          // still clicking; if clicked a pin, continue dragging  
          if (editState.selectedPinId != null) {
            // and move it to the globe intersection.
            // Note: If the globe is not in the list of intersections, then the mouse has drifted
            // off the globe and onto something else (like space or starts). Ignore.
            if (globeInsersection) {
              reduxDispatch(
                editStateActions.updateClickAndDrag({
                  x: globeInsersection.point.x,
                  y: globeInsersection.point.y,
                  z: globeInsersection.point.z,
                })
              )
            }
          }
        }
        else if (mouseState.mouseIsDown && !prevMouseIsDownRef.current) {
          // new click
          // Enable click-and-drag if the user selected one of the pins being edited.

          let samePos = _.isEqual(mouseState.currPos, mouseState.mouseDownPos)
          console.log({ same: samePos })

          let obj = firstIntersection.object
          console.log({ obj: obj.name })
          if (obj.name == meshNames.WherePin || obj.name == meshNames.RegionBoundaryPin) {

            console.log({ msg: "pin", obj: obj })

            // console.log({ msg: "clicked WherePin or RegionBoundaryPin" })
            // console.log({ msg: "clicked RegionBoundaryPin" })
            reduxDispatch(
              editStateActions.enableClickAndDrag({ pinId: firstIntersection.object.userData.whereId })
            )
          }

        }
        else if (!mouseState.mouseIsDown && prevMouseIsDownRef.current) {
          // just stopped clicking

          if (editState.clickAndDrag) {
            // Done with click-and-drag. Disable.
            reduxDispatch(
              editStateActions.disableClickAndDrag()
            )
          }
        }
        else {
          // mouse is not down, and not clicking previously
          if (firstIntersection.object.name == meshNames.WherePin) {
            // // Hovering over a POI main pin.
            // mouseHoverPoiMesh = intersection.object
          }
          else {
            // Not hovering over anything of interest.
          }
        }

        // }

        // else if (mouseState.mouseIsDown) {

        //   if (prevMouseIsDownRef.current) {
        //     // still clicking; if clicked a pin, continue dragging

        //   }
        //   else {
        //     // new click
        //   }


        //   if (editState.clickAndDrag) {
        //     // In the middle of click-and-drag. Continue. Search all intersections for the globe 
        //     // and move it to the globe intersection.
        //     // Note: If the globe is not in the list of intersections, then the mouse has drifted
        //     // off the globe and onto something else (like space or starts). Ignore.
        //     intersections.forEach((intersection) => {
        //       if (intersection.object.name == meshNames.Globe) {
        //         reduxDispatch(
        //           editStateActions.updateClickAndDrag({
        //             x: intersection.point.x,
        //             y: intersection.point.y,
        //             z: intersection.point.z,
        //           })
        //         )
        //       }
        //     })
        //   }
        //   else {

        //     // TODO
        //     //  ??implement "prevMouseIsDown" to determine whether the mouse is clicked over the mesh or just moved over it??

        //     // Enable click-and-drag if the user selected one of the pins being edited.
        //     let obj = intersection.object
        //     if (obj.name == meshNames.WherePin || obj.name == meshNames.RegionBoundaryPin) {
        //       // console.log({ msg: "clicked WherePin or RegionBoundaryPin" })
        //       // console.log({ msg: "clicked RegionBoundaryPin" })
        //       reduxDispatch(
        //         editStateActions.enableClickAndDrag({ pinId: intersection.object.userData.whereId })
        //       )
        //     }
        //     // else {
        //     //   console.log({ msg: "clicked something else", name: obj.name })
        //     // }
        //   }
        // }

        // else if (!mouseIsDown && editState.clickAndDrag) {
        //   // Done with click-and-drag. Disable.
        //   reduxDispatch(
        //     editStateActions.disableClickAndDrag()
        //   )
        // }
        // else {
        //   // No click, but might still be busy.


        //   if (intersection.object.name == meshNames.WherePin) {
        //     // // Hovering over a POI main pin.
        //     // mouseHoverPoiMesh = intersection.object
        //   }
        //   else {
        //     // Not hovering over anything of interest.
        //   }
        // }
      }

      prevMouseIsDownRef.current = mouseState.mouseIsDown
    } // useFrame

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
      <Stars />
      <Globe globeRadius={globeInfo.radius} />
      <group name={groupNames.PoiGroup}>
        {poiReactElements}
      </group>
      <group name={groupNames.EditRegionGroup}>
        {editRegionReactElements}
      </group>
    </>
  )
}
