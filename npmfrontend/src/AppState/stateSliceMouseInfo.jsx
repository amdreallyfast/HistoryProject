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
  // Also Note: Ensure not null. Personal philosphy that a single object can be null except for
  //  an array object. In this case, the state variable contains an array, which should not be 
  //  null, and therefore the state variable containing it should also not be null.
  // Format: null or {
  //   globeIndex: -1, // 0+ if the globe is in the mix (which it isn't in very shallow angles)
  //   intersections: [
  //     {
  //       absolute: { x, y, z },
  //       relativeToGlobe: { x, y, z },
  //       mesh: {
  //         name: string,
  //         uuid: guid,

  //         // Only applies to region pins and primary POI pins
  //         userData: {
  //           eventId: guid,
  //           locationId: guid
  //         }
  //       }
  //     }
  //   ]
  // },
  cursorRaycasting: {
    globeIndex: -1,
    intersections: []
  },

  // Used to communicate selection to and from components outside the Globe section (ex: Details).
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

      // Note: Cannot access intersections from the "state" argument. For some reason, if you try 
      // to access any object other than a base type, the resulting type is a special object 
      // internal to the redux package. Rather than de-reference every primitive individually, 
      // just pass it in as an argument.
      return {
        ...state,
        leftMouseDown: {
          pos: action.payload.pos,
          timeMs: action.payload.timeMs,
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

    resetLeftMouse: (state, action) => {
      // console.log({ "mouseStateActions.resetLeftMouse": action.payload })

      return {
        ...state,
        leftMouseUp: initialState.leftMouseUp,
        leftMouseDown: initialState.leftMouseDown,
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

    setCursorRaycasting: (state, action) => {
      // console.log({ "mouseStateActions.setCursorRaycasting": action.payload })
      let intersections = action.payload

      if (intersections) {
        return {
          ...state,
          cursorRaycasting: {
            globeIndex: intersections.findIndex((intersection) => intersection.mesh.name == meshNames.Globe),
            intersections: intersections
          }
        }
      }
      else {
        return {
          ...state,
          cursorRaycasting: initialState.cursorRaycasting
        }
      }
    },

    setHoverLocId: (state, action) => {
      // console.log({ "mouseStateActions.setHoverLocId": action.payload })

      return {
        ...state,
        hoverLocId: action.payload,
        prevHoverLocId: state.hoverLocId
      }
    },

    setSelectedLocId: (state, action) => {
      // console.log({ "mouseStateActions.setSelectedLocId": action.payload })

      return {
        ...state,
        selectedLocId: action.payload,
        prevSelectedLocId: state.selectedLocId
      }
    },
  }
})

export const mouseStateActions = stateSliceMouseInfo.actions
