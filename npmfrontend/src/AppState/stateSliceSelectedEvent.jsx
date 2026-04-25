import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  eventId: null,
  revision: null,
  title: null,
  tags: [],
  eventIsCreationOfSource: false,
  imageDataUrl: null,
  summary: null,
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
        revision: action.payload.revision ?? null,
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
    clear: () => initialState,
  }
})

export const selectedEventStateActions = stateSliceSelectedEvent.actions
