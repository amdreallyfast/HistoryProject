import { createSlice } from "@reduxjs/toolkit";

// There are enough editable items in a single source that editing one justifies its own state machine.
const initialState = {

}

export const stateSliceEditSource = createSlice({
  name: "stateSliceEditSource",
  initialState,
  reducers: {
    setThing: (state, action) => {
      console.log("stateSliceEditSource.setThing")
      return {
        ...state,
        thing: action.payload
      }
    },
  }
})

export const editSourceStateActions = stateSliceEditSource.actions
