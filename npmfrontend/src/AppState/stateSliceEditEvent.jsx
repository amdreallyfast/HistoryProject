import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // TODO: change all other events and regions to dark grey to indicate that they cannot be highlighted
  editModeOn: false,

  eventId: 99,
  revisionAuthor: "TestingAuthor",
  title: null,
  tags: [],
  eventIsCreationOfSource: false,
  imageDataUrl: null,
  summary: null,

  // Event time bounds
  eventTime: {
    earliestYear: null,   // required
    earliestMonth: null,  // optional
    earliestDay: null,    // optional
    latestYear: null,     // required
    latestMonth: null,    // optional
    latestDay: null,      // optional
  },

  // Format: {
  //  isbn: null, // allow null; not all writings are publically registered
  //  title: null,
  //  detailedLocation: null, // allow null; ex: "Chapter 3, paragraph 28"
  //  authors: [],  // strings
  //  publicationLowerBoundYear: null,  // required
  //  publicationLowerBoundMonth: null, // allow null
  //  publicationLowerBoundDay: null,   // allow null
  //  publicationUpperBoundYear: null,  // required
  //  publicationUpperBoundMonth: null, // allow null
  //  publicationUpperBoundDay: null,   // allow null
  // }
  sources: [],

  // Format for location and region boundaries:
  //  {
  //    id,
  //    lat,
  //    long,
  //    x,
  //    y,
  //    z
  //  }
  primaryLoc: null,

  // Format:
  //  Same as primaryLoc.
  // Note: _Must_ be an array. Order is important for the "ear clipping" algorithm.
  regionBoundaries: [],

  // Can't put ThreeJs meshes into this state machine (function objects are non-serializable), so
  // use integer counters to indicate when there has been a change in meshes that the cursor
  // should be able to hover over.
  updatedPrimaryPinMeshInScene: 0,
  updatedRegionMeshesInScene: 0,

  // For use during clicking and dragging a single point or the entire region.
  // Note: Using "meshUuid" instead of "meshId" because ThreeJs uses the field "Id" as an
  // integer for some kind of counting, and it uses "uuid" for the global ID. I don't know why.
  // Format: null or
  //  {
  //    // Fixed for duration of click-and-drag.
  //    mesh: {
  //      name: <name>,
  //      uuid: <guid>,
  //      userData: {
  //        eventId: <eventId>,
  //        locationId: <spherePoint.Id>
  //      }
  //    },
  //
  //    // Fixed for duration of click-and-drag. Prevents click-and-drag from snapping the mesh's
  //    // origin to the cursor the moment the cursor moves a single pixel.
  //    // Note: Covers difference betwwen the 3D point where the raycast intersected a mesh and
  //    // where the rayasr intersected the globe underneath.
  //    initialOffsetQuaternion: { w, x, y, z },
  //
  //    // Continuously updated. Represents the movement of a mesh from its starting position to
  //    // wherever the cursor is currently intersecting the globe
  //    rotorQuaternion: { w, x, y, z }
  //  },
  clickAndDrag: null,
}

