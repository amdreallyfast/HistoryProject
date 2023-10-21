import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import * as THREE from "three"
import { Globe } from "./Globe"
import { PointOfInterest } from "./PointOfInterest"
import { setSelectedPoi } from "../AppState/stateSlicePointsOfInterest"
import gsap from "gsap"
import Delaunator from "delaunator"

const globeInfo = {
  pos: new THREE.Vector3(0, 0, 0),
  radius: 5
}

function MyPolygon() {


  const meshRef = useRef()
  useEffect(() => {
    let values = [
      { name: "one", lat: 0, long: +1, alt: 0 },
      { name: "two", lat: -1.5, long: +0.2, alt: 0 },
      { name: "three", lat: -0.3, long: -1, alt: 0 },
      { name: "four", lat: +0.3, long: -1, alt: 0 },
      { name: "five", lat: +1.5, long: +0.2, alt: 0 }
    ]

    // Note: The Delaunator library here only works for 2D, but we need 3D coordinates.
    // ?? use 3D version instead? (https://github.com/d3/d3-delaunay) it seems to compute a lot more than I want??
    let vertices2D = []
    let vertices3D = []
    values.forEach((point) => {
      vertices2D.push(point.lat, point.long)
      vertices3D.push(point.lat, point.long, point.alt)
    })

    const verticesTypedArray = new Float32Array(vertices2D)
    console.log({ typedArray: verticesTypedArray })

    let delaunator = new Delaunator(verticesTypedArray)
    // console.log({ triangles: delaunator.triangles })
    // let vertexIndices = []
    // delaunator.triangles.forEach((vertexIndex) => {
    //   // Create a new vertex array with the third dimension (because this Delaunator thing only 
    //   // does 2D).
    //   // Note: Array of vertices was an array of _pairs_ of floats. The starting index of the 
    //   // first float for any 2D vertex is therefore 2 * vertexIndex.
    //   let first 


    //   // Triangles comes in triplets of vertices.

    // })

    // let coordinate = []
    // coordinate.push(delaunator.triangles[0])
    // coordinate.push(delaunator.triangles[1])
    // coordinate.push(delaunator.triangles[2])
    // console.log({ coordinate: coordinate })

    // indices should still work because the 3D vertices are in the exact same order as the 2D, but with one more value (Z coordinate)
    let valuesPerPoint = 3
    let positionAttribute = new THREE.Float32BufferAttribute(vertices3D, valuesPerPoint)
    // const indices = new Uint32Array(
    //   [2, 0, 3,
    //     2, 1, 0,
    //     0, 4, 3]
    // )
    let indicesAttribute = new THREE.Uint32BufferAttribute(delaunator.triangles, 1)
    // let thing = new THREE.BufferGeometry()
    // console.log({ meshRef: meshRef.current })
    // console.log({ triangles: delaunator.triangles })
    // console.log({ indices: indices })
    meshRef.current.geometry.setIndex(indicesAttribute)
    meshRef.current.geometry.setAttribute("position", positionAttribute)

    // // let thing = new THREE.BoxGeometry(5, 5, 5, 2, 2, 2)
    // let thing = new THREE.PlaneGeometry(5, 5, 5, 5)
    // console.log({ geometry: thing })
    // let valuesPerPoint = 3
    // let positionAttribute = new THREE.Float32BufferAttribute(thing.attributes.position.array, valuesPerPoint)
    // meshRef.current.geometry.setIndex(thing.index)
    // meshRef.current.geometry.setAttribute("position", positionAttribute)
  })



  // 1 convert lat-long to vertices
  // create triangles
  // if more than three points, create center vertex 
  // create polygon
  // make transparent
  // make Wed

  return (
    <>
      <mesh name="TestRegion" ref={meshRef}>
        <meshBasicMaterial color={0xff007f} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
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
    // console.log({ msg: "Scene()/useEffect()/poiJsonObjects", value: poiJsonObjects })

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
    // console.log({ msg: "Scene()/useEffect()/poiReactElements", value: poiReactElements })

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

  // Update POI highlight.
  // Note: This useEffect() will only trigger (if I got this right) _after_ the poiJsonObjects
  // and the follow-up poiReactElements are created, so they should all be there.
  useEffect(() => {
    // console.log({ msg: "Scene()/useEffect()/selectedPoi", value: selectedPoi })

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

  // Handle mouse hover and mouse click.
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
    const intersections = state.raycaster.intersectObjects(poiAndGlobeMeshesRef.current)
    let notHoveringOverAnyPois =
      intersections.length == 0
    // || // Space
    // (intersections.length == 1 && intersections[0].object.name == "Globe")  // Just the earth
    if (notHoveringOverAnyPois) {
      // Ignore all mouse clicks.
      mouseClickedCurrPosRef.current = false
    }
    else {
      let things = intersections.filter((intersection) => intersection.object.name == "Globe")
      // console.log({ things: things })




      // TODO disable when you need to get a click on the world surface
      // console.log(things[0].uv)
      let firstIntersection = intersections[0].object
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
      {/* <Globe globeRadius={globeInfo.radius} /> */}
      <group name="PoiGroup">
        {poiReactElements}
      </group>
      <MyPolygon />
    </>
  )
}
