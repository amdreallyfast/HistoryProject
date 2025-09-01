import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // TODO: change all other POIs and regions to dark grey to indicate that they cannot be highlighted
  editModeOn: true,

  eventId: 99,
  revisionAuthor: "TestingAuthor",
  title: null,
  tags: [],
  eventIsCreationOfSource: false,
  imageDataUrl: null,
  summary: null,

  // Event time bounds
  eventTimeEarliestYear: null,   // required
  eventTimeEarliestMonth: null,  // optional
  eventTimeEarliestDay: null,    // optional
  eventTimeLatestYear: null,     // required
  eventTimeLatestMonth: null,    // optional
  eventTimeLatestDay: null,      // optional

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

export const stateSliceEditPoi = createSlice({
  name: "stateSliceEditPoi",
  initialState,
  reducers: {
    setThing: (state, action) => {
      console.log("stateSliceEditPoi.setThing")
      return {
        ...state,
        thing: action.payload
      }
    },

    startEditMode: (state, action) => {
      // console.log("stateSliceEditPoi.startEditMode")

      // let eventId = action.payload.eventId
      return {
        ...initialState,
        editModeOn: true
      }
    },

    endEditMode: (state, action) => {
      // console.log("stateSliceEditPoi.endEditMode")
      return initialState
    },

    setRevisionAuthor: (state, action) => {
      console.log({ "stateSliceEditPoi.setRevisionAuthor": action.payload })

      return {
        ...state,
        revisionAuthor: action.payload.revisionAuthor
      }
    },

    setTitle: (state, action) => {
      console.log({ "stateSliceEditPoi.setTitle": action.payload })

      return {
        ...state,
        title: action.payload
      }
    },

    setTags: (state, action) => {
      console.log({ "stateSliceEditPoi.setTags": action.payload })

      return {
        ...state,
        tags: action.payload
      }
    },

    setEventIsCreationOfSource: (state, action) => {
      console.log({ "stateSliceEditPoi.setEventIsCreationOfSource": action.payload })

      return {
        ...state,
        eventIsCreationOfSource: action.payload.eventIsCreationOfSource
      }
    },

    setImageDataUrl: (state, action) => {
      console.log({ "stateSliceEditPoi.setImageDataUrl": action.payload })

      let filename = action.payload.filename
      let dataUrl = action.payload.dataUrl
      return {
        ...state,
        imageDataUrl: dataUrl
      }
    },

    setSummary: (state, action) => {
      console.log({ "stateSliceEditPoi.setSummary": action.payload })

      return {
        ...state,
        summary: action.payload
      }
    },

    setEventTimeEarliestYear: (state, action) => {
      console.log({ "stateSliceEditPoi.setEventTimeEarliestYear": action.payload })

      return {
        ...state,
        eventTimeEarliestYear: action.payload
      }
    },

    setEventTimeEarliestMonth: (state, action) => {
      console.log({ "stateSliceEditPoi.setEventTimeEarliestMonth": action.payload })

      return {
        ...state,
        eventTimeEarliestMonth: action.payload
      }
    },

    setEventTimeEarliestDay: (state, action) => {
      console.log({ "stateSliceEditPoi.setEventTimeEarliestDay": action.payload })

      return {
        ...state,
        eventTimeEarliestDay: action.payload
      }
    },

    setEventTimeLatestYear: (state, action) => {
      console.log({ "stateSliceEditPoi.setEventTimeLatestYear": action.payload })

      return {
        ...state,
        eventTimeLatestYear: action.payload
      }
    },

    setEventTimeLatestMonth: (state, action) => {
      console.log({ "stateSliceEditPoi.setEventTimeLatestMonth": action.payload })

      return {
        ...state,
        eventTimeLatestMonth: action.payload
      }
    },

    setEventTimeLatestDay: (state, action) => {
      console.log({ "stateSliceEditPoi.setEventTimeLatestDay": action.payload })

      return {
        ...state,
        eventTimeLatestDay: action.payload
      }
    },

    setSources: (state, action) => {
      console.log({ "stateSliceEditPoi.setSources": action.payload })

      return {
        ...state,
        sources: action.payload
      }
    },

    setPrimaryLoc: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi.setPrimaryLoc", payload: action.payload })

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
      // console.log({ msg: "stateSliceEditPoi.setUpdatedPrimaryPinMeshInScene", payload: action.payload })

      return {
        ...state,
        updatedPrimaryPinMeshInScene: state.updatedPrimaryPinMeshInScene + 1
      }
    },

    setRegionBoundaries: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi.setRegionBoundaries", payload: action.payload })

      return {
        ...state,
        regionBoundaries: action.payload
      }
    },

    setUpdatedRegionMeshesInScene: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi.updatedRegionMeshesInScene", payload: action.payload })

      return {
        ...state,
        updatedRegionMeshesInScene: state.updatedRegionMeshesInScene + 1
      }
    },

    updateRegionBoundaryPin: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi.updateRegionBoundaryPin", payload: action.payload })

      // Expected format: See comment block on field.
      let updatedLocation = action.payload
      let updatedBoundaries = state.regionBoundaries.map((boundaryMarker, index) => {
        if (boundaryMarker.id == updatedLocation.id) {
          return updatedLocation
        }
        else {
          // Don't change the others
          return boundaryMarker
        }
      })

      return {
        ...state,
        regionBoundaries: updatedBoundaries
      }
    },

    enableClickAndDrag: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi.startClickAndDrag", payload: action.payload })

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
      // console.log({ msg: "stateSliceEditPoi.updateClickAndDrag", payload: action.payload })

      return {
        ...state,
        clickAndDrag: {
          ...state.clickAndDrag,
          rotorQuaternion: action.payload.rotorQuaternion
        }
      }
    },

    disableClickAndDrag: (state, action) => {
      // console.log({ msg: "stateSliceEditPoi.disableClickAndDrag", payload: action.payload })

      return {
        ...state,
        clickAndDrag: null
      }
    }
  }
})

export const editStateActions = stateSliceEditPoi.actions
