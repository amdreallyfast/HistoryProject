import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedPoi: null,
  prevSelectedPoi: null
}

//??is "export" needed here??
export const stateSliceSelectedPoi = createSlice({
  name: "stateSliceSelectedPoi",
  initialState,
  reducers: {
    setSelectedPoi: (state, action) => {
      console.log({ msg: `setSelectedPoi()`, payload: action.payload })
      return {
        ...state,
        selectedPoi: action.payload,
        prevSelectedPoi: state.selectedPoi
      }
    }
  }
})

export const { setSelectedPoi } = stateSliceSelectedPoi.actions

// Note: Export the state slice's "reducer" property as a longer name
export const { reducer: stateSliceReducerSelectedPoi } = stateSliceSelectedPoi
