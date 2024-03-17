import { createSlice } from "@reduxjs/toolkit"

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
  //  }
  mouseDown: null,
  mouseUp: null,

  // via ThreeJs raycasting
  // Note: An object with functions cannot be stored as state. Need to extract the values manually
  // and construct a JSON object before storing this info.
  // Expected:
  // Note: Using mesh.uuid instead of mesh.Id, the latter of which is an integer used by ThreeJs 
  //  for something.
  //  {
  //    point: null,         // Raycast intersection point
  //    mesh: {
  //      name: <name>,
  //      uuid: <guid>,
  //      userData: {            // Only applies to region pins and primary POI pins
  //        poiId: <poiId>,
  //        whereId: <guid>
  //      }
  //    }
  //  },
  cursorRaycastIntersections: {
    firstNonGlobe: null,
    globe: null
  }
}

export const stateSliceMouseInfo = createSlice({
  name: "stateSliceMouseInfo",
  initialState,
  reducers: {
    setMousePos: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_setMousePos", value: action.payload })

      let where = action.payload
      return {
        ...state,
        currPos: {
          x: where.x,
          y: where.y
        },
        prevPos: {
          x: state.currPos.x,
          y: state.currPos.y
        },
      }
    },

    setMouseIsDown: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_setMouseIsDown", value: action.payload })

      return {
        ...state,
        mouseDown: {
          timeMs: action.payload.timeMs,
          pos: action.payload.pos
        }
      }
    },

    setMouseIsUp: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_setMouseIsUp", value: action.payload })

      return {
        ...state,
        mouseUp: {
          timeMs: action.payload.timeMs,
          pos: action.payload.pos
        }
      }
    },

    resetMouseUpDown: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_resetMouseUpDown", value: action.payload })

      return {
        ...state,
        mouseDown: initialState.mouseDown,
        mouseUp: initialState.mouseUp
      }
    },

    setCursorRaycastIntersections: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_setCursorRaycastIntersections", value: action.payload })

      return {
        ...state,
        cursorRaycastIntersections: {
          firstNonGlobe: action.payload.firstNonGlobe,
          globe: action.payload.globe
        }
      }
    },

    resetCursorRaycastIntersections: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_resetCursorRaycastIntersection", value: action.payload })

      return {
        ...state,
        cursorRaycastIntersection: initialState.cursorRaycastIntersections
      }
    },
  }
})

export const mouseStateActions = stateSliceMouseInfo.actions
