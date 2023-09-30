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
  // const threeJsStateModelRef = useRef()
  const getThreeJsState = useThree((state) => state.get)
  let currSelectedPoiMeshRef = useRef()

  // Create interactable ThreeJs elements out of new search results.
  useEffect(() => {
    console.log({ msg: "Scene()/useEffect()/poiJsonObjects" })

    setPoiReactElements(
      poiJsonObjects?.map(
        (poiInfoJson, index) => {
          console.log("creating new HTML")
          // let isSelected = poiInfoJson.myUniqueId == selectedPoi?.myUniqueId
          return (
            <PointOfInterest
              key={index}
              globePos={globeInfo.pos}
              globeRadius={globeInfo.radius}
              poiInfoJson={poiInfoJson}
            // isSelected={isSelected}
            />
          )
        }
      )
    )
    // console.log({ poiReactElements: poiReactElements })
  }, [poiJsonObjects])

  // Once the interactable points of interest are part of the scene, get a collection of them 
  // for the raycaster to analyze every frame.
  // Note: This is for performance reasons.
  useEffect(() => {
    console.log("Scene()/useEffect()/sceneChildren")
    // console.log(getThreeJsState().scene.children.length)

    // Note: Extract the POI meshes and_ the "Globe" mesh because the racaster's intersection 
    // calculations will get _all_ meshes in its path. I want to avoid intersections with POIs 
    // behind the globe, but in order to do that, I need to have the globe in the list of 
    // objects that the raytracer considers.

    const poiGlobeMeshes = []
    getThreeJsState().scene.children.filter(component => {
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
    // console.log({ poiGlobeMeshes: poiGlobeMeshes })

    poiAndGlobeMeshesRef.current = poiGlobeMeshes


    // console.log({ poiAndGlobeMeshesRef: poiAndGlobeMeshesRef.current })
  }, [poiReactElements])

  useEffect(() => {
    // Update which item is highlighted.
    // Note: This useEffect() will only trigger (if I got this right) _after_ the poiJsonObjects
    // and the follow-up poiReactElements are created, so they should all be there.
    console.log({ msg: "Scene()/useEffect()/selectedPoi" })

    if (selectedPoi) {
      // Should have exactly 1 matching element.
      // Note: If there is more or less than 1, then there is a serious problem.
      let result = poiAndGlobeMeshesRef.current.filter((mesh) => mesh.userData.allInfo?.myUniqueId == selectedPoi.myUniqueId)
      // console.log({ "selectedElement": result[0].userData.allInfo.name.common })
      let selectedPoiMesh = result[0]
      selectedPoiMesh.material.color = selectedPoiMesh.userData.highlightColor
      selectedPoiMesh.material.opacity = selectedPoiMesh.userData.highlightOpacity

      // Record for later use during "useFrame".
      currSelectedPoiMeshRef.current = selectedPoiMesh

      //??why does using gsap.to(...) cause all the colors to flicker??

      // gsap.to(selectedPoiMesh.material, {
      //   color: selectedPoiMesh.userData.highlightColor,
      //   opacity: selectedPoiMesh.userData.highlightOpacity,
      //   duration: 0.15
      // })
    }

    if (prevSelectedPoi) {
      // let prevSelectedEement = document.getElementById(prevSelectedPoi.myUniqueId)
      let result = poiAndGlobeMeshesRef.current.filter((mesh) => mesh.userData.allInfo?.myUniqueId == prevSelectedPoi.myUniqueId)
      console.log({ "prevSelectedElement": result[0].userData.allInfo.name.common })
      let selectedPoiMesh = result[0]
      selectedPoiMesh.material.color = selectedPoiMesh.userData.originalColor
      selectedPoiMesh.material.opacity = selectedPoiMesh.userData.originalOpacity

      //??why does using gsap.to(...) cause all the colors to flicker??

      // gsap.to(selectedPoiMesh.material, {
      //   color: selectedPoiMesh.userData.originalColor,
      //   opacity: selectedPoiMesh.userData.originalOpacity,
      //   duration: 0.15
      // })
    }

  }, [selectedPoi])

  // useEffect(() => {
  //   console.log("Scene()/useEffect()/setPoiReactElements")
  //   // console.log(poiAndGlobeMeshesRef.current.length)

  //   // console.log({ "poiAndGlobeMeshesRef": poiAndGlobeMeshesRef.current })
  // }, [poiJsonObjects, selectedPoi])



  let mouseHoverPoiMeshRef = useRef()
  let prevMouseHoverPoiMeshRef = useRef()
  // let prevSelectedPoiMeshRef = useRef()


  useFrame((state, delta) => {
    // console.log("useFrame()")

    // const poiGlobeMeshes = []
    // state.scene.children.filter(component => {
    //   if (component.name === "PoiGroup") {
    //     component.children.forEach(child => {
    //       poiGlobeMeshes.push(child)
    //     })
    //   }
    //   else if (component.name === "GlobeGroup") {
    //     component.children.forEach(child => {
    //       if (child.name === "Globe") {
    //         poiGlobeMeshes.push(child)
    //       }
    //     })
    //   }
    // });
    // // console.log(poiGlobeMeshes)
    // poiAndGlobeMeshesRef.current = poiGlobeMeshes





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
      // gsap.set(poiInfoPopupElementRef.current, {
      //   display: "block"
      // })
      // gsap.set(poiInfoTitleElementRef.current, {
      //   innerHTML: mouseHoverPoiMesh.userData.allInfo.name.common
      // })
      poiInfoPopupElementRef.current.display = "block"
      poiInfoTitleElementRef.current.innerHTML = mouseHoverPoiMesh.userData.allInfo.name.common

      // Fade-in highlight the POI.
      // Note: Ignore if it is the currently selected POI. Leave that alone.
      if (mouseHoverPoiMesh.uuid != currSelectedPoiMeshRef.current?.uuid) {
        // gsap.to(mouseHoverPoiMesh.material, {
        //   opacity: 1.0,
        //   duration: 0.15
        // })
        mouseHoverPoiMesh.material.opacity = 1.0
      }
    }
    else if (leavingPoiHover) {
      // console.log({ msg: "leavingPoiHover" })

      // Turn off the popup
      // gsap.set(poiInfoPopupElementRef.current, {
      //   display: "none"
      // })
      poiInfoPopupElementRef.current.display = "none"

      // Fade-out the POI highlight.
      // Note: Ignore if it was the currently selected POI. Leave that alone.
      if (prevMouseHoverPoiMeshRef.current.uuid != currSelectedPoiMeshRef.current?.uuid) {
        // gsap.to(prevMouseHoverPoiMeshRef.current.material, {
        //   opacity: 0.4,
        //   duration: 0.15
        // })
        prevMouseHoverPoiMeshRef.current.material.opacity = prevMouseHoverPoiMeshRef.current.userData.originalOpacity
      }
    }
    else if (changingPoiHover) {
      // console.log({ msg: "changingPoiHover" })

      // Change the popup's info:
      // gsap.set(poiInfoTitleElementRef.current, {
      //   innerHTML: mouseHoverPoiMesh.userData.allInfo.name.common
      // })
      poiInfoTitleElementRef.current.innerHTML = mouseHoverPoiMesh.userData.allInfo.name.common

      // Fade in the new
      // gsap.to(mouseHoverPoiMesh.material, {
      //   opacity: 1.0,
      //   duration: 0.15
      // })
      mouseHoverPoiMesh.material.opacity = mouseHoverPoiMesh.userData.highlightOpacity

      // Fade out the old (unless it's the currently selected POI).
      if (prevMouseHoverPoiMeshRef.current.uuid != currSelectedPoiMeshRef.current?.uuid) {
        // gsap.to(prevMouseHoverPoiMeshRef.current.material, {
        //   opacity: 0.4,
        //   duration: 0.15
        // })
        prevMouseHoverPoiMeshRef.current.material.opacity = prevMouseHoverPoiMeshRef.current.userData.originalOpacity
      }
    }
    else if (clickedSamePoiHover) {
      console.log({ msg: "clickedSamePoiHover" })

      // Only allow a single click to process
      mouseClickedCurrPosRef.current = false

      if (mouseHoverPoiMesh.uuid == currSelectedPoiMeshRef.current?.uuid) {
        // The currently selected item is clicked again => de-selected

        // Fade to original color.
        // Note: The mouse hover still demands the "highlight" opacity, so leave opacity as-is.
        // gsap.to(mouseHoverPoiMesh.material, {
        //   color: mouseHoverPoiMesh.userData.originalColor,
        //   duration: 2.0
        // })
        // mouseHoverPoiMesh.material.color = mouseHoverPoiMesh.userData.originalColor

        // And de-select.
        currSelectedPoiMeshRef.current = null
        reduxDispatch(setSelectedPoi(null))
      }
      else {
        // A new item is clicked.

        // Fade in highlight color.
        // Note: High opacity already set by the mouse hovering, so leave opacity as-is.
        // gsap.to(currSelectedPoiMeshRef.current.material, {
        //   color: currSelectedPoiMeshRef.current.userData.highlightColor,
        //   duration: 2.0
        // })
        // gsap.fromTo(mouseHoverPoiMesh.material,
        //   {
        //     color: mouseHoverPoiMesh.userData.originalColor
        //   },
        //   {
        //     color: mouseHoverPoiMesh.userData.highlightColor,
        //     duration: 2.0
        //   })
        // console.log({ before: mouseHoverPoiMesh.material })
        // gsap.set(mouseHoverPoiMesh, {
        //   material: {
        //     ...mouseHoverPoiMesh.material,
        //     color: mouseHoverPoiMesh.userData.highlightColor,
        //   },
        //   duration: 2.0
        // })
        // console.log({ after: mouseHoverPoiMesh.material })
        // mouseHoverPoiMesh.material.color = mouseHoverPoiMesh.userData.highlightColor

        // // Fade out the old.
        // // Note: The mouse is no longer hovering over it, so the "hover opacity" is no longer 
        // // needed and we need to reset both color + opacity.
        // if (currSelectedPoiMeshRef.current) {
        //   // gsap.to(currSelectedPoiMeshRef.current.material, {
        //   //   color: currSelectedPoiMeshRef.current.userData.originalColor,
        //   //   opacity: currSelectedPoiMeshRef.current.userData.originalOpacity,
        //   //   duration: 2.0
        //   // })
        //   currSelectedPoiMeshRef.current.material.color = currSelectedPoiMeshRef.current.userData.originalColor
        //   currSelectedPoiMeshRef.current.material.opacity = currSelectedPoiMeshRef.current.userData.originalOpacity
        // }

        // And select the new one.
        currSelectedPoiMeshRef.current = mouseHoverPoiMesh
        reduxDispatch(setSelectedPoi(mouseHoverPoiMesh.userData.allInfo))
      }
    }
    else {
      // console.log({ msg: "no POI hover" })
      // console.log("no POI hover")

      // Not hovering over any POI. Ignore.
    }

    prevMouseHoverPoiMeshRef.current = mouseHoverPoiMeshRef.current
    mouseHoverPoiMeshRef.current = mouseHoverPoiMesh
  })




  // useFrame((state, delta) => {
  //   // console.log("useFrame()")

  //   // console.log(getThreeJsState().scene.children.length)

  //   // console.log({ mouseClickedCurrPos: mouseClickedCurrPosRef.current })


  //   // Construction of the group of points of interest and the ThreeJs state model may take a 
  //   // couple frames. Wait until then.
  //   if (poiAndGlobeMeshesRef.current == null || poiInfoPopupElementRef.current == null) {
  //     return
  //   }

  //   // Check for outside changes.
  //   let newPoiSelectedFromTheOutside =
  //     selectedPoi != null &&
  //     selectedPoi?.myUniqueId != currSelectedPoiMeshRef.current?.userData.allInfo.myUniqueId

  //   let poiDeselectedFromTheOutside =
  //     selectedPoi == null &&
  //     currSelectedPoiMeshRef.current != null

  //   if (newPoiSelectedFromTheOutside) {
  //     console.log("newPoiSelectedFromTheOutside")
  //     // console.log({ msg: "newPoiSelectedFromTheOutside", uniqueId: selectedPoi?.myUniqueId })

  //     // Fade out the old (if it exists).
  //     if (currSelectedPoiMeshRef.current) {
  //       gsap.to(currSelectedPoiMeshRef.current.material, {
  //         color: currSelectedPoiMeshRef.current.userData.originalColor,
  //         opacity: currSelectedPoiMeshRef.current.userData.originalOpacity,
  //         duration: 0.15
  //       })
  //       currSelectedPoiMeshRef.current = null
  //     }

  //     // console.log({ meshes: poiAndGlobeMeshesRef.current })
  //     // Find the mesh representing the new selection and fade it in.
  //     poiAndGlobeMeshesRef.current.forEach((mesh) => {
  //       // Check for changes in the currently selected item from outside mechanisms.
  //       if (mesh.name != "Globe") {
  //         let isCurrSelected = mesh.userData.allInfo.myUniqueId == selectedPoi.myUniqueId
  //         if (isCurrSelected) {
  //           // Fade in the new.
  //           gsap.to(mesh.material, {
  //             color: mesh.userData.selectedColor,
  //             opacity: mesh.userData.highlightOpacity,
  //             duration: 0.15
  //           })
  //           currSelectedPoiMeshRef.current = mesh
  //         }
  //       }
  //     })
  //   }
  //   else if (poiDeselectedFromTheOutside) {
  //     console.log("poiDeselectedFromTheOutside")

  //     // Fade out the old.
  //     gsap.to(currSelectedPoiMeshRef.current.material, {
  //       color: currSelectedPoiMeshRef.current.userData.originalColor,
  //       opacity: currSelectedPoiMeshRef.current.userData.originalOpacity,
  //       duration: 0.15
  //     })
  //     currSelectedPoiMeshRef.current = null
  //   }
  //   else {
  //     // Check for changes from _inside_ the scene.
  //     console.log("Scene()/useFrame()/checkForInternalChanges")

  //     // Only consider "mouse hover" intersections that are:
  //     // 1. Not the globe
  //     // 2. Not behind the globe
  //     // Note: Intersections are organized by increasing distance, making item 0 the closest.
  //     let mouseHoverPoiMesh = null
  //     state.raycaster.setFromCamera(mousePosCanvasScreenSpaceRef.current, state.camera)
  //     const intersectedObjects = state.raycaster.intersectObjects(poiAndGlobeMeshesRef.current)
  //     let notHoveringOverAnyPois =
  //       intersectedObjects.length == 0 || // Space
  //       (intersectedObjects.length == 1 && intersectedObjects[0].object.name == "Globe")  // Just the earth
  //     if (notHoveringOverAnyPois) {
  //       // Ignore all mouse clicks.
  //       mouseClickedCurrPosRef.current = false
  //     }
  //     else {
  //       let firstIntersection = intersectedObjects[0].object
  //       if (firstIntersection.name != "Globe") {
  //         mouseHoverPoiMesh = firstIntersection
  //       }
  //     }


  //     // Occurs when the mouse drifts from the world (or space) to a POI.
  //     let newPoiHover =
  //       mouseHoverPoiMesh != null && prevMouseHoverPoiMeshRef.current == null

  //     // Occurs when the mouse drifts from a POI to the world (or space).
  //     let leavingPoiHover =
  //       mouseHoverPoiMesh == null && prevMouseHoverPoiMeshRef.current != null

  //     // Occurs when the mouse drifts from one POI to another without going through a space where 
  //     // there is no POI. Need to shift focus w/out turning off the info popup.
  //     let changingPoiHover =
  //       mouseHoverPoiMesh != null && prevMouseHoverPoiMeshRef.current != null &&
  //       mouseHoverPoiMesh?.uuid != prevMouseHoverPoiMeshRef.current?.uuid

  //     // Occurs when the mouse is stationary over a POI and is clicked.
  //     let clickedSamePoiHover =
  //       mouseHoverPoiMesh != null && prevMouseHoverPoiMeshRef.current != null &&
  //       mouseHoverPoiMesh?.uuid == prevMouseHoverPoiMeshRef.current?.uuid &&
  //       mouseClickedCurrPosRef.current == true

  //     if (newPoiHover) {
  //       // console.log({ msg: "newPoiHover" })

  //       // Turn on the popup.
  //       gsap.set(poiInfoPopupElementRef.current, {
  //         display: "block"
  //       })
  //       gsap.set(poiInfoTitleElementRef.current, {
  //         innerHTML: mouseHoverPoiMesh.userData.allInfo.name.common
  //       })

  //       // Fade-in highlight the POI.
  //       // Note: Ignore if it is the currently selected POI. Leave that alone.
  //       if (mouseHoverPoiMesh.uuid != currSelectedPoiMeshRef.current?.uuid) {
  //         gsap.to(mouseHoverPoiMesh.material, {
  //           opacity: 1.0,
  //           duration: 0.15
  //         })
  //       }
  //     }
  //     else if (leavingPoiHover) {
  //       // console.log({ msg: "leavingPoiHover" })

  //       // Turn off the popup
  //       gsap.set(poiInfoPopupElementRef.current, {
  //         display: "none"
  //       })

  //       // Fade-out the POI highlight.
  //       // Note: Ignore if it was the currently selected POI. Leave that alone.
  //       if (prevMouseHoverPoiMeshRef.current.uuid != currSelectedPoiMeshRef.current?.uuid) {
  //         gsap.to(prevMouseHoverPoiMeshRef.current.material, {
  //           opacity: 0.4,
  //           duration: 0.15
  //         })
  //       }
  //     }
  //     else if (changingPoiHover) {
  //       // console.log({ msg: "changingPoiHover" })

  //       // Fade in the new
  //       gsap.to(mouseHoverPoiMesh.material, {
  //         opacity: 1.0,
  //         duration: 0.15
  //       })

  //       // Fade out the old (unless it's the currently selected POI).
  //       if (prevMouseHoverPoiMeshRef.current.uuid != currSelectedPoiMeshRef.current?.uuid) {
  //         gsap.to(prevMouseHoverPoiMeshRef.current.material, {
  //           opacity: 0.4,
  //           duration: 0.15
  //         })
  //       }
  //     }
  //     else if (clickedSamePoiHover) {
  //       // console.log({ msg: "clickedSamePoiHover" })

  //       // Only allow a single click to process
  //       mouseClickedCurrPosRef.current = false

  //       if (mouseHoverPoiMesh.uuid == currSelectedPoiMeshRef.current?.uuid) {
  //         // The currently selected item is clicked again

  //         // Fade to original color.
  //         // Note: The mouse hover still demands the "highlight" opacity.
  //         gsap.set(mouseHoverPoiMesh.material, {
  //           color: mouseHoverPoiMesh.userData.originalColor,
  //           duration: 2.0
  //         })

  //         // And de-select.
  //         currSelectedPoiMeshRef.current = null
  //         reduxDispatch(setSelectedPoi(null))
  //       }
  //       else {
  //         // A new item is clicked.

  //         // Fade in highlight color.
  //         gsap.set(mouseHoverPoiMesh.material, {
  //           color: mouseHoverPoiMesh.userData.selectedColor,
  //           duration: 2.0
  //         })

  //         // If there is a previous selection, fade that one back to the original color + opacity (
  //         // the mouse is no longer hovering over it, so no need for the "highlight opacity").
  //         if (currSelectedPoiMeshRef.current) {
  //           gsap.set(currSelectedPoiMeshRef.current.material, {
  //             color: currSelectedPoiMeshRef.current.userData.originalColor,
  //             opacity: currSelectedPoiMeshRef.current.userData.originalOpacity,
  //             duration: 2.0
  //           })
  //         }

  //         // And select.
  //         currSelectedPoiMeshRef.current = mouseHoverPoiMesh
  //         reduxDispatch(setSelectedPoi(mouseHoverPoiMesh.userData.allInfo))
  //       }
  //     }
  //     else {
  //       // console.log({ msg: "no POI hover" })
  //       // console.log("no POI hover")

  //       // Not hovering over any POI. Ignore.
  //     }

  //     prevMouseHoverPoiMeshRef.current = mouseHoverPoiMesh
  //   }
  // })

  return (
    <>
      <Globe globeRadius={globeInfo.radius} />
      <group name="PoiGroup">
        {poiReactElements}
      </group>
    </>
  )
}
