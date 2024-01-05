import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  meshes: [],
}

//??necessary??

export const stateSliceIntersectableMeshes = createSlice({
  name: "stateSliceIntersectableMeshes",
  initialState,
  reducers: {
    add: (state, action) => {
      console.log({ msg: "stateSliceIntersectableMeshes_add", payload: action.payload })

      state.meshes.push(action.payload)
      return state
    },
    remove: (state, action) => {
      // TODO: this
      // re-implement as a dictionary where each of the items is keyed to a "whereId"
    },
    reset: (state, action) => {
      console.log({ msg: "stateSliceIntersectableMeshes_set", payload: action.payload })

      return initialState
    },
  }
})

export const intersectableMeshesStateActions = stateSliceIntersectableMeshes.actions
