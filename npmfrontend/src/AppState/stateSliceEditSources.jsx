import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid"

const initialState = {
  // Format:
  //  sources: {
  //    // tempId only for front end
  //    guid: {
  //        whereInSource: string,
  //        source: <see below>
  //      }
  //  }
  sources: {}


    ?? maybe just take an int and use an ordered array instead??


}

// Source
const singleSourceInitialState = {
  id: null,                 // unique version of the source
  sourceId: null,           // persistent version of this source
  revision: 0,              // establishes order in which versions are made
  title: null,              // required string
  ISBN: null,               // optional string
  publicationTimeRange: {
    lowerBoundYear: null,   // required
    lowerBoundMonth: null,  // optional
    lowerBoundDay: null,    // optional
    upperBoundYear: null,   // required
    upperBoundMonth: null,  // optional
    upperBoundDay: null,    // optional
  },
  authors: []
}

// Author
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

export const stateSliceEditSource = createSlice({
  name: "stateSliceEditSource",
  initialState,
  reducers: {
    // template
    setThing: (state, action) => {
      console.log("stateSliceEditSource.setThing")
      return {
        ...state,
        thing: action.payload
      }
    },

    import: (state, action) => {
      console.log("stateSliceEditSource.import")

      let importObject = action.payload
      let tempId = uuid()
      return {
        // TODO: import everything
      }
    }

    /*
    importSource                      // takes an array of source objects + their "where to find"
    newSource                         // takes a new key that will be used to retrieve it
    deleteSource                      // takes a key
    updateSourceTitle                 // takes a key and a string
    updateSourceISBN                  // takes a key and a string
    updatePublicationLowerBoundYear   // takes a key and an integer or null
    updatePublicationLowerBoundMonth  // takes a key and an integer or null
    updatePublicationLowerBoundDay    // takes a key and an integer or null
    updatePublicationUpperBoundYear   // takes a key and an integer or null
    updatePublicationUpperBoundMonth  // takes a key and an integer or null
    updatePublicationUpperBoundDay    // takes a key and an integer or null

    newAuthor                           // takes a new key that will be used to retrieve it
    deleteAuthor                        // takes a key
    updateAuthorTitle                   // takes a key and a string
    updateAuthorISBN                    // takes a key and a string
    updateAuthorLifetimeLowerBoundYear  // takes a key and an integer or null
    updateAuthorLifetimeLowerBoundMonth // takes a key and an integer or null
    updateAuthorLifetimeLowerBoundDay   // takes a key and an integer or null
    updateAuthorLifetimeUpperBoundYear  // takes a key and an integer or null
    updateAuthorLifetimeUpperBoundMonth // takes a key and an integer or null
    updateAuthorLifetimeUpperBoundDay   // takes a key and an integer or null
    */

  }
})

export const editSourceStateActions = stateSliceEditSource.actions
