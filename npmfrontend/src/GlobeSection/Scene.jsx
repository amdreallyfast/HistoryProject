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
      let globeIntersection = intersections.find((intersection) => intersection.object.name == meshNames.Globe)
      let firstIntersection = intersections[0]

      if (editState.editModeOn) {
        // Editing. Only affect the edited object, but still allow hovering over existing objects
        // to get cursory info.

        if (mouseState.mouseClickedCurrPos) {
          console.log("mouseClickedCurrPos")
        }

        if (globeIntersection) {
          console.log("globeIntersection")
        }

        if (!editState.primaryPinPos) {
          console.log("no location")
        }

        if (mouseState.mouseClickedCurrPos && globeIntersection && editState.primaryPinPos == null) {
          console.log("clicked curr position")

          // No editable region yet. Make one where the click happened.
          const [x, y, z] = globeIntersection.point
          const [lat, long] = ConvertXYZToLatLong(x, y, z, globeInfo.radius)
          reduxDispatch(
            editStateActions.setPrimaryPinPos({
              id: uuid(), // new location => new guid
              lat: lat,
              long: long,
              x: x,
              y: y,
              z: z
            })
          )
        }
        else if (mouseState.mouseIsDown && !prevMouseIsDownRef.current) {
          // new click
          // Enable click-and-drag if the user select one of the pins being edited.
          console.log("mouse started clicking")

          // Note: Don't even try if the mouse is not over the globe.
          if (globeIntersection) {
            let obj = firstIntersection.object
            if (obj.name == meshNames.PoiPrimaryLocationPin || obj.name == meshNames.RegionBoundaryPin) {

              // // Click and drag where you clicked the mesh.
              // // Note: Our point of reference for the movement will be the intersection with the globe's surface.
              // let globeIntersectionOffset = (new THREE.Vector3()).subVectors(firstIntersection.point, globeIntersection)

              // let intersectionPointFlattenedToGlobe = new THREE.Vector3(
              //   firstIntersection.point.x,
              //   firstIntersection.point.y,
              //   firstIntersection.point.z,
              // ).normalize().multiplyScalar(globeInfo.radius)
              // let meshOffset = {
              //   x: obj.position.x - intersectionPointFlattenedToGlobe.x,
              //   y: obj.position.y - intersectionPointFlattenedToGlobe.y,
              //   z: obj.position.z - intersectionPointFlattenedToGlobe.z,
              // }
              // console.log({ msg: "pin", mouse: mouseState.currPos, obj: obj.position, offset: meshOffset })

              // console.log({ msg: "clicked PoiPrimaryLocationPin or RegionBoundaryPin" })
              // console.log({ msg: "clicked RegionBoundaryPin" })
              console.log("hello?")
              reduxDispatch(
                editStateActions.enableClickAndDrag({
                  pinId: firstIntersection.object.userData.whereId,
                  startLocation: {
                    x: globeIntersection.point.x,
                    y: globeIntersection.point.y,
                    z: globeIntersection.point.z
                  },
                  // meshOffset: meshOffset
                })
              )
            }
          }
        }
        else if (mouseState.mouseIsDown && prevMouseIsDownRef.current) {
          // still clicking; continue click-and-drag
          console.log("still clicking")

          if (editState.selectedMeshName)
            if (editState.selectedPinId != null) {
              // Move the pin to the point on the globe that the mouse is hovering over

              if (!globeIntersection) {
                // Ignore. Mouse has drifted off the globe and onto space or stars.
              }
              else {
                let updatedWhere = createWhereObjFromXYZ(
                  globeIntersection.point.x,
                  globeIntersection.point.y,
                  globeIntersection.point.z,
                  globeInfo
                )
                updatedWhere.id = editState.selectedPinId

                let pinPos = null
                let regionBoundary = false
                if (editState.selectedPinId == editState.primaryPinPos.id) {
                  pinPos = editState.primaryPinPos
                }
                else {
                  // Region boundary marker
                  pinPos = editState.regionBoundaries.find((boundaryMarker) => boundaryMarker.id == editState.selectedPinId)
                  if (pinPos == null) {
                    throw new Error("how did you select a pin that doesn't exist?")
                  }
                  regionBoundary = true
                }

                // Don't move if the mouse isn't moving.
                let moved =
                  pinPos.x != globeIntersection.point.x &&
                  pinPos.y != globeIntersection.point.y &&
                  pinPos.z != globeIntersection.point.z
                if (moved) {
                  reduxDispatch(
                    editStateActions.updateClickAndDragGlobePos({
                      x: globeIntersection.point.x,
                      y: globeIntersection.point.y,
                      z: globeIntersection.point.z,
                    })
                  )

                  if (regionBoundary) {
                    // Update region boundaries to trigger 
                    //  (a) updating the meshes used in mousclick intersection calculations
                    //  (b) redrawing the region mesh
                    let updatedBoundaries = editState.regionBoundaries.map((where, index) => {
                      if (where.id == editState.selectedPinId) {
                        let updatedWhere = createWhereObjFromXYZ(
                          globeIntersection.point.x,
                          globeIntersection.point.y,
                          globeIntersection.point.z,
                          globeInfo
                        )
                        updatedWhere.id = where.id
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
                }
              }
            }
        }
        else if (!mouseState.mouseIsDown && prevMouseIsDownRef.current) {
          // just stopped clicking

          console.log("just stopped clicking")

          if (editState.clickAndDragEnabled) {
            // Done with click-and-drag. Disable.
            reduxDispatch(
              editStateActions.disableClickAndDrag()
            )
          }
        }
        else {

          // console.log({ msg: "else", selectedPinId: editState.selectedPinId })

          // mouse is not down, and not clicking previously
          if (firstIntersection.object.name == meshNames.PoiPrimaryLocationPin) {
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


        //   if (editState.clickAndDragEnabled) {
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
        //     if (obj.name == meshNames.PoiPrimaryLocationPin || obj.name == meshNames.RegionBoundaryPin) {
        //       // console.log({ msg: "clicked PoiPrimaryLocationPin or RegionBoundaryPin" })
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

        // else if (!mouseIsDown && editState.clickAndDragEnabled) {
        //   // Done with click-and-drag. Disable.
        //   reduxDispatch(
        //     editStateActions.disableClickAndDrag()
        //   )
        // }
        // else {
        //   // No click, but might still be busy.


        //   if (intersection.object.name == meshNames.PoiPrimaryLocationPin) {
        //     // // Hovering over a POI main pin.
        //     // mouseHoverPoiMesh = intersection.object
        //   }
        //   else {
        //     // Not hovering over anything of interest.
        //   }
        // }
      }

      prevMouseIsDownRef.current = mouseState.mouseIsDown
      reduxDispatch(
        mouseStateActions.disableMouseClick()
      )
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
