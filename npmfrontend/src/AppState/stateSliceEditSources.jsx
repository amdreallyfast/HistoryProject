import { createSlice } from "@reduxjs/toolkit";
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
  // sources: {}

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
  // complete: false,
  // flaggedForDeletion: false, //??will this even work??

  // Set on back end
  id: null,                 // unique version of this source revision
  sourceId: null,           // constant version across all revisions
  revision: 0,              // establishes order in which versions are made

  // Set in form
  title: null,              // required string
  isbn: null,               // optional string
  publicationTime: {
    earliestYear: null,   // required
    earliestMonth: null,  // optional
    earliestDay: null,    // optional
    latestYear: null,     // required
    latestMonth: null,    // optional
    latestDay: null,      // optional
  },
  authors: [],
  whereInSource: null,
  complete: false,
  // errorMsg: null,
}

// Author
const authorInitialState = {
  id: null,                 // unique version of this author revision
  authorId: null,           // constant version across all revisions
  revision: 0,              // establishes order in which versions are made
  name: null,               // required string
  lifetimeTime: {
    earliestYear: null,   // required
    earliestMonth: null,  // optional
    earliestDay: null,    // optional
    latestYear: null,     // required
    latestMonth: null,    // optional
    latestDay: null,      // optional
  }
}

const copyState = (state) => {
  console.log({ "stateSliceEditSources.copyState(state)": state })

  let copy = {}
  let sourceKeys = Object.keys(state)
  sourceKeys.forEach(sourceEditId => {
    let source = { ...state[sourceEditId] }
    source.publicationTime = { ...state[sourceEditId].publicationTime }
    copy[sourceEditId] = source
  });

  return copy
}

const evaluateSourceComplete = (source) => {
  console.log("stateSliceEditSources.evaluateSourceComplete")

  let complete = true
  complete &= Boolean(source.title)
  complete &= isNaN(Number(source.publicationTime.earliestYear))
  complete &= isNaN(Number(source.publicationTime.earliestMonth))
  complete &= isNaN(Number(source.publicationTime.earliestDay))

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

    loadSources: (state, action) => {
      console.log({ "stateSliceEditSources.loadSources": action.payload })

      let sourcesArray = action.payload
      let newState = {}
      sourcesArray.forEach((source) => {
        let editId = uuid()
        newState[editId] = {
          ...sourceInitialState,
          title: source.title || null,
          isbn: source.isbn || null,
          whereInSource: source.whereInSource || null,
          publicationTime: {
            earliestYear: source.publicationTime?.earliestYear || null,
            earliestMonth: source.publicationTime?.earliestMonth || null,
            earliestDay: source.publicationTime?.earliestDay || null,
            latestYear: source.publicationTime?.latestYear || null,
            latestMonth: source.publicationTime?.latestMonth || null,
            latestDay: source.publicationTime?.latestDay || null,
          },
          authors: source.authors || [],
        }
      })
      return newState
    },

    newSource: (state, action) => {
      console.log("stateSliceEditSources.newSource")

      let editId = action.payload.id
      let newSource = {
        ...sourceInitialState,
        id: "this is my source revisionId",
        sourceId: "this is my persistant sourceId"
      }

      // Duplicate existing state
      // Note: Need to jump through some syntactical hoops because I'm not sure that the state machine was designed to hold an arbitrary set of key-value pairs
      // ...does this code make me a bad person?
      let newState = { ...state }
      newState[editId] = newSource
      return {
        ...newState,
      }
    },

    deleteSource: (state, action) => {
      console.log("stateSliceEditSources.deleteSource")

      let editId = action.payload
      let newState = { ...state }
      delete newState[editId]

      return {
        ...newState
      }
    },

    updateSourceTitle: (state, action) => {
      console.log("stateSliceEditSources.updateSourceTitle")

      let editId = action.payload.editId
      let newTitle = action.payload.title

      let newState = copyState(state)
      newState[editId].title = newTitle
      newState[editId].complete = evaluateSourceComplete(newState[editId])
      return {
        ...newState,
      }
    },

    updateSourcePubDateEarliestYear: (state, action) => {
      console.log("stateSliceEditSources.updateSourcePubDateEarliestYear")

      let newState = copyState(state)
      let editId = action.payload.editId
      let year = action.payload.value
      newState[editId].publicationTime.earliestYear = year
      newState[editId].complete = evaluateSourceComplete(newState[editId])
      return {
        ...newState,
      }
    },

    updateSourcePubDateEarliestMonth: (state, action) => {
      console.log("stateSliceEditSources.updateSourcePubDateEarliestMonth")

      let newState = copyState(state)
      let editId = action.payload.editId
      let month = action.payload.value
      newState[editId].publicationTime.earliestMonth = month
      newState[editId].complete = evaluateSourceComplete(newState[editId])
      return {
        ...newState,
      }
    },

    updateSourcePubDateEarliestDay: (state, action) => {
      console.log("stateSliceEditSources.updateSourcePubDateEarliestDay")

      let newState = copyState(state)
      let editId = action.payload.editId
      let day = action.payload.value
      newState[editId].publicationTime.earliestDay = day
      newState[editId].complete = evaluateSourceComplete(newState[editId])
      return {
        ...newState,
      }
    },

    updateSourcePubDateLatestYear: (state, action) => {
      console.log("stateSliceEditSources.updateSourcePubDateLatestYear")

      let newState = copyState(state)
      let editId = action.payload.editId
      let year = action.payload.value
      newState[editId].publicationTime.latestYear = year
      newState[editId].complete = evaluateSourceComplete(newState[editId])
      return {
        ...newState,
      }
    },

    updateSourcePubDateLatestMonth: (state, action) => {
      console.log("stateSliceEditSources.updateSourcePubDateLatestMonth")

      let newState = copyState(state)
      let editId = action.payload.editId
      let month = action.payload.value
      newState[editId].publicationTime.latestMonth = month
      newState[editId].complete = evaluateSourceComplete(newState[editId])
      return {
        ...newState,
      }
    },

    updateSourcePubDateLatestDay: (state, action) => {
      console.log("stateSliceEditSources.updateSourcePubDateLatestDay")

      let newState = copyState(state)
      let editId = action.payload.editId
      let day = action.payload.value
      newState[editId].publicationTime.latestDay = day
      newState[editId].complete = evaluateSourceComplete(newState[editId])
      return {
        ...newState,
      }
    }
  }
})

export const editSourcesStateActions = stateSliceEditSources.actions
