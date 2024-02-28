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

  mouseDown: {
    pos: {
      x: 0,
      y: 0
    },
    timeMs: null
  },

  mouseUp: {
    pos: {
      x: 0,
      y: 0,
    },
    timeMs: null
  },

  // via ThreeJs raycasting
  cursorRaycastIntersections: {
    // Expected:
    //  {
    //    point: null,
    //    meshName: null
    //  }
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

    // updatePrevMouseIsDown: (state, action) => {
    //   console.log({ msg: "stateSliceMouseInfo_updatePrevMouseIsDown", value: action.payload })

    //   let mouseIsDown
    //   return {
    //     ...state,
    //     prevMouseIsDown: state.mouseIsDown
    //   }
    // },

    // setMouseIsUp: (state, action) => {
    //   // console.log({ msg: "stateSliceMouseInfo_setMouseIsUp", value: action.payload })

    //   let mouseUpSamePos =
    //     state.mouseDownPos.x == action.payload.x &&
    //     state.mouseDownPos.y == action.payload.y

    //   return {
    //     ...state,
    //     mouseDownPos: {
    //       x: 0,
    //       y: 0
    //     },
    //     mouseUpPos: {
    //       x: action.payload.x,
    //       y: action.payload.y
    //     },
    //     mouseIsDown: false,
    //     prevMouseIsDown: true,
    //     mouseClicked: mouseUpSamePos
    //   }
    // },
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

    setCursorRaycastIntersections: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_setCursorRaycastIntersections", value: action.payload })

      let intersections = action.payload
      return {
        ...state,
        cursorRaycastIntersections: {
          firstNonGlobe: intersections.firstNonGlobe ? {
            point: intersections.firstNonGlobe.point,
            meshName: intersections.firstNonGlobe.meshName,
          } : null,
          globe: intersections.globe ? {
            point: intersections.globe.point,
            meshName: intersections.globe.meshName,
          } : null
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

    resetMouseUpDown: (state, action) => {
      console.log({ msg: "stateSliceMouseInfo_resetMouseUpDown", value: action.payload })

      return {
        ...state,
        mouseDown: initialState.mouseDown,
        mouseUp: initialState.mouseUp
      }
    },

    // resetMouseClicked: (state, action) => {
    //   console.log({ msg: "stateSliceMouseInfo_resetMouseClicked", value: action.payload })

    //   return {
    //     ...state,
    //     mouseClicked: false
    //   }
    // },

    // //TODO: eliminate "updateOneFrame" and instead rely on the MouseHandler state response to silence it?
    // updateOneFrame: (state, action) => {
    //   // console.log({ msg: "stateSliceMouseInfo_updateOneFrame", value: action.payload })

    //   // Mouse clicking should only trigger once.
    //   return {
    //     ...state,
    //     mouseClicked: false,
    //     prevMouseIsDown: state.mouseIsDown
    //   }
    // }
  }
})

export const mouseStateActions = stateSliceMouseInfo.actions