export const stateSliceEditEvent = createSlice({
  name: "stateSliceEditEvent",
  initialState,
  reducers: {
    setThing: (state, action) => {
      console.log("stateSliceEditEvent.setThing")
      return {
        ...state,
        thing: action.payload
      }
    },

    startEditMode: (state, action) => {
      // console.log("stateSliceEditEvent.startEditMode")

      // let eventId = action.payload.eventId
      return {
        ...initialState,
        editModeOn: true
      }
    },

    endEditMode: (state, action) => {
      // console.log("stateSliceEditEvent.endEditMode")
      return initialState
    },

    loadEvent: (state, action) => {
      console.log({ "stateSliceEditEvent.loadEvent": action.payload })

      let event = action.payload
      return {
        ...initialState,
        editModeOn: true,
        eventId: event.eventId,
        title: event.title,
        tags: event.tags || [],
        eventIsCreationOfSource: event.eventIsCreationOfSource || false,
        imageDataUrl: event.imageDataUrl || null,
        summary: event.summary || null,
        eventTime: {
          earliestYear: event.eventTime?.earliestYear || null,
          earliestMonth: event.eventTime?.earliestMonth || null,
          earliestDay: event.eventTime?.earliestDay || null,
          latestYear: event.eventTime?.latestYear || null,
          latestMonth: event.eventTime?.latestMonth || null,
          latestDay: event.eventTime?.latestDay || null,
        },
        sources: event.sources || [],
        primaryLoc: event.primaryLoc || null,
        regionBoundaries: event.regionBoundaries || [],
      }
    },

    setRevisionAuthor: (state, action) => {
      console.log({ "stateSliceEditEvent.setRevisionAuthor": action.payload })

      return {
        ...state,
        revisionAuthor: action.payload.revisionAuthor
      }
    },

    setTitle: (state, action) => {
      console.log({ "stateSliceEditEvent.setTitle": action.payload })

      return {
        ...state,
        title: action.payload
      }
    },

    setTags: (state, action) => {
      console.log({ "stateSliceEditEvent.setTags": action.payload })

      return {
        ...state,
        tags: action.payload
      }
    },

    setEventIsCreationOfSource: (state, action) => {
      console.log({ "stateSliceEditEvent.setEventIsCreationOfSource": action.payload })

      return {
        ...state,
        eventIsCreationOfSource: action.payload.eventIsCreationOfSource
      }
    },

    setImageDataUrl: (state, action) => {
      console.log({ "stateSliceEditEvent.setImageDataUrl": action.payload })

      let filename = action.payload.filename
      let dataUrl = action.payload.dataUrl
      return {
        ...state,
        imageDataUrl: dataUrl
      }
    },

    setSummary: (state, action) => {
      console.log({ "stateSliceEditEvent.setSummary": action.payload })

      return {
        ...state,
        summary: action.payload
      }
    },

    setEventTimeEarliestYear: (state, action) => {
      console.log({ "stateSliceEditEvent.setEventTimeEarliestYear": action.payload })

      return {
        ...state,
        eventTime: { ...state.eventTime, earliestYear: action.payload }
      }
    },

    setEventTimeEarliestMonth: (state, action) => {
      console.log({ "stateSliceEditEvent.setEventTimeEarliestMonth": action.payload })

      return {
        ...state,
        eventTime: { ...state.eventTime, earliestMonth: action.payload }
      }
    },

    setEventTimeEarliestDay: (state, action) => {
      console.log({ "stateSliceEditEvent.setEventTimeEarliestDay": action.payload })

      return {
        ...state,
        eventTime: { ...state.eventTime, earliestDay: action.payload }
      }
    },

    setEventTimeLatestYear: (state, action) => {
      console.log({ "stateSliceEditEvent.setEventTimeLatestYear": action.payload })

      return {
        ...state,
        eventTime: { ...state.eventTime, latestYear: action.payload }
      }
    },

    setEventTimeLatestMonth: (state, action) => {
      console.log({ "stateSliceEditEvent.setEventTimeLatestMonth": action.payload })

      return {
        ...state,
        eventTime: { ...state.eventTime, latestMonth: action.payload }
      }
    },

    setEventTimeLatestDay: (state, action) => {
      console.log({ "stateSliceEditEvent.setEventTimeLatestDay": action.payload })

      return {
        ...state,
        eventTime: { ...state.eventTime, latestDay: action.payload }
      }
    },

    setSources: (state, action) => {
      console.log({ "stateSliceEditEvent.setSources": action.payload })

      return {
        ...state,
        sources: action.payload
      }
    },

    setPrimaryLoc: (state, action) => {
      // console.log({ msg: "stateSliceEditEvent.setPrimaryLoc", payload: action.payload })

      let spherePoint = action.payload
      return {
        ...state,
        primaryLoc: {
          id: spherePoint.id,
          lat: spherePoint.lat,
          long: spherePoint.long,
          x: spherePoint.x,
          y: spherePoint.y,
          z: spherePoint.z
        },
      }
    },

    setUpdatedPrimaryPinMeshInScene: (state, action) => {
      // console.log({ msg: "stateSliceEditEvent.setUpdatedPrimaryPinMeshInScene", payload: action.payload })

      return {
        ...state,
        updatedPrimaryPinMeshInScene: state.updatedPrimaryPinMeshInScene + 1
      }
    },

    setRegionBoundaries: (state, action) => {
      // console.log({ msg: "stateSliceEditEvent.setRegionBoundaries", payload: action.payload })

      return {
        ...state,
        regionBoundaries: action.payload
      }
    },

    setUpdatedRegionMeshesInScene: (state, action) => {
      // console.log({ msg: "stateSliceEditEvent.updatedRegionMeshesInScene", payload: action.payload })

      return {
        ...state,
        updatedRegionMeshesInScene: state.updatedRegionMeshesInScene + 1
      }
    },

    updateRegionBoundary: (state, action) => {
      // console.log({ msg: "stateSliceEditEvent.updateRegionBoundary", payload: action.payload })

      // Expected format: See comment block on field.
      let updatedLocation = action.payload
      let updatedBoundaries = state.regionBoundaries.map((regionBoundary, index) => {
        if (regionBoundary.id == updatedLocation.id) {
          // console.log("that's me")
          return updatedLocation
        }
        else {
          // Don't change the others
          // console.log("not this pin")
          return regionBoundary
        }
      })

      return {
        ...state,
        regionBoundaries: updatedBoundaries
      }
    },

    enableClickAndDrag: (state, action) => {
      // console.log({ msg: "stateSliceEditEvent.startClickAndDrag", payload: action.payload })

      // Expected format: See comment block on field.
      return {
        ...state,
        clickAndDrag: {
          mesh: action.payload.mesh,
          initialOffsetQuaternion: action.payload.initialOffsetQuaternion,
          rotorQuaternion: action.payload.rotorQuaternion
        }
      }
    },

    updateClickAndDrag: (state, action) => {
      // console.log({ msg: "stateSliceEditEvent.updateClickAndDrag", payload: action.payload })

      return {
        ...state,
        clickAndDrag: {
          ...state.clickAndDrag,
          rotorQuaternion: action.payload.rotorQuaternion
        }
      }
    },

    disableClickAndDrag: (state, action) => {
      // console.log({ msg: "stateSliceEditEvent.disableClickAndDrag", payload: action.payload })

      return {
        ...state,
        clickAndDrag: null
      }
    }
  }
})

export const editEventStateActions = stateSliceEditEvent.actions
