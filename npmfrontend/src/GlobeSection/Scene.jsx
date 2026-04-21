import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Stars } from "./Stars"
import { Globe } from "./Globe"
import { globeInfo, meshNames, groupNames } from "./constValues"
import { mouseStateActions } from "../AppState/stateSliceMouseInfo"
import { MouseHandler } from "./MouseHandler"
import { EditableRegion } from "./Region/EditableRegion"
import { DisplayOnlyRegion } from "./Region/DisplayOnlyRegion"
import { createSpherePointFromLatLong } from "./createSpherePoint"
import { getLatestRevisions } from "../AppState/getLatestRevisions"
import * as THREE from "three"

// Extract only what is needed for the state machine.
// Note: An object with functions cannot be stored as state. Need to extract the values 
// manually and construct a new JSON object with this info.
const parseIntersectionForState = (intersection, globePos) => {
  let relativeToGlobe = new THREE.Vector3().subVectors(intersection.point, globePos)

  return {
    absolute: {
      x: intersection.point.x,
      y: intersection.point.y,
      z: intersection.point.z,
    },
    relativeToGlobe: {
      x: relativeToGlobe.x,
      y: relativeToGlobe.y,
      z: relativeToGlobe.z,
    },
    mesh: {
      name: intersection.object.name,
      uuid: intersection.object.uuid,
      userData: {
        eventId: intersection.object.userData?.eventId,
        locationId: intersection.object.userData?.locationId,
      }
    }
  }
}

// Note: _Must_ be a child element of react-three/fiber "Canvas".
export function Scene() {
  const mouseState = useSelector((state) => state.mouseInfoReducer)
  const eventState = useSelector((state) => state.eventReducer)
  const editState = useSelector((state) => state.editEventReducer)

  const reduxDispatch = useDispatch()

  // Not strictly HTML.
  const [poiReactElements, setPoiReactElements] = useState()
  const [regionReactElements, setRegionReactElements] = useState()

  const [meshes, setMeshes] = useState()
  const getThreeJsState = useThree((state) => state.get)

  const earthGlobeInfo = globeInfo

  // Create display-only ThreeJs elements out of new search results.
  useEffect(() => {
    // console.log({ "Scene.useEffect[eventState.allEvents]": eventState.allEvents })

    let displayElements = []
    let latestEvents = getLatestRevisions(eventState.allEvents) || []
    latestEvents.forEach((event) => {
      // skip any item being edited
      if (event.eventId != editState.eventId && event.primaryLoc) {
        let primarySpherePoint = createSpherePointFromLatLong(
          event.primaryLoc.lat,
          event.primaryLoc.long,
          globeInfo.radius
        )
        let regionSpherePoints = (event.regionBoundaries || []).map((b) =>
          createSpherePointFromLatLong(b.lat, b.long, globeInfo.radius)
        )
        displayElements.push(
          <DisplayOnlyRegion
            key={event.eventId}
            eventId={event.eventId}
            primaryLoc={primarySpherePoint}
            regionBoundaries={regionSpherePoints}
            globeInfo={earthGlobeInfo}
            isSelected={event.eventId === eventState.selectedEvent?.eventId}
          />
        )
      }
    })

    setPoiReactElements(displayElements)
  }, [eventState.allEvents, eventState.selectedEvent])

  // Edit mode determines whether we render EditableRegion.
  useEffect(() => {
    // console.log({ "Scene.useEffect[editState.editModeOn]": editState.editModeOn })

    if (editState.editModeOn) {
      setRegionReactElements((
        <EditableRegion globeInfo={earthGlobeInfo} />
      ))
    }
    else {
      setRegionReactElements(null)
    }
  }, [editState.editModeOn])

  // Extract meshes from specific groups so that it is easy to filter them.
  // Note: It is more efficient to find these only when the mesh collections change rather than 
  // doing it every frame just before the raycaster runs. Doing so incurs some annoying searching 
  // and notification, but it's better for performance in the long run (I think).
  useEffect(() => {
    // console.log("Scene.useEffect[meshes changed]")

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
    setMeshes(meshesArr)

    // console.log({ meshesArr, count: meshesArr.length })
  }, [poiReactElements, editState.updatedPrimaryPinMeshInScene, editState.updatedRegionMeshesInScene])

  // Handle mouse hover and mouse click.

  // Determine cursor intersections
  useFrame((state) => {
    // console.log("useFrame()")

    // Construction of the React elements and ThreeJs meshes may take a few frames. Wait.
    if (meshes == null) {
      return
    }

    // Note: Intersections are organized by increasing distance, making item 0 the closest.
    state.raycaster.setFromCamera(mouseState.currPos, state.camera)

    const intersections = state.raycaster.intersectObjects(meshes)

    // If there are intersections, always update.
    // Else if the mouse state still has intersections, update so that there are none.
    // Else skip.
    if (intersections.length > 0) {
      let parsedIntersectionsForState = []
      for (let i = 0; i < intersections.length; i++) {
        parsedIntersectionsForState.push(parseIntersectionForState(intersections[i], globeInfo.pos))
      }
      reduxDispatch(mouseStateActions.setCursorRaycasting(parsedIntersectionsForState))

      let first = parsedIntersectionsForState[0]
      if (first.mesh.name == meshNames.PinBoundingBox) {
        let locId = first.mesh.userData.locationId
        reduxDispatch(mouseStateActions.setHoverLocId(locId))
      }
      else if (mouseState.hoverLocId) {
        // Last hover no longer valid.
        reduxDispatch(mouseStateActions.setHoverLocId(null))
      }

      if (
        first.mesh.name == meshNames.DisplayRegion ||
        first.mesh.name == meshNames.DisplayPin
      ) {
        let eid = first.mesh.userData.eventId
        // Guard: only dispatch when the hovered event actually changes (useFrame runs 60x/sec).
        if (eid !== mouseState.hoverEventId) {
          reduxDispatch(mouseStateActions.setHoverEventId(eid))
        }
      } else if (mouseState.hoverEventId) {
        reduxDispatch(mouseStateActions.setHoverEventId(null))
      }
    }
    else if (mouseState.cursorRaycasting.intersections.length > 0) {
      // No intersections. Clear it out.
      reduxDispatch(mouseStateActions.setCursorRaycasting(null))
      reduxDispatch(mouseStateActions.setHoverLocId(null))
      reduxDispatch(mouseStateActions.setHoverEventId(null))
    }

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
        {regionReactElements}
      </group>
    </>
  )
}
