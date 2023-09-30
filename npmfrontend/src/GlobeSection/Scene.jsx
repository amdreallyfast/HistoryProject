import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Vector3, Color } from "three"
import { Globe } from "./Globe"
import { PointOfInterest } from "./PointOfInterest"
import { setSelectedPoi } from "../AppState/stateSlicePointsOfInterest"
import gsap from "gsap"

const globeInfo = {
  pos: new Vector3(0, 0, 0),
  radius: 5
}

// Note: _Must_ be a child element of react-three/fiber "Canvas".
export function Scene(
  {
    poiInfoPopupElementRef,
    poiInfoTitleElementRef,
    mousePosCanvasScreenSpaceRef,
    mouseClickedCurrPosRef
  }) {

  const poiJsonObjects = useSelector((state) => state.pointsOfInterestReducer.pointsOfInterest)
  const selectedPoi = useSelector((state) => state.pointsOfInterestReducer.selectedPoi)
  const prevSelectedPoi = useSelector((state) => state.pointsOfInterestReducer.prevSelectedPoi)
  const reduxDispatch = useDispatch()

  // Not strictly HTML.
  const [poiReactElements, setPoiReactElements] = useState()

  const poiAndGlobeMeshesRef = useRef()
  const getThreeJsState = useThree((state) => state.get)
  let currSelectedPoiMeshRef = useRef()

  // Create interactable ThreeJs elements out of new search results.
  useEffect(() => {
    console.log({ msg: "Scene()/useEffect()/poiJsonObjects" })

    setPoiReactElements(
      poiJsonObjects?.map(
        (poiInfoJson, index) => {
          return (
            <PointOfInterest
              key={index}
              globePos={globeInfo.pos}
              globeRadius={globeInfo.radius}
              poiInfoJson={poiInfoJson}
            />
          )
        }
      )
    )
  }, [poiJsonObjects])

  // Once the interactable points of interest are part of the scene, get a collection of them 
  // for the raycaster to analyze every frame.
  // Note: This up-front collection is for performance reasons.
  useEffect(() => {
    console.log("Scene()/useEffect()/sceneChildren")

    // Note: Extract the POI meshes and_ the "Globe" mesh because the racaster's intersection 
    // calculations will get _all_ meshes in its path. I want to avoid intersections with POIs 
    // behind the globe, but in order to do that, I need to have the globe in the list of 
    // objects that the raytracer considers.
    const poiAndGlobeMeshes = []
    getThreeJsState().scene.children.filter(component => {
      if (component.name === "PoiGroup") {
        component.children.forEach(child => {
          poiAndGlobeMeshes.push(child)
        })
      }
      else if (component.name === "GlobeGroup") {
        component.children.forEach(child => {
          if (child.name === "Globe") {
            poiAndGlobeMeshes.push(child)
          }
        })
      }
    });
    poiAndGlobeMeshesRef.current = poiAndGlobeMeshes
  }, [poiReactElements])

  useEffect(() => {
    // Update which item is highlighted.
    // Note: This useEffect() will only trigger (if I got this right) _after_ the poiJsonObjects
    // and the follow-up poiReactElements are created, so they should all be there.
    console.log({ msg: "Scene()/useEffect()/selectedPoi" })

    if (selectedPoi) {
      // Should have exactly 1 matching element.
      // Note: If there is more or less than 1 with the same guid, then there is a problem.
      let result = poiAndGlobeMeshesRef.current.filter((mesh) => mesh.userData.poiInfoJson?.myUniqueId == selectedPoi.myUniqueId)
      let selectedPoiMesh = result[0]

      // Fade in the new selected item.
      //??use GSAP somehow??
      selectedPoiMesh.material.color = selectedPoiMesh.userData.highlightColor
      selectedPoiMesh.material.opacity = selectedPoiMesh.userData.highlightOpacity

      // Record for later use during "useFrame".
      currSelectedPoiMeshRef.current = selectedPoiMesh
    }

    if (prevSelectedPoi) {
      // let prevSelectedEement = document.getElementById(prevSelectedPoi.myUniqueId)
      let result = poiAndGlobeMeshesRef.current.filter((mesh) => mesh.userData.poiInfoJson?.myUniqueId == prevSelectedPoi.myUniqueId)
      let selectedPoiMesh = result[0]

      // Fade out the previously selected item.
      //??use GSAP somehow??
      selectedPoiMesh.material.color = selectedPoiMesh.userData.originalColor
      selectedPoiMesh.material.opacity = selectedPoiMesh.userData.originalOpacity
    }

  }, [selectedPoi])

  let prevMouseHoverPoiMeshRef = useRef()
  useFrame((state) => {
    // console.log("useFrame()")

    // Construction of the group of points of interest and the ThreeJs state model may take a 
    // couple frames. Wait until then.
    if (poiAndGlobeMeshesRef.current == null || poiInfoPopupElementRef.current == null) {
      return
    }

    // Only consider "mouse hover" intersections that are:
    // 1. Not the globe
    // 2. Not behind the globe
    // Note: Intersections are organized by increasing distance, making item 0 the closest.
    let mouseHoverPoiMesh = null
    state.raycaster.setFromCamera(mousePosCanvasScreenSpaceRef.current, state.camera)
    const intersectedObjects = state.raycaster.intersectObjects(poiAndGlobeMeshesRef.current)
    let notHoveringOverAnyPois =
      intersectedObjects.length == 0 || // Space
      (intersectedObjects.length == 1 && intersectedObjects[0].object.name == "Globe")  // Just the earth
    if (notHoveringOverAnyPois) {
      // Ignore all mouse clicks.
      mouseClickedCurrPosRef.current = false
    }
    else {
      let firstIntersection = intersectedObjects[0].object
      if (firstIntersection.name != "Globe") {
        mouseHoverPoiMesh = firstIntersection
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
      mouseClickedCurrPosRef.current == true

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

      // Only allow a single click to process
      mouseClickedCurrPosRef.current = false

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

    prevMouseHoverPoiMeshRef.current = mouseHoverPoiMesh
  })

  return (
    <>
      <Globe globeRadius={globeInfo.radius} />
      <group name="PoiGroup">
        {poiReactElements}
      </group>
    </>
  )
}
