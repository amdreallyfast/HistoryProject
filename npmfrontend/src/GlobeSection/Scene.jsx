import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { setSelectedPoi } from "../AppState/stateSlicePoi"
import { addLocation } from "../AppState/stateSliceEditPoi"
import * as THREE from "three"
import { Globe } from "./Globe"
import { Poi } from "./Poi"
import Delaunator from "delaunator"
import * as d3Geo from "d3-geo-voronoi"
import { globeInfo, meshNames } from "./constValues"

function MyPolygon() {

  const regionMeshRef = useRef()
  useEffect(() => {
    console.log("MyPolygon -> useEffect -> regionMeshRef")
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

    const vertices2DTypedArray = new Float32Array(vertices2D)
    const vertices3DTypedArray = new Float32Array(vertices3D)

    let delaunator = new Delaunator(vertices2DTypedArray)
    let vertexIndices = delaunator.triangles

    // const d3Delaunay = new d3.Delaunay(vertices3DTypedArray)
    // console.log(d3Delaunay)

    // Note: Indices should still work because the 3D vertices are in the exact same order as the 
    // 2D, but with one more value (Z coordinate)
    let posValuesPerPoint = 3
    let positionAttribute = new THREE.Float32BufferAttribute(vertices3D, posValuesPerPoint)
    regionMeshRef.current.geometry.setAttribute("position", positionAttribute)

    let indexValuesPerPoint = 1
    let indicesAttribute = new THREE.Uint32BufferAttribute(vertexIndices, indexValuesPerPoint)
    regionMeshRef.current.geometry.setIndex(indicesAttribute)
  }, [regionMeshRef.current])

  const sphereMeshRef = useRef()
  const pointsMeshRef = useRef()
  useEffect(() => {
    console.log("MyPolygon -> useEffect -> sphereMeshRef")

    // see if this thing works with a sphere
    let radius = 3
    let widthSegments = 32
    let heightSegments = 16
    let myGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments)
    const vertices3DTypedArray = new Float32Array(myGeometry.attributes.position.array)

    let longLatCoordinates = []
    let long = 0  // Prime Meridian
    let lat = 90  // north pole
    longLatCoordinates.push([long, lat])
    for (let lat = 80; lat >= -30; lat -= 10) {
      // 0 -> -180 = West
      for (let long = 0; long >= -180; long -= 10) {
        longLatCoordinates.push([long, lat])
      }

      // 0 -> +180 = East
      for (let long = 0; long <= 180; long += 10) {
        longLatCoordinates.push([long, lat])
      }
    }
    // console.log({ longLatCoordinates: longLatCoordinates })
    // console.log({ "longLatCoordinates[0]": longLatCoordinates[0] })

    // ??why does "for (let i in arrayOfArrays)" end up flattening the array??
    let sphereVertices = []
    longLatCoordinates.forEach((longLat) => {
      // console.log({ longLat: longLat })
      let longRad = (longLat[0] / 180.0) * Math.PI  // 90 => 1.570795
      let latRad = (longLat[1] / 180.0) * Math.PI   // 0  => 0

      let x = radius * Math.cos(latRad) * Math.sin(longRad)
      let y = radius * Math.sin(latRad)
      let z = radius * Math.cos(latRad) * Math.cos(longRad)
      sphereVertices.push(x, y, z)

      // console.log({
      //   longLat: longLat,
      //   long: longLat[0],
      //   lat: longLat[1],
      //   longRad: longRad,
      //   latRad: latRad,
      //   x: x,
      //   y: y,
      //   z: z
      // })

    })

    // console.log({ vertices: vertices })

    let valuesPerVertex = 3
    let pointsPositionAttribute = new THREE.Float32BufferAttribute(sphereVertices, valuesPerVertex)
    pointsMeshRef.current.geometry.setAttribute("position", pointsPositionAttribute)

    let delaunay = d3Geo.geoDelaunay(longLatCoordinates)
    // let delaunay = d3Geo.geoDelaunay(myGeometry.attributes.position.array)
    let vertexIndices = delaunay.triangles.flat()

    // let myGeometry = new THREE.BoxGeometry(3, 3, 3, 3)
    // console.log(myGeometry)
    // let vertices = myGeometry.attributes.position.array
    // let vertexIndices = myGeometry.index.array

    // let valuesPerVertex = 3
    let spherePositionAttribute = new THREE.Float32BufferAttribute(sphereVertices, valuesPerVertex)
    sphereMeshRef.current.geometry.setAttribute("position", spherePositionAttribute)

    let indexValuesPerPoint = 1
    let sphereIndicesAttribute = new THREE.Uint32BufferAttribute(vertexIndices, indexValuesPerPoint)
    sphereMeshRef.current.geometry.setIndex(sphereIndicesAttribute)
  }, [sphereMeshRef.current])




  // 1 convert lat-long to vertices
  // create triangles
  // if more than three points, create center vertex 
  // create polygon
  // make transparent
  // make Wed

  return (
    <>
      <mesh name="TestRegion" ref={regionMeshRef}>
        <meshBasicMaterial color={0xff007f} side={THREE.DoubleSide} />
      </mesh>

      <mesh name="TestSphere" ref={sphereMeshRef}>
        <meshBasicMaterial color={0x0fff0} side={THREE.DoubleSide} wireframe={true} />
      </mesh>

      <points name="TestPointsRef" ref={pointsMeshRef}>
        <pointsMaterial color={0x00fff0} size={0.3} />
      </points>
    </>
  )
}

