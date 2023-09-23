import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  pointsOfInterest: ["boogie"],
  selectedPoi: "the POI"
}

//??is "export" needed here??
export const stateSlicePointsOfInterest = createSlice({
  name: "stateSlicePointsOfInterest",
  initialState,
  reducers: {
    setPointsOfInterest: (state, action) => {
      // state.pointsOfInterest = action.pointsOfInterest
      // state.selectedPoi = null
      console.log({ msg: `setPointsOfInterest()`, action: action.payload })
    },
    setSelectedPoi: (state, action) => {
      // state.selectedPoi = action.selectedPoi
      console.log({ msg: `setSelectedPoi()`, action: action.payload })
    }
  }
})

export const { setPointsOfInterest, setSelectedPoi } = stateSlicePointsOfInterest.actions

// Note: Export the state slice's "reducer" property as a longer name
export const { reducer: stateSliceReducerPointsOfInterest } = stateSlicePointsOfInterest
