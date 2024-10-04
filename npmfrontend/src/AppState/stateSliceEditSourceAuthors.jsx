import { createSlice } from "@reduxjs/toolkit";

// Format:
//  authors: [
//    // tempId only for front end
//    guid: <see below>
//  ]
const initialState = {
  authors: []
}

const authorInitialState = {
  id: null,                 // unique version of this author
  authorID: null,           // persistent version of this author
  revision: 0,              // establishes order in which versions are made
  name: null,               // required string
  lifetimeTimeRange: {
    lowerBoundYear: null,   // required
    lowerBoundMonth: null,  // optional
    lowerBoundDay: null,    // optional

    upperBoundYear: null,   // required
    upperBoundMonth: null,  // optional
    upperBoundDay: null,    // optional
  }
}

export const stateSliceEditSourceAuthors = createSlice({
  name: "stateSliceEditSourceAuthors",
  initialState,
  reducers: {
    // template
    setThing: (state, action) => {
      console.log("stateSliceEditSourceAuthors.setThing")
      return {
        ...state,
        thing: action.payload
      }
    },
  }
})

export const editSourceAuthorsStateActions = stateSliceEditSourceAuthors.actions
