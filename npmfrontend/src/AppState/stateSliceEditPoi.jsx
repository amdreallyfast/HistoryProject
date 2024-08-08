import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";

const initialState = {
  // TODO: change all other POIs and regions to dark grey to indicate that they cannot be highlighted
  editModeOn: true,

  eventId: 99,
  revisionAuthor: "TestingAuthor",
  title: null,
  imageDataUrl: null,
  tags: [],

  // Format for location and region boundaries:
  //  {
  //    id,
  //    lat,
  //    long,
  //    x,
  //    y,
  //    z
  //  }
  primaryLoc: null,

  // Format:
  //  Same as primaryLoc.
  // Note: _Must_ be an array. Order is important for the "ear clipping" algorithm.
  regionBoundaries: [],

  // Can't put ThreeJs meshes into this state machine (function objects are non-serializable), so
  // use integer counters to indicate when there has been a change in meshes that the cursor 
  // should be able to hover over.
  updatedPrimaryPinMeshInScene: 0,
  updatedRegionMeshesInScene: 0,

  // For use during clicking and dragging a single point or the entire region.
  // Note: Using "meshUuid" instead of "meshId" because ThreeJs uses the field "Id" as an 
  // integer for some kind of counting, and it uses "uuid" for the global ID. I don't know why.
  // Format:
  //  {
  //    enabled: false,
  //
  //    // Fixed for duration of click-and-drag.
  //    mesh: {
  //      name: <name>,
  //      uuid: <guid>,
  //      userData: {
  //        eventId: <eventId>,
  //        locationId: <spherePoint.Id>
  //      }
  //    },
  //
  //    // Fixed for duration of click-and-drag. Prevents click-and-drag from snapping the mesh's 
  //    // origin to the cursor the moment the cursor moves a single pixel.
  //    // Note: Covers difference betwwen the 3D point where the raycast intersected a mesh and 
  //    // where the rayast intersected the globe underneath. 
  //    initialOffsetQuaternion: { w, x, y, z },
  //
  //    // Continuously updated. Represents the movement of a mesh from its starting position to 
  //    // wherever the cursor is currently intersecting the globe
  //    rotorQuaternion: { w, x, y, z }
  //  },
  clickAndDrag: null,

  selectedPinId: null,
  prevSelectedPinId: null,
}

export const stateSliceEditPoi = createSlice({
  name: "stateSliceEditPoi",
  initialState,
  reducers: {
    setThing: (state, action) => {
      console.log("stateSliceEditPoi: setThing")
      return {
        ...state,
        thing: action.payload
      }
    },

    startEditMode: (state, action) => {
      // console.log("stateSliceEditPoi: startEditMode")

      // let eventId = action.payload.eventId
      return {
        ...initialState,
        editModeOn: true
      }
    },

    endEditMode: (state, action) => {
      // console.log("stateSliceEditPoi: endEditMode")
      return initialState
    },

    setRevisionAuthor: (state, action) => {
      console.log({ "stateSliceEditPoi: setRevisionAuthor": action.payload })

      return {
        ...state,
        revisionAuthor: action.payload.revisionAuthor
      }
    },

    setTitle: (state, action) => {
      console.log({ "stateSliceEditPoi: setTitle": action.payload })

      return {
        ...state,
        title: action.payload
      }
    },

    setImageDataUrl: (state, action) => {
      console.log({ "stateSliceEditPoi: setImageDataUrl": action.payload })

      let filename = action.payload.filename
      let dataUrl = action.payload.dataUrl
      return {
        ...state,
        imageDataUrl: dataUrl
      }
    },

    setTags: (state, action) => {
      console.log({ "stateSliceEditPoi: setTags": action.payload })

      return {
        ...state,
        tags: action.payload
      }
    },

    setPrimaryLoc: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi: setPrimaryLoc", payload: action.payload })

      let spherePoint = action.payload
      return {
        ...state,
        primaryLoc: {
          id: spherePoint.id,
          lat: spherePoint.lat,
          long: spherePoint.long,
          x: spherePoint.x,
          y: spherePoint.y,
          z: spherePoint.z
        },
      }
    },

    setUpdatedPrimaryPinMeshInScene: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi: setUpdatedPrimaryPinMeshInScene", payload: action.payload })

      return {
        ...state,
        updatedPrimaryPinMeshInScene: state.updatedPrimaryPinMeshInScene + 1
      }
    },

    setRegionBoundaries: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi: setRegionBoundaries", payload: action.payload })

      return {
        ...state,
        regionBoundaries: action.payload
      }
    },

    setUpdatedRegionMeshesInScene: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi: updatedRegionMeshesInScene", payload: action.payload })

      return {
        ...state,
        updatedRegionMeshesInScene: state.updatedRegionMeshesInScene + 1
      }
    },

    updateRegionBoundaryPin: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi: updateRegionBoundaryPin", payload: action.payload })

      // Expected format: See comment block on field.
      let updatedLocation = action.payload
      let updatedBoundaries = state.regionBoundaries.map((boundaryMarker, index) => {
        if (boundaryMarker.id == updatedLocation.id) {
          return updatedLocation
        }
        else {
          // Don't change the others
          return boundaryMarker
        }
      })

      return {
        ...state,
        regionBoundaries: updatedBoundaries
      }
    },

    enableClickAndDrag: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi: startClickAndDrag", payload: action.payload })

      // Expected format: See comment block on field.
      return {
        ...state,
        clickAndDrag: {
          enabled: true,
          mesh: action.payload.mesh,
          initialOffsetQuaternion: action.payload.initialOffsetQuaternion,
          rotorQuaternion: action.payload.rotorQuaternion
        }
      }
    },

    updateClickAndDrag: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi: updateClickAndDrag", payload: action.payload })

      return {
        ...state,
        clickAndDrag: {
          ...state.clickAndDrag,
          rotorQuaternion: action.payload.rotorQuaternion
        }
      }
    },

    disableClickAndDrag: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi: disableClickAndDrag", payload: action.payload })

      return {
        ...state,
        clickAndDrag: null
      }
    },

    setSelectedPinId: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi: setSelectedPinId", payload: action.payload })

      let pinId = action.payload
      if (pinId == null) {
        // Ok. It means "deselect current item".
      }

      return {
        ...state,
        selectedPinId: pinId,
        prevSelectedPinId: state.selectedPinId,
      }
    }
  }
})

export const editStateActions = stateSliceEditPoi.actions
