import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { poiStateActions } from "../AppState/stateSlicePoi"
import { editStateActions } from "../AppState/stateSliceEditPoi"
import { intersectableMeshesStateActions } from "../AppState/stateSliceIntersectableMeshes"
import * as THREE from "three"
import { Globe } from "./Globe"
import { AnimatedBarMesh } from "./AnimatedBarMesh"
import { globeInfo, meshNames, groupNames } from "./constValues"
import { EditRegion, Region } from "./Region"
import { ConvertLatLongToVec3, ConvertLatLongToXYZ, ConvertXYZToLatLong } from "./convertLatLongXYZ"
import { Box, Stars } from "@react-three/drei"
import { PinMesh } from "./PinMesh"
import { v4 as uuid } from "uuid";

// Note: _Must_ be a child element of react-three/fiber "Canvas".
export function Scene(
  {
    poiInfoPopupElementRef,
    poiInfoTitleElementRef,
    mouseInfoRef
  }) {
  const poiState = useSelector((state) => state.poiReducer)
  const editState = useSelector((state) => state.editPoiReducer)
  const intersectableMeshesState = useSelector((state) => state.intersectableMeshesReducer)
  const reduxDispatch = useDispatch()

  // Not strictly HTML.
  const [poiReactElements, setPoiReactElements] = useState()
  const [editRegionReactElements, setEditRegionReactElements] = useState()

  const [intersectableMeshes, setIntersectableMeshes] = useState()

  const getThreeJsState = useThree((state) => state.get)
  const theThing = useThree((state) => state.get().scene)
  let currSelectedPoiMeshRef = useRef()

  // Create interactable ThreeJs elements out of new search results.
  useEffect(() => {
    // console.log({ msg: "Scene()/useEffect()/poiState.allPois" })

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
          <Region poiId={null} lat={info.where.lat} long={info.where.long} globePos={globeInfo.pos} />
        )
      })
    )
  }, [poiState.allPois])

  useEffect(() => {
    // console.log({ msg: "Scene()/useEffect()/editState.editModeOn", value: editState.editModeOn })

    if (editState.editModeOn) {
      setEditRegionReactElements((
        <EditRegion />
      ))
    }
    else {
      setEditRegionReactElements(null)
    }
  }, [editState.editModeOn])

  // Get the interactable meshes for the raycaster
  // Note: Once the interactable POIs are part of the scene, get a collection of them for the 
  // raycaster to analyze every frame.
  useEffect(() => {
    console.log({ msg: "Scene()/useEffect()/intersectable meshes changed" })

    const intersectableMeshArr = []
    const addMeshesToCollection = (components) => {
      // components.forEach((component) => {
      //   console.log({ name: component.name, type: component.type, children: component.children })
      // })
      // console.log("add meshes to collection")
      components.forEach((component) => {
        // console.log(component.name)
        if (component.type == "Group") {
          if (component.children.length > 0) {
            addMeshesToCollection(component.children)
          }
        }
        else if (component.type == "Mesh") {
          // console.log({ name: component.name, type: component.type })
          if (component.name != meshNames.Stars && component.name != meshNames.GlobeAtmosphere) {
            // console.log({ msg: "found a mesh", component: component })
            intersectableMeshArr.push(component)
          }
        }
      })
    }
    addMeshesToCollection(getThreeJsState().scene.children)
    console.log({ intersectableMeshArr: intersectableMeshArr })
    setIntersectableMeshes(intersectableMeshArr)
  }, [poiReactElements, editState.editRegionInitialized])


  // Update POI highlight.
  // Note: This useEffect() will only trigger (if I got this right) _after_ allPois and the 
  // follow-up poiReactElements are created, so they should all be there.
  useEffect(() => {
    // console.log({ msg: "Scene()/useEffect()/poiState.selectedPoi", value: poiState.selectedPoi })

    if (poiState.selectedPoi) {
      // Should have exactly 1 matching element.
      // Note: If there is more or less than 1 with the same guid, then there is a problem.
      let result = intersectableMeshes.filter((mesh) => mesh.userData.poiInfoJson?.myUniqueId == poiState.selectedPoi.myUniqueId)
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
      let result = intersectableMeshes.filter((mesh) => mesh.userData.poiInfoJson?.myUniqueId == poiState.prevSelectedPoi.myUniqueId)
      let selectedPoiMesh = result[0]

      // Fade out the previously selected item.
      //??use GSAP somehow??
      selectedPoiMesh.material.color = selectedPoiMesh.userData.originalColor
      selectedPoiMesh.material.opacity = selectedPoiMesh.userData.originalOpacity
    }

  }, [poiState.selectedPoi])

  // Handle mouse hover and mouse click.
  let prevMouseHoverPoiMeshRef = useRef()
  useFrame((state) => {
    // console.log("useFrame()")

    // Construction of the React elements and ThreeJs meshes may take a few frames. Wait.
    if (intersectableMeshes == null || poiInfoPopupElementRef.current == null) {
      return
    }

    // Only consider "mouse hover" intersections that are:
    // 1. Not the globe
    // 2. Not behind the globe
    // Note: Intersections are organized by increasing distance, making item 0 the closest.
    let mouseHoverPoiMesh = null
    state.raycaster.setFromCamera(mouseInfoRef.current.currPos, state.camera)
    const intersections = state.raycaster.intersectObjects(intersectableMeshes)
    if (intersections.length == 0 || intersections[0].object.name == meshNames.Stars) {
      // Mouse is in space. Ignore.
      // console.log("hover nothing")
    }
    else {
      // Take the first intersection (that is, the object closest to camera).
      let intersection = intersections[0]
      let mouseClicked = mouseInfoRef.current.mouseClickedCurrPos
      let mouseIsDown = mouseInfoRef.current.mouseIsDown

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

        if (mouseClicked) {
          if (intersection.object.name == meshNames.Globe) {
            // If no region exists yet, create one here.
            if (editState.where == null) {
              const [x, y, z] = intersection.point
              const [lat, long] = ConvertXYZToLatLong(x, y, z, globeInfo.radius)
              reduxDispatch(
                editStateActions.setLocation({
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
          // else if (intersection.object.name == meshNames.WherePin) {
          //   // Clicked a POI primary location pin.
          //   let clickedEditPin = intersection.object.userData.poiId == editState.poiId
          //   if (clickedEditPin) {
          //     reduxDispatch(
          //       editStateActions.enableClickAndDrag()
          //     )
          //   }
          //   else {
          //     // Ignore. Clicked on a POI that is not being edited.
          //   }
          // }
          // else {
          //   // Ignore. Clicked on something else.
          //   reduxDispatch(
          //     editStateActions.disableClickAndDrag()
          //   )
          // }
        }
        else if (editState.clickAndDrag) {
          if (mouseIsDown) {
            // In the middle of click-and-drag. Continue. Search all intersections for the globe 
            // and move it to the globe intersection.
            // Note: If the globe is not in the list of intersections, then the mouse has drifted
            // off the globe and onto something else (like space or starts). Ignore.
            intersections.forEach((intersection) => {
              if (intersection.object.name == meshNames.Globe) {
                reduxDispatch(
                  editStateActions.updateClickAndDrag({
                    x: intersection.point.x,
                    y: intersection.point.y,
                    z: intersection.point.z,
                  })
                )
              }
            })
          }
          else {
            // Just ended click-and-drag. 
            const { x, y, z } = editState.tentativeWhere
            const [lat, long] = ConvertXYZToLatLong(x, y, z, globeInfo.radius)

            // Set final location.
            reduxDispatch(
              editStateActions.setLocation({
                id: editState.where.id,
                lat: lat,
                long: long,
                x: x,
                y: y,
                z: z
              })
            )

            // Reset the indicator for click-and-drag.
            reduxDispatch(
              editStateActions.disableClickAndDrag()
            )
          }
        }
        else {
          // No click, but might still be busy.
          if (intersection.object.name == meshNames.WherePin && mouseIsDown) {
            let clickedEditPin = intersection.object.userData.poiId == editState.poiId
            if (clickedEditPin) {
              console.log("begin click-and-drag")
              reduxDispatch(
                editStateActions.enableClickAndDrag()
              )
            }
            else {
              // Ignore. Clicked on a POI that is not being edited.
              console.log("ignore mouse move; not the edited POI")
            }
          }


          if (intersection.object.name == meshNames.WherePin) {
            // // Hovering over a POI main pin.
            // mouseHoverPoiMesh = intersection.object
          }
          else {
            // Not hovering over anything of interest.
          }
        }
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
    let clickedSamePoiHover =
      mouseHoverPoiMesh != null && prevMouseHoverPoiMeshRef.current != null &&
      mouseHoverPoiMesh?.uuid == prevMouseHoverPoiMeshRef.current?.uuid &&
      mouseInfoRef.current.mouseClickedCurrPos

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
    mouseInfoRef.current.mouseClickedCurrPos = false
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
