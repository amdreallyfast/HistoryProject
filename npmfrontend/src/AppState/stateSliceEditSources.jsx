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
  // sources: []

  // Note: _Must_ be an object. The state objects are some kind of "proxy" object, which makes identifying them in an array a real pain. However, if I use an object iwth the editId as a key, then it is easy to delete them.
  // Also Note: I haven't tried editing individual fields yet. Only editing and deleting. We'll see if this works.
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
  // editId: null,
  complete: false,
  // flaggedForDeletion: false, //??will this even work??

  // Set on back end
  id: null,                 // unique version of this source revision
  sourceId: null,           // constant version across all revisions
  revision: 0,              // establishes order in which versions are made

  // Set in form
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
  authors: [],
  whereInSource: null
}

// Author
const authorInitialState = {
  id: null,                 // unique version of this author revision
  authorId: null,           // constant version across all revisions
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

const sourceIsComplete = (sourceInfo) => {
  let complete = true
  complete &= sourceInfo.title?.trim().length > 0
  complete &= Number.isInteger(sourceInfo.publicationTimeRange.lowerBoundYear)
  complete &= Number.isInteger(sourceInfo.publicationTimeRange.upperBoundYear)
  complete &= sourceInfo.authors.length > 0
  complete &= sourceInfo.whereInSource?.trim().length > 0
  // TODO: author in-depth compare

  return complete
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
      let newSource = {
        ...sourceInitialState,
        // editId: newId,
        id: "this is my source revisionId",
        sourceId: "this is my persistant sourceId",
        title: action.payload.title
      }
      newSource.complete = sourceIsComplete(newSource)

      // let mySources = [...state.sources]
      // mySources.push(newSource)

      let mySources = { ...state.sources }
      mySources[newId] = newSource

      // console.log("things")
      return {
        ...state,
        sources: mySources
      }
    },

    deleteSource: (state, action) => {
      console.log("stateSliceEditSources.deleteSource")

      let editId = action.payload
      // let mySources = [...state.sources]
      // let thing = { ...state.sources }
      // mySources.filter((source) => source.editId != editId)

      let mySources = { ...state.sources }
      delete mySources[editId]

      return {
        ...state,
        sources: mySources
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
