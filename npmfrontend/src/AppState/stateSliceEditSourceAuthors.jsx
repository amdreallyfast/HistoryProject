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
  // Format:
  //  {
  //    id: guid,        // unique version of the source
  //    sourceId: guid,  // persistent version of this source
  //    revision: int,   // establishes order in which versions are made
  //    title: string,   // required string
  //    ISBN: string,    // optional string
  //    publicationTimeRange: {
  //      lowerBoundYear: int,  // required
  //      lowerBoundMonth: int, // optional
  //      lowerBoundDay: int,   // optional
  //      upperBoundYear: int,  // required
  //      upperBoundMonth: int, // optional
  //      upperBoundDay: int,   // optional
  //    },
  //    authors: [
  //      {
  //        id: guid,        // unique version of this author
  //        authorId: guid,  // persistent version of this author
  //        revision: int,   // establishes order in which versions are made
  //        name: null,      // required string
  //        lifetimeTimeRange: {
  //          lowerBoundYear: int,  // required
  //          lowerBoundMonth: int, // optional
  //          lowerBoundDay: int,   // optional
  //          upperBoundYear: int,  // required
  //          upperBoundMonth: int, // optional
  //          upperBoundDay: int,   // optional
  //        }
  //      }
  //    ]
  //  }
  id: null,
  sourceId: null,
  revision: 0,
  title: null,
  ISBN: null,
  publicationTimeRange: {
    lowerBoundYear: null,
    lowerBoundMonth: null,
    lowerBoundDay: null,

    upperBoundYear: null,
    upperBoundMonth: null,
    upperBoundDay: null,
  },
  authors: [],


  // detailedLocation:  // this should be separate from the source itself
}

export const stateSliceEditSourceAuthors = createSlice({
  name: "stateSliceEditSourceAuthors",
  initialState,
  reducers: {
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
