import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";

const initialState = {
  // TODO: change all other POIs and regions to dark grey to indicate that they cannot be highlighted
  editModeOn: true,

  poiId: 99,

  whereLatLongArr: [],  // TODO: delete

  primaryPinMeshExists: false,  // you know, it would be much easier if ThreeJs' meshes could be serialized into this state machine, but they can't, so boolean flags it is

  // Format for location and region boundaries:
  //  {
  //    id,
  //    lat,
  //    long,
  //    x,
  //    y,
  //    z
  //  }
  primaryPinPos: null,

  // TODO: change from array to object, key is where.id, ??only update "counter" and where pin instead of re-creating entire array??
  regionBoundaries: [],

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
  //        whereId: <whereId>
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

  selectedLatLong: null,  // TODO: delete
  prevSelectedLatLong: null, // TODO: delete
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
      return {
        ...state,
        editModeOn: true
      }
    },

    endEditMode: (state, action) => {
      // console.log("stateSliceEditPoi_endEditMode")
      return initialState
    },

    setPrimaryPinPos: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_setPrimaryPinPos", payload: action.payload })

      return {
        ...state,
        primaryPinPos: {
          id: action.payload.id,
          lat: action.payload.lat,
          long: action.payload.long,
          x: action.payload.x,
          y: action.payload.y,
          z: action.payload.z
        },
      }
    },

    setPrimaryPinMeshExists: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_setPrimaryPinMeshExists", payload: action.payload })

      return {
        ...state,
        primaryPinMeshExists: action.payload
      }
    },

    setRegionBoundaries: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_setRegionBoundaries", payload: action.payload })

      return {
        ...state,
        regionBoundaries: action.payload
      }
    },

    updateRegionBoundaryPin: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_updateRegionBoundaryPin", payload: action.payload })

      // Expected payload:
      //  {
      //    id,
      //    lat,
      //    long,
      //    x,
      //    y,
      //    z
      //  }
      let updatedWhere = action.payload
      let updatedBoundaries = state.regionBoundaries.map((boundaryMarker, index) => {
        if (boundaryMarker.id == updatedWhere.id) {
          return updatedWhere
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

      // Expected payload:
      //  {
      //    enabled: false,
      //    mesh: {
      //      name: name,
      //      uuid: guid,
      //      userData: {
      //        poiId: poiId,
      //        whereId: whereId
      //      }
      //    },
      //    initialOffsetQuaternion: { w, x, y, z },
      //    rotorQuaternion: { w, x, y, z }
      //  },
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

    // TODO: delete with "whereLatLongArr"
    addLocation: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_addLocation", payload: action.payload })

      let newEntry = {
        id: uuid(),
        lat: action.payload.lat,
        long: action.payload.long
      }

      return {
        ...state,
        whereLatLongArr: [...state.whereLatLongArr, newEntry]
      }
    },

    // TODO: delete with "whereLatLongArr"
    removeLocation: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_removeLocation", payload: action.payload })

      let removeId = action.payload
      let index = state.whereLatLongArr.findIndex((x) => x.id == removeId)
      if (index == -1) {
        throw new Error(`No location exists with id '${removeId}'`)
      }

      return {
        ...state,
        whereLatLongArr: [...state.whereLatLongArr.slice(0, index - 1), ...state.whereLatLongArr.slice(index + 1)]
      }
    },

    setSelectedLatLong: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_setSelectedLatLong", payload: action.payload })

      if (action.payload == null) {
        // Deselect current item.
      }

      // Note: If the payload is a null ID, then the find will fail and newSelectedLatLong will be
      // null. This is expected. This is one way that the currently selected latLong item is
      // deselected.
      let selectedLatLongId = action.payload
      let newSelectedLatLong = state.whereLatLongArr.find((x) => x.id == selectedLatLongId)
      return {
        ...state,
        prevSelectedLatLong: state.selectedLatLong,
        selectedLatLong: newSelectedLatLong
      }
    }
  }
})

export const editStateActions = stateSliceEditPoi.actions
