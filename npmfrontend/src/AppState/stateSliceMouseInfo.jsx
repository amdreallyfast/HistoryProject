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
  rightMouseUp: null,
  leftMouseUp: null,
  rightMouseDown: null,
  leftMouseDown: null,

  // via ThreeJs raycasting
  // Note: An object with functions cannot be stored as state. Need to extract the values manually
  // and construct a JSON object before storing this info.
  // Expected:
  // Note: Using mesh.uuid instead of mesh.Id, the latter of which is an integer used by ThreeJs 
  //  for something.
  //  {
  //    point: null,         // Raycast intersection point (x, y, z)
  //    mesh: {
  //      name: <name>,
  //      uuid: <guid>,
  //      userData: {            // Only applies to region pins and primary POI pins
  //        poiId: <poiId>,
  //        locationId: <spherePoint.Id>
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
      // console.log({ msg: "stateSliceMouseInfo_setLeftMouseIsDown", value: action.payload })

      return {
        ...state,
        leftMouseDown: {
          timeMs: action.payload.timeMs,
          pos: action.payload.pos
        }
      }
    },

    setLeftMouseIsUp: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_setLeftMouseIsUp", value: action.payload })

      return {
        ...state,
        leftMouseUp: {
          timeMs: action.payload.timeMs,
          pos: action.payload.pos
        }
      }
    },

    setRightMouseIsDown: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_setRightMouseIsDown", value: action.payload })

      return {
        ...state,
        rightMouseDown: {
          timeMs: action.payload.timeMs,
          pos: action.payload.pos
        }
      }
    },

    setRightMouseIsUp: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_setRightMouseIsUp", value: action.payload })

      return {
        ...state,
        rightMouseUp: {
          timeMs: action.payload.timeMs,
          pos: action.payload.pos
        }
      }
    },

    resetLeftMouseUpDown: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_resetLeftMouseUpDown", value: action.payload })

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
