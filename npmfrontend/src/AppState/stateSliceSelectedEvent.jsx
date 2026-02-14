import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  eventId: -1,
  title: "the things",
  tags: ["tag1", "tag2"],
  eventIsCreationOfSource: false,
  imageDataUrl: null,
  summary: "oh my goodness things have happened here",
  eventTime: {
    earliestYear: null,
    earliestMonth: null,
    earliestDay: null,
    latestYear: null,
    latestMonth: null,
    latestDay: null,
  },
  sources: [],
  revisionAuthor: "",
  primaryLoc: null,
  regionBoundaries: [],
}

export const stateSliceSelectedEvent = createSlice({
  name: "stateSliceSelectedEvent",
  initialState,
  reducers: {
    load: (state, action) => {
      console.log({ "stateSliceSelectedEvent: load": action.payload })

      return {
        ...initialState,
        eventId: action.payload.eventId,
        title: action.payload.title,
        tags: action.payload.tags || [],
        eventIsCreationOfSource: action.payload.eventIsCreationOfSource || false,
        imageDataUrl: action.payload.imageDataUrl || null,
        summary: action.payload.summary || null,
        eventTime: action.payload.eventTime || initialState.eventTime,
        sources: action.payload.sources || [],
        primaryLoc: action.payload.primaryLoc || null,
        regionBoundaries: action.payload.regionBoundaries || [],
        revisionAuthor: action.payload.revisionAuthor || "",
      }
    },
  }
})

export const selectedEventStateActions = stateSliceSelectedEvent.actions
