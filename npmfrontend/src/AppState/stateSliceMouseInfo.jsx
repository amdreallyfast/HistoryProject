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

  // Expected:
  //  {
  //    pos: {
  //      x: 0,
  //      y: 0
  //    },
  //    timeMs: null
  //    intersection: <format of cursor raycast intersection>
  //  }
  leftMouseUp: null,
  leftMouseDown: null,
  // leftMouseDownIntersection: null,
  rightMouseUp: null,
  rightMouseDown: null,


  // // Format: {
  // //   up: {
  // //     canvasPos: {
  // //       x: 0,
  // //       y: 0
  // //     },
  // //     timeMs: {}
  // //   },
  // //   down: {
  // //     canvasPos: {
  // //       x: 0,
  // //       y: 0
  // //     },
  // //     timeMs: null,
  // //     intersection: {
  // //       mesh: {
  // //         name: <guid>,
  // //         uuid: <guid>,
  // //         userData: {
  // //           eventId: <guid>,
  // //           locationId: <guid>
  // //         }
  // //       },
  // //       raycastIntersectionPoint: {
  // //         x: 0,
  // //         y: 0,
  // //         z: 0
  // //       }
  // //     }
  // //   }
  // // },
  // leftMouse: {
  //   up: null,
  //   down: null
  // },
  // rightMouse: {
  //   up: null,
  //   down: null
  // },



  // via ThreeJs raycasting
  // Note: An object with functions cannot be stored as state. Need to extract the values manually
  // and construct a JSON object before storing this info.
  // Expected:
  // Note: Using mesh.uuid instead of mesh.Id, the latter of which is an integer used by ThreeJs 
  //  for something.

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

  // cursorRaycastIntersections: {
  //   firstNonGlobe: null,
  //   globe: null
  // },

  cursorRaycastIntersections2: {
    globeIndex: -1,
    intersections: []
  },
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

    setCursorRaycastIntersections2: (state, action) => {
      // console.log({ "mouseStateActions.setCursorRaycastIntersections2": action.payload })

      return {
        ...state,
        cursorRaycastIntersections2: {
          globeIndex: action.payload.findIndex((intersection) => intersection.mesh.name == meshNames.Globe),
          intersections: action.payload
        }
      }
    },

    // setLeftMouseDown: (state, action) => {
    //   console.log({ "mouseStateActions.setLeftMouseDownScreen": action.payload })

    //   let meshIntersection = null
    //   if (state.cursorRaycastIntersections2.length > 0){
    //     meshIntersection = state.cursorRaycastIntersections2[0]
    //   }

    //   return {
    //     ...state,
    //     leftMouse: {
    //       down: {
    //         canvasPos: {
    //           x: action.payload.pos.x,
    //           y: action.payload.pos.y
    //         },
    //         timeMs: action.payload.timeMs,
    //         intersection: meshIntersection
    //       }
    //     }
    //   }
    // },

    // setLeftMouseDownIntersection: (state, action) => {
    //   console.log({ "mouseStateActions.setLeftMouseDownIntersection": action.payload })

    //   return {
    //     ...state,
    //     leftMouseDownIntersection: action.payload
    //   }
    // },

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
        // leftMouseDownIntersection: initialState.intersection,
      }
    },

    setCursorRaycastIntersections: (state, action) => {
      // console.log({ "mouseStateActions.setCursorRaycastIntersections": action.payload })

      return {
        ...state,
        cursorRaycastIntersections: {
          firstNonGlobe: action.payload.firstNonGlobe,
          globe: action.payload.globe
        }
      }
    },

    resetCursorRaycastIntersections: (state, action) => {
      // console.log({ "mouseStateActions.resetCursorRaycastIntersection": action.payload })

      return {
        ...state,
        cursorRaycastIntersection: initialState.cursorRaycastIntersections
      }
    },
  }
})

export const mouseStateActions = stateSliceMouseInfo.actions
