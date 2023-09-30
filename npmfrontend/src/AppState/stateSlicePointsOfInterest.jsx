import { createSlice } from "@reduxjs/toolkit"
import gsap from "gsap"

const initialState = {
  pointsOfInterest: null,
  selectedPoi: null,
  prevSelectedPoi: null
}

//??is "export" needed here??
export const stateSlicePointsOfInterest = createSlice({
  name: "stateSlicePointsOfInterest",
  initialState,
  reducers: {
    setPointsOfInterest: (state, action) => {
      // console.log({ msg: `setPointsOfInterest()`, payload: action.payload })

      // Reset selectedPoi along with recording the new collection.
      return {
        ...state,
        pointsOfInterest: action.payload,
        selectedPoi: null,
        prevSelectedPoi: null
      }
    },
    setSelectedPoi: (state, action) => {
      // console.log({ msg: `setSelectedPoi()`, payload: action.payload })

      return {
        ...state,
        selectedPoi: action.payload,
        prevSelectedPoi: state.selectedPoi
      }
    }
  }
})

export const { setPointsOfInterest, setSelectedPoi } = stateSlicePointsOfInterest.actions

// Note: Export the state slice's "reducer" property as a longer name
export const { reducer: stateSliceReducerPointsOfInterest } = stateSlicePointsOfInterest
