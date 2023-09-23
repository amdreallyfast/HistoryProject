import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  pointsOfInterest: null,

  // TODO: ??rename -> "selectedPoiJson"??
  selectedPoi: null
}

//??is "export" needed here??
export const stateSlicePointsOfInterest = createSlice({
  name: "stateSlicePointsOfInterest",
  initialState,
  reducers: {
    setPointsOfInterest: (state, action) => {
      console.log({ msg: `setPointsOfInterest()`, payload: action.payload })
      return {
        ...state,
        pointsOfInterest: action.payload,
        selectedPoi: null
      }
    },
    setSelectedPoi: (state, action) => {
      console.log({ msg: `setSelectedPoi()`, payload: action.payload.name.common })
      return {
        ...state,
        selectedPoi: action.payload
      }
    }
  }
})

export const { setPointsOfInterest, setSelectedPoi } = stateSlicePointsOfInterest.actions

// Note: Export the state slice's "reducer" property as a longer name
export const { reducer: stateSliceReducerPointsOfInterest } = stateSlicePointsOfInterest
