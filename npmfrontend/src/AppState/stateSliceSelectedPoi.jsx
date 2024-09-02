import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  eventId: -1,
  title: "the things",
  tags: ["tag1", "tag2"],
  imageDataUrl: null,
  summary: "oh my goodness things have happened here",
  sources: [],
  revisionAuthor: "",
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
      newState.title = action.payload.title
      newState.tags = action.payload.tags
      newState.imageDataUrl = action.payload.imageDataUrl
      newState.summary = action.payload.summary
      newState.primaryLoc = action.payload.primaryLoc
      newState.regionBoundaries = action.payload.regionBoundaries
      newState.revisionAuthor = action.payload.revisionAuthor
      return newState
    },
  }
})

export const selectedPoiActions = stateSliceSelectedPoi.actions
