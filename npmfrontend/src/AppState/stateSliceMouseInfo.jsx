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

  mouseDownPos: {
    x: 0,
    y: 0,
  },
  mouseUpPos: {
    x: 0,
    y: 0,
  },

  mouseIsDown: false,
  mouseClickedCurrPos: false
}

export const stateSliceMouseInfo = createSlice({
  name: "stateSliceMouseInfo",
  initialState,
  reducers: {
    mouseMove: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_mouseMove", value: action.payload })

      return {
        ...state,
        currPos: {
          x: action.payload.x,
          y: action.payload.y
        },
        prevPos: {
          x: state.currPos.x,
          y: state.currPos.y
        },
        mouseClickedCurrPos: false
      }
    },

    mouseDown: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_mouseDown", value: action.payload })

      return {
        ...state,
        mouseDownPos: {
          x: action.payload.x,
          y: action.payload.y
        },
        mouseUpPos: {
          x: 0,
          y: 0
        },
        mouseIsDown: true
      }
    },

    mouseUp: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_mouseUp", value: action.payload })

      let mouseUpSamePos =
        state.mouseDownPos.x == action.payload.x &&
        state.mouseDownPos.y == action.payload.y
      return {
        ...state,
        mouseDownPos: {
          x: 0,
          y: 0
        },
        mouseUpPos: {
          x: action.payload.x,
          y: action.payload.y
        },
        mouseIsDown: false,
        mouseClickedCurrPos: mouseUpSamePos
      }
    },

    disableMouseClick: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_disableMouseClick", value: action.payload })

      return {
        ...state,
        mouseClickedCurrPos: false
      }
    },


  }
})

export const mouseStateActions = stateSliceMouseInfo.actions
