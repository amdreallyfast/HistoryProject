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
  publicationTimeRange: {
    lowerBoundYear: null,   // required
    lowerBoundMonth: null,  // optional
    lowerBoundDay: null,    // optional
    upperBoundYear: null,   // required
    upperBoundMonth: null,  // optional
    upperBoundDay: null,    // optional
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
  lifetimeTimeRange: {
    lowerBoundYear: null,   // required
    lowerBoundMonth: null,  // optional
    lowerBoundDay: null,    // optional

    upperBoundYear: null,   // required
    upperBoundMonth: null,  // optional
    upperBoundDay: null,    // optional
  }
}

const copyState = (state) => {
  console.log({ "stateSliceEditSources.copyState(state)": state })

  let copy = {}
  let sourceKeys = Object.keys(state)
  sourceKeys.forEach(sourceEditId => {
    let source = { ...state[sourceEditId] }
    source.publicationTimeRange = { ...state[sourceEditId].publicationTimeRange }
    copy[sourceEditId] = source
    // let propertyKeys = Object.keys(newState[sourceEditId])
    // propertyKeys.forEach(propertyKey => {
    //   newState[sourceEditId][propertyKey] = state[sourceEditId][propertyKey]
    // })
  });

  return copy
}

const evaluateSourceComplete = (source) => {
  console.log("stateSliceEditSources.evaluateSourceComplete")

  // if (!source.title) {
  //   return "Missing title"
  // }

  // let year = source.publicationTimeRange.lowerBoundYear
  // if (isNaN(Number(year))) {
  //   return `Year is not a number: '${year}'`
  // }
  // else if (!year) {
  //   return "Missing required value: 'Year'"
  // }

  // let month = source.publicationTimeRange.value
  // if (isNaN(Number(month))) {
  //   return `Month is not a number: '${month}'`
  // }

  // let day = source.publicationTimeRange.value
  // if (isNaN(Number(day))) {
  //   return `Day is not a number: '${day}'`
  // }

  // // Ok
  // return null

  let complete = true
  complete &= Boolean(source.title)
  complete &= isNaN(Number(source.publicationTimeRange.lowerBoundYear))
  complete &= isNaN(Number(source.publicationTimeRange.lowerBoundMonth))
  complete &= isNaN(Number(source.publicationTimeRange.lowerBoundDay))

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

    // newSource: (state, action) => {
    //   console.log("stateSliceEditSources.newSource")

    //   // let things = [singleSourceInitialState]
    //   // things = [...things, singleSourceInitialState]
    //   // things[0].id = generateUUID()

    //   console.log({ "existing sources:": state.sources })

    //   let editId = action.payload.id
    //   let newSource = {
    //     ...sourceInitialState,
    //     id: "this is my source revisionId",
    //     sourceId: "this is my persistant sourceId",
    //     title: action.payload.title
    //   }
    //   newSource.complete = sourceIsComplete(newSource)

    //   let mySources = { ...state.sources }
    //   mySources[editId] = newSource
    //   return {
    //     ...state,
    //     sources: mySources
    //   }
    // },

    // deleteSource: (state, action) => {
    //   console.log("stateSliceEditSources.deleteSource")

    //   let editId = action.payload
    //   let mySources = { ...state.sources }
    //   delete mySources[editId]

    //   return {
    //     ...state,
    //     sources: mySources
    //   }
    // },

    newSource: (state, action) => {
      console.log("stateSliceEditSources.newSource")

      let editId = action.payload.id
      let newSource = {
        ...sourceInitialState,
        id: "this is my source revisionId",
        sourceId: "this is my persistant sourceId"
      }
      // newSource.complete = sourceIsComplete(newSource)

      // Duplicate existing state
      // Note: Need to jump through some syntactical hoops because I'm not sure that the state machine was designed to hold an arbitrary set of key-value pairs
      // ...does this code make me a bad person?
      let newState = { ...state }
      // let keys = Object.keys(state)
      // keys.forEach(key => {
      //   newState[key] = { ...state[`${key}`] }
      // });

      // Assign new state
      // newState[`${editId}`] = newSource
      newState[editId] = newSource
      // let mySources = { ...state }
      // let keys2 = Object.keys(mySources)
      // mySources[editId] = newSource
      return {
        ...newState,
        // testingNewSource: newSource
      }
    },

    deleteSource: (state, action) => {
      console.log("stateSliceEditSources.deleteSource")

      let editId = action.payload
      // let mySources = [...state.sources]
      // let thing = { ...state.sources }
      // mySources.filter((source) => source.editId != editId)

      let newState = { ...state }
      //let keys = Object.keys(state)
      //keys.forEach(key => {
      //  if (key != editId) {
      //    newState[key] = { ...state[`${key}`] }
      //  }
      //});
      // let thing1 = newState[editId]
      // let thing2 = state[editId]

      delete newState[editId]
      // let newKeys = Object.keys(state)

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

    updateSourcePubDateLowerBoundYear: (state, action) => {
      console.log("stateSliceEditSources.updateSourcePubDateLowerBoundYear")

      let newState = copyState(state)
      let editId = action.payload.editId
      let year = action.payload.value
      newState[editId].publicationTimeRange.lowerBoundYear = year
      newState[editId].complete = evaluateSourceComplete(newState[editId])
      return {
        ...newState,
      }
    },

    updateSourcePubDateLowerBoundMonth: (state, action) => {
      console.log("stateSliceEditSources.updateSourcePubDateLowerBoundMonth")

      let newState = copyState(state)
      let editId = action.payload.editId
      let month = action.payload.value
      newState[editId].publicationTimeRange.lowerBoundMonth = month
      newState[editId].complete = evaluateSourceComplete(newState[editId])
      return {
        ...newState,
      }
    },

    updateSourcePubDateLowerBoundDay: (state, action) => {
      console.log("stateSliceEditSources.updateSourcePubDateLowerBoundDay")

      let newState = copyState(state)
      let editId = action.payload.editId
      let day = action.payload.value
      newState[editId].publicationTimeRange.lowerBoundDay = day
      newState[editId].complete = evaluateSourceComplete(newState[editId])
      return {
        ...newState,
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
