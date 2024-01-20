import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";
import { ConvertXYZToLatLong } from "../GlobeSection/convertLatLongXYZ";

const initialState = {
  // TODO: change all other POIs and regions to dark grey to indicate that they cannot be highlighted
  editModeOn: true,

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
  // whereMeshChanged: false,
  whereMeshExists: false,  // you know, it would be much easier if ThreeJs' meshes could be serialized into this state machine, but they can't, so boolean flags it is
  noRegion: false,
  regionBoundaries: [],
  regionBoundariesMeshCount: 0,
  selectedPinId: null,
  // meshCountChanged: false,
  // interactableMeshCount: 0,

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

    // setMeshCountChanged: (state, action) => {
    //   console.log({ msg: "stateSliceEditPoi_setMeshCountChanged", payload: action.payload })

    //   return {
    //     ...state,
    //     meshCountChanged: true
    //   }
    // },

    // incrementInteractableMeshCount: (state, action) => {
    //   console.log({ msg: "stateSliceEditPoi_incrementInteractableMeshCount", payload: action.payload })

    //   return {
    //     ...state,
    //     interactableMeshCount: interactableMeshCount + action.payload
    //   }
    // },

    // decrementInteractableMeshCount: (state, action) => {
    //   console.log({ msg: "stateSliceEditPoi_decrementInteractableMeshCount", payload: action.payload })

    //   if (interactableMeshCount - action.payload < 0) {
    //     throw new Error(`Cannot decrement below 0.
    //     interactableMeshCount: '${interactableMeshCount}', decrement value: '${action.payload}'`)
    //   }

    //   return {
    //     ...state,
    //     interactableMeshCount: interactableMeshCount - action.payload
    //   }
    // },

    /*
    All the things
    */


    // 4-frames needed to update the scene's to account for changes in interactable meshes.
    //  1. Where changed
    //  2. EditRegion creates a PinMesh
    //  3. EditRegion notifes that the 
    setWhere: (state, action) => {
      console.log({ msg: "stateSliceEditPoi_setWhere", payload: action.payload })

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

    setWhereMeshExists: (state, action) => {
      console.log({ msg: "stateSliceEditPoi_setWhereMeshExists", payload: action.payload })

      return {
        ...state,
        whereMeshExists: action.payload
      }
    },

    // whereMeshChangedHandled: (state, action) => {
    //   console.log({ msg: "stateSliceEditPoi_whereMeshChangedHandled" })

    //   return {
    //     ...state,
    //     whereMeshChanged: false
    //   }
    // },



    // deleteWhere: (state, action) => {
    //   console.log({ msg: "stateSliceEditPoi_deleteWhere", payload: action.payload })

    //   if (where) {
    //     return {
    //       ...state,
    //       where: null,
    //       // interactableMeshCount: interactableMeshCount - 1
    //       whereMeshChanged: true
    //     }
    //   }

    //   // No "where" existed => No change.
    //   return state
    // },

    setNoRegion: (state, action) => {
      console.log({ msg: "stateSliceEditPoi_setNoRegion", payload: action.payload })

      return {
        ...state,
        noRegion: action.payload
      }
    },

    setRegionBoundaries: (state, action) => {
      console.log({ msg: "stateSliceEditPoi_setRegionBoundaries", payload: action.payload })

      return {
        ...state,
        regionBoundaries: action.payload
      }
    },

    setRegionBoundariesMeshCount: (state, action) => {
      console.log({ msg: "stateSliceEditPoi_setRegionBoundariesMeshesChanged", payload: action.payload })

      return {
        ...state,
        regionBoundariesMeshCount: action.payload
      }
    },

    // setRegionBoundariesMeshesChangedHandled: (state, action) => {
    //   console.log({ msg: "stateSliceEditPoi_setRegionBoundariesMeshesChangedHandled", payload: action.payload })

    //   return {
    //     ...state,
    //     regionBoundariesMeshesChanged: false
    //   }
    // },




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

export const editStateActions = stateSliceEditPoi.actions
