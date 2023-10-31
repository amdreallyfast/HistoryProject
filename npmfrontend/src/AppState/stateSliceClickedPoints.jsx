import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid"

const initialState = {
  latLongs: []
}

export const stateSliceClickedPoints = createSlice({
  name: "stateSliceClickedPoints",
  initialState,
  reducers: {
    addLocation: (state, action) => {
      console.log({ stateSliceClickedPoints_addLocation: action.payload })

      let newEntry = {
        id: uuidv4(),
        lat: action.payload.lat,
        long: action.payload.long
      }

      return {
        ...state,
        latLongs: [...state.latLongs, newEntry]
      }
    },
    removeLocation: (state, action) => {
      console.log({ stateSliceClickedPoints_removeLocation: action.payload })

      let removeId = action.payload
      let index = state.latLongs.findIndex((x) => x.id == removeId)
      if (index == -1) {
        throw new Error(`No location exists with id '${removeId}'`)
      }

      return {
        ...state,
        latLongs: [...state.latLongs.slice(0, index - 1), ...state.latLongs.slice(index + 1)]
      }
    }
  }
})

export const { addLocation, removeLocation } = stateSliceClickedPoints.actions

export const { reducer: stateSliceReducerClickedPoints } = stateSliceClickedPoints

