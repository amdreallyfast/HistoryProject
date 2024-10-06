import { createSlice } from "@reduxjs/toolkit";
import { generateUUID } from "three/src/math/MathUtils.js";
import { v4 as uuid } from "uuid"







// ??is this necessary? when it is time to submit the event changes, won't it be awkward to try to re-assemble everything??









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

  /*
    new source:
      state actions cannot return anything to caller,
        so have the creating component create a guid
        call the "new source" or "new author" state function with the guid
        create a new EditSource or EditSourceAuthor object using that new guid
  
      ...or use an ordered array, 
        take the size of the current array
        call the "new source" or "new author" state function
        create a new EditSource or EditSourceAuthor object using the previous array size + 1
      
      either approach should work, but I think that the array should be easier to be orderly about.
  */


}

// Source
const sourceInitialState = {
  id: null,                 // unique version of the source
  sourceId: null,           // persistent version of this source
  revision: 0,              // establishes order in which versions are made
  title: null,              // required string
  isbn: null,               // optional string
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

export const stateSliceEditSources = createSlice({
  name: "stateSliceEditSources",
  initialState,
  reducers: {
    // template
    setThing: (state, action) => {
      console.log("stateSliceEditSources.setThing")
      return {
        ...state,
        thing: action.payload
      }
    },

    importSource: (state, action) => {
      console.log("stateSliceEditSources.importSource")

      let importObject = action.payload
      let tempId = uuid()
      let tempId2 = generateUUID()
      return {
        ...state
        // TODO: import everything
      }
    },

    newSource: (state, action) => {
      console.log("stateSliceEditSources.newSource")

      // let tempId = action.payload


      // let things = [singleSourceInitialState]
      // things = [...things, singleSourceInitialState]
      // things[0].id = generateUUID()

      console.log({ "existing sources:": state.sources })

      let newId = action.payload.id
      let mySources = { ...state.sources }
      mySources[newId] = {
        ...sourceInitialState,
        id: "this is my sourceId",
        title: action.payload.title
      }

      console.log("things")
      return {
        ...state,
        sources: mySources
      }
    },

    deleteSource: (state, action) => {
      console.log("stateSliceEditSources.deleteSource")

      let importObject = action.payload
      let tempId = uuid()
      return {
        ...state
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

export const editSourcesStateActions = stateSliceEditSources.actions
