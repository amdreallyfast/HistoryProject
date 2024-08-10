import { createSlice } from "@reduxjs/toolkit"
import { meshNames } from "../GlobeSection/constValues"

const initialState = {
  currPos: {
    x: 0,
    y: 0
  },
  prevPos: {
    x: 0,
    y: 0
  },

  // Format: {
  //   pos: {
  //     x: 0,
  //     y: 0
  //   },
  //   timeMs: null,
  //   intersection: null // or cursor raycast intersection (see below)
  // },
  leftMouseUp: null,
  leftMouseDown: null,
  rightMouseUp: null,
  rightMouseDown: null,

  // Extracted minimum values from ThreeJs raycasting because objects with functions cannot be 
  // stored as state.
  // Note: Using mesh.uuid instead of mesh.Id, the latter of which is an integer used by ThreeJs 
  //  for something or other.
  // Format: {
  //   absolute: {x, y, z},
  //   relativeToGlobe: {x,y,z},
  //   mesh: {
  //     name: <string>,
  //     uuid: <guid>>,
  //
  //     // Only applies to region pins and primary POI pins
  //     userData: {
  //       eventId: <guid>
  //       locationId: <guid>
  //     }
  //   }
  // }
  cursorRaycastIntersections: {
    globeIndex: -1,
    intersections: []
  },

  selectedLocId: null,
  prevSelectedLocId: null,
  hoverLocId: null,
  prevHoverLocId: null,
}

export const stateSliceMouseInfo = createSlice({
  name: "stateSliceMouseInfo",
  initialState,
  reducers: {
    setMousePos: (state, action) => {
      // console.log({ "mouseStateActions.setMousePos": action.payload })

      let normalizedScreenSpaceXY = action.payload
      return {
        ...state,
        currPos: {
          x: normalizedScreenSpaceXY.x,
          y: normalizedScreenSpaceXY.y
        },
        prevPos: {
          x: state.currPos.x,
          y: state.currPos.y
        },
      }
    },

    setLeftMouseIsDown: (state, action) => {
      // console.log({ "mouseStateActions.setLeftMouseIsDown": action.payload })

      return {
        ...state,
        leftMouseDown: {
          pos: action.payload.pos,
          timeMs: action.payload.timeMs,

          // Cursor intersections are calculated whenever the mouse moves. By the time a button is 
          // clicked, the intersections have already been calculated.
          // Note: If there are none, then array[0] is "undefined".
          // Also Note: Cannot access this from the "state" argument. For some reason, if you try to
          // access any object other than a base type, the handling type is a special object. Rather 
          // than de-reference every primitive individually, just pass it in as an argument.
          intersection: action.payload.intersection
        },
      }
    },

    setLeftMouseIsUp: (state, action) => {
      // console.log({ "mouseStateActions.setLeftMouseIsUp": action.payload })

      return {
        ...state,
        leftMouseUp: {
          timeMs: action.payload.timeMs,
          pos: action.payload.pos
        }
      }
    },

    setRightMouseIsDown: (state, action) => {
      // console.log({ "mouseStateActions.setRightMouseIsDown": action.payload })

      return {
        ...state,
        rightMouseDown: {
          timeMs: action.payload.timeMs,
          pos: action.payload.pos
        }
      }
    },

    setRightMouseIsUp: (state, action) => {
      // console.log({ "mouseStateActions.setRightMouseIsUp": action.payload })

      return {
        ...state,
        rightMouseUp: {
          timeMs: action.payload.timeMs,
          pos: action.payload.pos
        }
      }
    },

    resetLeftMouse: (state, action) => {
      // console.log({ "mouseStateActions.resetLeftMouse": action.payload })

      return {
        ...state,
        rightMouseUp: initialState.rightMouseUp,
        leftMouseUp: initialState.leftMouseUp,
        rightMouseDown: initialState.rightMouseDown,
        leftMouseDown: initialState.leftMouseDown,
      }
    },

    setCursorRaycastIntersections: (state, action) => {
      // console.log({ "mouseStateActions.setCursorRaycastIntersections": action.payload })

      return {
        ...state,
        cursorRaycastIntersections: {
          globeIndex: action.payload.findIndex((intersection) => intersection.mesh.name == meshNames.Globe),
          intersections: action.payload
        }
      }
    },

    setHoverLocId: (state, action) => {
      console.log({ "mouseStateActions.setHoverLocId": action.payload })

      return {
        ...state,
        hoverLocId: action.payload,
        prevHoverLocId: state.hoverLocId
      }
    },

    setSelectedLocId: (state, action) => {
      console.log({ "mouseStateActions.setSelectedLocId": action.payload })

      return {
        ...state,
        selectedLocId: action.payload,
        prevSelectedLocId: state.selectedLocId
      }
    },
  }
})

export const mouseStateActions = stateSliceMouseInfo.actions
