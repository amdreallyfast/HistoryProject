import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  eventId: -1,
  revisionAuthor: "",
  title: "the things",
  imageDataUrl: null,
  tags: ["tag1", "tag2"],
  primaryLoc: null,
  regionBoundaries: [],
}

export const stateSliceSelectedPoi = createSlice({
  name: "stateSliceSelectedPoi",
  initialState,
  reducers: {
    load: (state, action) => {
      console.log({ "stateSliceSelectedPoi: load": action.payload })

      let newState = initialState
      newState.eventId = action.payload.eventId
      newState.revisionAuthor = action.payload.revisionAuthor
      newState.title = action.payload.title
      newState.imageDataUrl = action.payload.imageDataUrl
      newState.tags = action.payload.tags
      newState.primaryLoc = action.payload.primaryLoc
      newState.regionBoundaries = action.payload.regionBoundaries
      return newState
    },
  }
})

export const selectedPoiActions = stateSliceSelectedPoi.actions
