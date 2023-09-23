import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { setSelectedPoi } from "../AppState/stateSlicePointsOfInterest"
import * as THREE from "three"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Globe } from "./Globe"
import { Stars } from "./Stars"
import { PointOfInterest } from "./PointOfInterest"
import gsap from "gsap"

const globeInfo = {
  pos: new THREE.Vector3(0, 0, 0),
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

  const pointsOfInterest = useSelector((state) => state.pointsOfInterestReducer.pointsOfInterest)
  const selectedPoi = useSelector((state) => state.pointsOfInterestReducer.selectedPoi)
  const reduxDispatch = useDispatch()

  const [pointsOfInterestHtml, setPointsOfInterestHtml] = useState()

  const poiAndGlobeMeshesRef = useRef()
  const threeJsStateModelRef = useRef()
  threeJsStateModelRef.current = useThree((state) => state)
  useEffect(() => {
    console.log({ msg: "GlobeSectionMain(): useEffect()" })

    // Note: Extract the POI meshes and_ the "Globe" mesh because the racaster's intersection 
    // calculations will get _all_ meshes in its path. I want to avoid intersections with POIs 
    // behind the globe, but in order to do that, I need to have the globe in the list of 
    // objects that the raytracer considers.
    const poiGlobeMeshes = []
    threeJsStateModelRef.current.scene.children.forEach(component => {
      if (component.name === "PoiGroup") {
        component.children.forEach(child => {
          poiGlobeMeshes.push(child)
        })
      }
      else if (component.name === "GlobeGroup") {
        component.children.forEach(child => {
          if (child.name === "Globe") {
            poiGlobeMeshes.push(child)
          }
        })
      }
    });
    poiAndGlobeMeshesRef.current = poiGlobeMeshes

    setPointsOfInterestHtml(
      pointsOfInterest?.map(
        (poiInfoJson, index) => (
          <PointOfInterest
            key={index}
            globePos={globeInfo.pos}
            globeRadius={globeInfo.radius}
            poiInfoJson={poiInfoJson} />
        )
      )
    )

    // console.log({ "poiAndGlobeMeshesRef": poiAndGlobeMeshesRef.current })
  }, [pointsOfInterest, threeJsStateModelRef.current])

  let prevMouseHoverPoiMeshRef = useRef()
  // let prevSelectedPoiMeshRef = useRef()
  let currSelectedPoiMeshRef = useRef()
  useFrame((state, delta) => {
    // console.log("useFrame()")


    // console.log({ mouseClickedCurrPos: mouseClickedCurrPosRef.current })


    // Construction of the group of points of interest and the ThreeJs state model may take a 
    // couple frames. Wait until then.
    if (poiAndGlobeMeshesRef.current == null || poiInfoPopupElementRef.current == null) {
      return
    }

    // Check for outside changes.
    let newPoiSelectedFromTheOutside =
      selectedPoi != null &&
      selectedPoi?.myUniqueId != currSelectedPoiMeshRef.current?.userData.allInfo.myUniqueId

    let poiDeselectedFromTheOutside =
      selectedPoi == null &&
      currSelectedPoiMeshRef.current != null

    if (newPoiSelectedFromTheOutside) {
      // console.log({ msg: "newPoiSelectedFromTheOutside" })
      // console.log({ msg: "newPoiSelectedFromTheOutside", uniqueId: selectedPoi?.myUniqueId })

      // Fade out the old (if it exists).
      if (currSelectedPoiMeshRef.current) {
        console.log("fading out the old")
        gsap.to(currSelectedPoiMeshRef.current.material, {
          color: currSelectedPoiMeshRef.current.userData.originalColor,
          opacity: 0.4,
          duration: 0.15
        })
      }

      // console.log({ meshes: poiAndGlobeMeshesRef.current })
      // Find the mesh representing the new selection and fade it in.
      poiAndGlobeMeshesRef.current.forEach((mesh) => {
        // Check for changes in the currently selected item from outside mechanisms.
        if (mesh.name != "Globe") {
          let isCurrSelected = mesh.userData.allInfo.myUniqueId == selectedPoi.myUniqueId
          if (isCurrSelected) {
            // Fade in the new.
            gsap.to(mesh.material, {
              color: mesh.userData.selectedColor,
              opacity: 1.0,
              duration: 0.15
            })
            currSelectedPoiMeshRef.current = mesh
          }
        }
      })
      console.log("--------------------------------")

      return
    }
    else if (poiDeselectedFromTheOutside) {
      // console.log({ msg: "poiDeselectedFromTheOutside" })

      // Fade out the old.
      gsap.to(currSelectedPoiMeshRef.current.material, {
        color: currSelectedPoiMeshRef.current.userData.originalColor,
        opacity: 0.4,
        duration: 0.15
      })
      currSelectedPoiMeshRef.current = null

      return
    }

    // Check for changes from _inside_ the scene.
    state.raycaster.setFromCamera(mousePosCanvasScreenSpaceRef.current, state.camera)
    // console.log({ "mouse.x": mousePosCanvasScreenSpaceRef.current.x, "mouse.y": mousePosCanvasScreenSpaceRef.current.y })

    let mouseHoverPoiMesh = null
    // let clickedPoiMesh = null

    // Only consider intersections that are:
    // 1. Not the globe
    // 2. Not behind the globe
    // Note: Intersections are organized by increasing distance, making item 0 the closest.
    const intersectedObjects = state.raycaster.intersectObjects(poiAndGlobeMeshesRef.current)
    // console.log({ intersectedPoiMesh: intersectedPoiMesh, lastIntersectedPoiMesh: lastIntersectedPoiMesh })
    let notHoveringOverAnyPois =
      intersectedObjects.length == 0 || // Space
      (intersectedObjects.length == 1 && intersectedObjects[0].object.name == "Globe")  // Just the earth
    if (notHoveringOverAnyPois) {
      // Ignore any mouse clicks.
      // console.log({ msg: "Not hovering." })
      mouseClickedCurrPosRef.current = false
    }
    else {
      let firstIntersection = intersectedObjects[0].object
      if (firstIntersection.name != "Globe") {
        mouseHoverPoiMesh = firstIntersection
      }
    }

    // console.log({ curr: currSelectedPoiMeshRef.current, prev: prevSelectedPoiMeshRef.current })

    // Occurs when the mouse drifts from the world (or space) to a POI.
    let newPoiHover =
      mouseHoverPoiMesh != null && prevMouseHoverPoiMeshRef.current == null

    // Occurs when the mouse drifts from a POI to the world (or space).
    let leavingPoiHover =
      mouseHoverPoiMesh == null && prevMouseHoverPoiMeshRef.current != null

    // Occurs when the mouse drifts from one POI to another without going through a space where 
    // there is no POI. Need to shift focus w/out turning off the info popup.
    let changingPoiHover =
      mouseHoverPoiMesh != null && prevMouseHoverPoiMeshRef.current != null &&
      mouseHoverPoiMesh?.uuid != prevMouseHoverPoiMeshRef.current?.uuid

    // Occurs when the mouse is stationary over a POI and is clicked.
    let clickedSamePoiHover =
      mouseHoverPoiMesh != null && prevMouseHoverPoiMeshRef.current != null &&
      mouseHoverPoiMesh?.uuid == prevMouseHoverPoiMeshRef.current?.uuid &&
      mouseClickedCurrPosRef.current == true

    // const fadeIn = (meshMaterial) => {
    //   gsap.to(meshMaterial, {
    //     opacity: 1.0,
    //     duration: 0.15
    //   })
    // }

    if (newPoiHover) {
      // console.log({ msg: "newPoiHover" })

      // Turn on the popup.
      gsap.set(poiInfoPopupElementRef.current, {
        display: "block"
      })
      gsap.set(poiInfoTitleElementRef.current, {
        innerHTML: mouseHoverPoiMesh.userData.allInfo.name.common
      })

      // console.log({
      //   r: mouseHoverPoiMesh.material.color.r,
      //   g: mouseHoverPoiMesh.material.color.g,
      //   b: mouseHoverPoiMesh.material.color.b,
      //   opacity: mouseHoverPoiMesh.material.opacity
      // })
      // Fade in the new (unless it's the currently selected POI; leave that alone).
      if (mouseHoverPoiMesh.uuid != currSelectedPoiMeshRef.current?.uuid) {
        gsap.to(mouseHoverPoiMesh.material, {
          opacity: 1.0,
          duration: 0.15
        })
      }
    }
    else if (leavingPoiHover) {
      // console.log({ msg: "leavingPoiHover" })

      // Turn off the popup
      gsap.set(poiInfoPopupElementRef.current, {
        display: "none"
      })

      // Fade out the old (unless it's the currently selected POI; leave that alone).
      if (prevMouseHoverPoiMeshRef.current.uuid != currSelectedPoiMeshRef.current?.uuid) {
        gsap.to(prevMouseHoverPoiMeshRef.current.material, {
          opacity: 0.4,
          duration: 0.15
        })
      }
    }
    else if (changingPoiHover) {
      console.log({ msg: "changingPoiHover" })

      // Fade in the new
      gsap.to(mouseHoverPoiMesh.material, {
        opacity: 1.0,
        duration: 0.15
      })

      // Fade out the old (unless it's the currently selected POI).
      if (prevMouseHoverPoiMeshRef.current.uuid != currSelectedPoiMeshRef.current?.uuid) {
        gsap.to(prevMouseHoverPoiMeshRef.current.material, {
          opacity: 0.4,
          duration: 0.15
        })
      }
    }
    else if (clickedSamePoiHover) {
      // console.log({ msg: "clickedSamePoiHover" })

      // Only allow a single click to process
      mouseClickedCurrPosRef.current = false

      if (mouseHoverPoiMesh.uuid == currSelectedPoiMeshRef.current?.uuid) {
        // The currently selected item is clicked again

        // Fade to original color.
        gsap.set(mouseHoverPoiMesh.material, {
          color: mouseHoverPoiMesh.userData.originalColor,
          duration: 2.0
        })

        // And de-select.
        currSelectedPoiMeshRef.current = null
        reduxDispatch(setSelectedPoi(null))
      }
      else {
        // A new item is clicked.

        // Fade in highlight color.
        gsap.set(mouseHoverPoiMesh.material, {
          color: mouseHoverPoiMesh.userData.selectedColor,
          duration: 2.0
        })

        // If there is a previous selection, fade that one back to the original color.
        if (currSelectedPoiMeshRef.current) {
          gsap.set(currSelectedPoiMeshRef.current.material, {
            color: currSelectedPoiMeshRef.current.userData.originalColor,
            duration: 2.0
          })
        }

        // And select.
        currSelectedPoiMeshRef.current = mouseHoverPoiMesh
        reduxDispatch(setSelectedPoi(mouseHoverPoiMesh.userData.allInfo))
      }
    }
    else {
      // console.log({ msg: "no POI hover" })

      // Not hovering over any POI. Ignore.
    }

    prevMouseHoverPoiMeshRef.current = mouseHoverPoiMesh
  })

  return (
    <>
      <PerspectiveCamera makeDefault position={new THREE.Vector3(0, 0, 25)} fov={50} far={3000} />
      <OrbitControls />
      <spotLight position={(10, 15, 10)} angle={0.3} intensity={0.2} />
      <Globe globeRadius={globeInfo.radius} />
      <group name="PoiGroup">
        {pointsOfInterestHtml}
      </group>
      <Stars />
    </>
  )
}
