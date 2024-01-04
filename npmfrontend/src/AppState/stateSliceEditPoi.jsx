import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";

const initialState = {
  editModeOn: true,

  // TODO: delete
  whereLatLongArr: [],

  // Each "where" and "region" point consists of a selectable pin object with lat, long, x, y, z.
  where: null,
  region: [],

  // For use during clicking and dragging a single point or the entire region.
  // Note: Each "tentative" value is only x,y,z
  tentativeWhere: null,
  tentativeRegion: [],

  selectedLatLong: null,
  prevSelectedLatLong: null
}

export const stateSliceEditPoi = createSlice({
  name: "stateSliceEditPoi",
  initialState,
  reducers: {
    startEditMode: (state, action) => {
      // console.log("stateSliceEditPoi_startEditMode")
      return {
        ...state,
        editModeOn: true
      }
    },
    endEditMode: (state, action) => {
      // console.log("stateSliceEditPoi_endEditMode")
      return {
        ...state,
        editModeOn: false
      }
    },

    /*
    All the things
    */
    setLocation: (state, action) => {
      console.log({ "stateSliceEditPoi_setLocation": action.payload })

      return {
        ...state,
        where: {
          id: uuid(),
          lat: action.payload.lat,
          long: action.payload.long,
          x: action.payload.x,
          y: action.payload.y,
          z: action.payload.z
        }
      }
    },
    deleteLocation: (state, action) => {
      console.log({ "stateSliceEditPoi_deleteLocation": action.payload })

      return {
        ...state,
        where: null
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
      // console.log({ "stateSliceEditPoi_addLocation": action.payload })

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
      // console.log({ "stateSliceEditPoi_removeLocation": action.payload })

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
      // console.log({ "stateSliceEditPoi_setSelectedLatLong": action.payload })

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

export const {
  startEditMode,
  endEditMode,
  setLocation,
  deleteLocation,
  addLocation,
  removeLocation,
  setSelectedLatLong
} = stateSliceEditPoi.actions

export const editStateActions = stateSliceEditPoi.actions