function ConvertLatLongToXYZ({ lat, long }) {

}

function ConvertXYZToLatLong(x, y, z) {
  // Note: Camera defaults to being on the Z axis (and backed up negative). With that perspective:
  //  -X is left, +X is right
  //  -Y is down, +Y is up
  //  -Z is towards the camera, +Z is away from camera
  // That makes XZ the horizontal plane.
  const radToDeg = 180.0 / Math.PI

  //??why is this not exactly equal to globe radius??
  //let lenHypotenuse = Math.sqrt((x * x) + (y * y) + (z * z))
  let lenHypotenuse = globeInfo.radius
  let latRad = Math.asin(y / lenHypotenuse)

  // let lenHypotenuseProjectionOntoXZPlane = Math.sqrt((x * x) + (z * z))
  let lenHypotenuseProjectionOntoXZPlane = lenHypotenuse * Math.cos(latRad)
  let longRad = Math.asin(x / lenHypotenuseProjectionOntoXZPlane)

  console.log(x, y, z)

  // console.log({ point: [x, y, z], h: lenHypotenuse, hP: lenHypotenuseProjectionOntoXZPlane, lat: lat, long: long, })
  // console.log({ lat: lat, long: long })
  return [
    latRad * radToDeg,
    longRad * radToDeg,
  ]
}

// Note: _Must_ be a child element of react-three/fiber "Canvas".
export function Scene(
  {
    poiInfoPopupElementRef,
    poiInfoTitleElementRef,
    mousePosCanvasScreenSpaceRef,
    mouseClickedCurrPosRef
  }) {

  const poiJsonObjects = useSelector((state) => state.poiReducer.allPois)
  const selectedPoi = useSelector((state) => state.poiReducer.selectedPoi)
  const prevSelectedPoi = useSelector((state) => state.poiReducer.prevSelectedPoi)
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
            <Poi
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
    if (intersections.length == 0) {
      // Mouse is in space. Ignore.
      // console.log("hover nothing")
    }
    else {
      let firstIntersection = intersections[0]
      if (firstIntersection.object.name == meshNames.Globe) {
        // console.log("hover globe")
        if (mouseClickedCurrPosRef.current) {
          let clickedPoint = firstIntersection.point
          let x = clickedPoint.x
          let y = clickedPoint.y
          let z = clickedPoint.z
          const [lat, long] = ConvertXYZToLatLong(x, y, z)
          reduxDispatch(addLocation({ lat, long }))
        }
      }
      else if (firstIntersection.object.name == meshNames.Poi) {
        // console.log("hover poi")
        mouseHoverPoiMesh = intersections[0].object
      }
      else {
        // Ignore other objects (stars, atmosphere, etc.)
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

      // // Only allow a single click to process
      // mouseClickedCurrPosRef.current = false

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
    mouseClickedCurrPosRef.current = false
  })

  return (
    <>
      <Globe globeRadius={globeInfo.radius} />
      <group name="PoiGroup">
        {poiReactElements}
      </group>
      {/* <MyPolygon /> */}
    </>
  )
}
