import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";
import { ConvertXYZToLatLong } from "../GlobeSection/convertLatLongXYZ";
import _ from "lodash";

const initialState = {
  // TODO: change all other POIs and regions to dark grey to indicate that they cannot be highlighted
  editModeOn: true,

  poiId: 99,

  whereLatLongArr: [],  // TODO: delete

  // Format for location and region boundaries:
  //   {
  //     id,
  //     lat,
  //     long,
  //     x,
  //     y,
  //     z
  //   }
  // )
  preciseLocation: null,
  preciseLocationPinMeshExists: false,  // you know, it would be much easier if ThreeJs' meshes could be serialized into this state machine, but they can't, so boolean flags it is
  noRegion: false,
  regionBoundaries: [],
  regionBoundariesPinMeshCount: 0,
  selectedPinId: null,
  // selectedRegionBoundary: null,

  // For use during clicking and dragging a single point or the entire region.
  // Format:
  // {
  //   x,
  //   y,
  //   z
  // }
  mouseIsDown: false,
  mouseDownPos: null,
  clickAndDragEnabled: false,
  clickAndDragMeshOffset: null,  // [x, y, z] // TODO: delete
  clickAndDragGlobePos: null,
  tentativeRegion: [],  // TODO: delete
  thing: null,

  // Using an ever-increasing count is safer than trying to manage where to deactivate an on-off 
  // switch that will trigger state change every time it turns off.
  pinMovedCounter: 0,

  selectedLatLong: null,  // TODO: delete
  prevSelectedLatLong: null // TODO: delete
}

export const stateSliceEditPoi = createSlice({
  name: "stateSliceEditPoi",
  initialState,
  reducers: {
    setThing: (state, action) => {
      // console.log("stateSliceEditPoi_startEditMode")
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

    setPreciseLocation: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_setPreciseLocation", payload: action.payload })

      return {
        ...state,
        preciseLocation: {
          id: action.payload.id,
          lat: action.payload.lat,
          long: action.payload.long,
          x: action.payload.x,
          y: action.payload.y,
          z: action.payload.z
        },
      }
    },

    // TODO: deletePreciseLocation

    setPreciseLocationPinMeshExists: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_setPreciseLocationPinMeshExists", payload: action.payload })

      return {
        ...state,
        preciseLocationPinMeshExists: action.payload
      }
    },

    setNoRegion: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_setNoRegion", payload: action.payload })

      return {
        ...state,
        noRegion: action.payload
      }
    },

    setRegionBoundaries: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_setRegionBoundaries", payload: action.payload })

      // let same = _.isEqual(state.regionBoundaries, action.payload)
      // console.log({ same: same })

      return {
        ...state,
        regionBoundaries: action.payload
      }
    },

    // TODO: deleteRegionBoundaries

    setRegionBoundariesPinMeshCount: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_setRegionBoundariesPinMeshCount", payload: action.payload })

      return {
        ...state,
        regionBoundariesPinMeshCount: action.payload
      }
    },

    enableClickAndDrag: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_enableClickAndDrag", payload: action.payload })

      // let selectedRegionBoundary = state.regionBoundaries.find((boundaryMarker) => boundaryMarker.id == action.payload.whereId)
      return {
        ...state,
        clickAndDragEnabled: true,
        selectedPinId: action.payload.pinId,
        // selectedRegionBoundary: selectedRegionBoundary,
        clickAndDragGlobePos: {
          x: action.payload.startLocation.x,
          y: action.payload.startLocation.y,
          z: action.payload.startLocation.z,
        },
        clickAndDragMeshOffset: action.payload.meshOffset
      }
    },

    disableClickAndDrag: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_disableClickAndDrag", payload: action.payload })

      return {
        ...state,
        clickAndDragEnabled: false,
        selectedPinId: null,
        // selectedRegionBoundary: null,
        clickAndDragGlobePos: null
      }
    },

    updateClickAndDragGlobePos: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_updateClickAndDragGlobePos", payload: action.payload })

      return {
        ...state,
        clickAndDragGlobePos: {
          x: action.payload.x,
          y: action.payload.y,
          z: action.payload.z
        }
      }
    },

    triggerRegionRedraw: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi_triggerRegionRedraw", payload: action.payload })

      return {
        ...state,
        pinMovedCounter: state.pinMovedCounter + 1
      }
    },

    // moveLocationAndRegion(newLatLong)
    //  get new position as xyz vector
    //  get angle between current position vector and new position vector
    //  spherically interpolate "where" position along that same arc
    //  spherically interpolate all "region" positions along that same arc
    //  update "where" latlong
    //  update ""
    // moveLocationOnly(newLatLong)
    // moveRegionPoint(id, newLatLong)

    // TODO: Implement "Command" pattern so that the user can CTRL-Z the last edit


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
