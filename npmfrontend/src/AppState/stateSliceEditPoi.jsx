import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";

const initialState = {
  // TODO: change all other POIs and regions to dark grey to indicate that they cannot be highlighted
  editModeOn: true,

  poiId: 99,

  imageDataUrl: null,

  // Format for location and region boundaries:
  //  {
  //    id,
  //    lat,
  //    long,
  //    x,
  //    y,
  //    z
  //  }
  primaryPin: null,

  // Format:
  //  Same as primaryPin.
  // Note: _Must_ be an array. Order is important for the "ear clipping" algorithm.
  regionBoundaries: [],

  // Can't put ThreeJs meshes into this state machine (function objects are non-serializable), so
  // use integer counters to indicate when there has been a change in meshes that the cursor 
  // should be able to hover over.
  updatedPrimaryPinMeshInScene: 0,
  updatedRegionMeshesInScene: 0,

  // For use during clicking and dragging a single point or the entire region.
  // Note: Using "meshUuid" instead of "meshId" because ThreeJs uses the fireld "Id" as an 
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
  //        poiId: <poiId>,
  //        locationId: <spherePoint.Id>
  //      }
  //    },
  //
  //    // Fixed for duration of click-and-drag.
  //    // Note: Covers difference betwwen the 3D point where the raycast intersected a mesh and 
  //    // where the rayast intersected the globe underneath. Used to prevent click-and-drag from 
  //    // snapping the mesh's origin to the cursor the moment the cursor moves a single pixel.
  //    initialOffsetQuaternion: { w, x, y, z },
  //
  //    // Continuously updated. Represents the movement of a mesh from its starting position to 
  //    // wherever the cursor is currently intersecting the globe
  //    rotorQuaternion: { w, x, y, z }
  //  },
  clickAndDrag: null,

  selectedPinId: null,
  prevSelectPinId: null,
}

export const stateSliceEditPoi = createSlice({
  name: "stateSliceEditPoi",
  initialState,
  reducers: {
    setThing: (state, action) => {
      console.log("stateSliceEditPoi_setThing")
      return {
        ...state,
        thing: action.payload
      }
    },

    startEditMode: (state, action) => {
      // console.log("stateSliceEditPoi_startEditMode")

      // let poiId = action.payload.poiId
      return {
        ...initialState,
        editModeOn: true
      }
    },

    endEditMode: (state, action) => {
      // console.log("stateSliceEditPoi_endEditMode")
      return initialState
    },

    setImageDataUrl: (state, action) => {
      console.log({ "stateSliceEditPoi_setImageDataUrl": action.payload })

      let filename = action.payload.filename
      let dataUrl = action.payload.dataUrl
      return {
        ...state,
        imageDataUrl: dataUrl
      }
    },

    setPrimaryPin: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_setPrimaryPin", payload: action.payload })

      let spherePoint = action.payload
      return {
        ...state,
        primaryPin: {
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
      // console.log({ msg: "stateSliceEditPoi_setUpdatedPrimaryPinMeshInScene", payload: action.payload })

      return {
        ...state,
        updatedPrimaryPinMeshInScene: state.updatedPrimaryPinMeshInScene + 1
      }
    },

    setRegionBoundaries: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_setRegionBoundaries", payload: action.payload })

      return {
        ...state,
        regionBoundaries: action.payload
      }
    },

    setUpdatedRegionMeshesInScene: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_updatedRegionMeshesInScene", payload: action.payload })

      return {
        ...state,
        updatedRegionMeshesInScene: state.updatedRegionMeshesInScene + 1
      }
    },

    updateRegionBoundaryPin: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_updateRegionBoundaryPin", payload: action.payload })

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
      // console.log({ msg: "stateSliceEditPoi_startClickAndDrag", payload: action.payload })

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
      // console.log({ msg: "stateSliceEditPoi_updateClickAndDrag", payload: action.payload })

      return {
        ...state,
        clickAndDrag: {
          ...state.clickAndDrag,
          rotorQuaternion: action.payload.rotorQuaternion
        }
      }
    },

    disableClickAndDrag: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_disableClickAndDrag", payload: action.payload })

      return {
        ...state,
        clickAndDrag: null
      }
    },

    setSelectedPin: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_setSelectedPin", payload: action.payload })

      let pin = action.payload
      if (pin == null) {
        // Ok. It means "deselect current item".
      }

      return {
        ...state,
        selectedPinId: pin.id,
        prevSelectPinId: state.selectedPinId,
      }
    }
  }
})

export const editStateActions = stateSliceEditPoi.actions
