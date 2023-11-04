import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  whereLatLongs: []
}

export const stateSliceEditPoi = createSlice({
  name: "stateSliceEditPoi",
  initialState,
  reducers: {
    addLocation: (state, action) => {
      console.log({ stateSliceEditPoi_addLocation: action.payload })

      let newEntry = {
        id: uuidv4(),
        lat: action.payload.lat,
        long: action.payload.long
      }

      return {
        ...state,
        whereLatLongs: [...state.whereLatLongs, newEntry]
      }
    },
    removeLocation: (state, action) => {
      console.log({ stateSliceEditPoi_removeLocation: action.payload })

      let removeId = action.payload
      let index = state.whereLatLongs.findIndex((x) => x.id == removeId)
      if (index == -1) {
        throw new Error(`No location exists with id '${removeId}'`)
      }

      return {
        ...state,
        whereLatLongs: [...state.whereLatLongs.slice(0, index - 1), ...state.whereLatLongs.slice(index + 1)]
      }
    }
  }
})

export const { addLocation, removeLocation } = stateSliceEditPoi.actions
