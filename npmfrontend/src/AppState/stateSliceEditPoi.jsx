import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";
import { ConvertXYZToLatLong } from "../GlobeSection/convertLatLongXYZ";

const initialState = {
  // TODO: change all other POIs and regions to dark grey to indicate that they cannot be highlighted
  editModeOn: true,
  editRegionMeshCount: false,

  poiId: 99,

  whereLatLongArr: [],  // TODO: delete

  // TODO: ??combine main pin and region boundary pins into a single collection??

  // Each "where" and "region" point consists of a selectable pin object with lat, long, x, y, z.
  // Format:
  //  where: {
  //    id: <guid>,
  //    lat,
  //    long,
  //    x,
  //    y,
  //    z
  //  }
  where: null,
  region: [],
  selectedPinId: null,

  // For use during clicking and dragging a single point or the entire region.
  // Format:
  // {
  //   x,
  //   y,
  //   z
  // }
  clickAndDrag: false,
  tentativeWhere: null,
  tentativeRegion: [],



  selectedLatLong: null,  // TODO: delete
  prevSelectedLatLong: null // TODO: delete
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
      return initialState
    },
    setEditRegionMeshCount: (state, action) => {
      console.log({ msg: "stateSliceEditPoi_setEditRegionMeshCount", payload: action.payload })

      return {
        ...state,
        editRegionMeshCount: action.payload
      }
    },

    /*
    All the things
    */
    setLocation: (state, action) => {
      console.log({ msg: "stateSliceEditPoi_setLocation", payload: action.payload })

      return {
        ...state,
        where: {
          id: action.payload.id,
          lat: action.payload.lat,
          long: action.payload.long,
          x: action.payload.x,
          y: action.payload.y,
          z: action.payload.z
        },
      }
    },
    enableClickAndDrag: (state, action) => {
      console.log({ msg: "stateSliceEditPoi_enableClickAndDrag", payload: action.payload })
      return {
        ...state,
        clickAndDrag: true,
        selectedPinId: action.payload.pinId,
        tentativeWhere: {
          x: state.where.x,
          y: state.where.y,
          z: state.where.z
        }
      }
    },
    disableClickAndDrag: (state, action) => {
      console.log({ msg: "stateSliceEditPoi_disableClickAndDrag", payload: action.payload })

      return {
        ...state,
        clickAndDrag: false,
        selectedPinId: null,
        tentativeWhere: null
      }
    },
    updateClickAndDrag: (state, action) => {
      return {
        ...state,
        tentativeWhere: {
          x: action.payload.x,
          y: action.payload.y,
          z: action.payload.z
        }
      }
    },
    // setTentativeLocation: (state, action) => {
    //   console.log({ "stateSliceEditPoi_setTentativeLocation": action.payload })

    //   if (action.payload == null) {
    //     return {
    //       ...state,
    //       tentativeWhere: null
    //     }
    //   }
    //   else {
    //     return {
    //       ...state,
    //       tentativeWhere: {
    //         x: action.payload.x,
    //         y: action.payload.y,
    //         z: action.payload.z
    //       }
    //     }
    //   }
    // },
    deleteLocation: (state, action) => {
      console.log({ msg: "stateSliceEditPoi_deleteLocation", payload: action.payload })

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

// export const {
//   startEditMode,
//   endEditMode,
//   setLocation,
//   deleteLocation,
//   addLocation,
//   removeLocation,
//   setSelectedLatLong
// } = stateSliceEditPoi.actions

export const editStateActions = stateSliceEditPoi.actions
