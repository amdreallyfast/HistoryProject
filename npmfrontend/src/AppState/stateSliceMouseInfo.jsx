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
    updatePos: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_updatePos", value: action.payload })

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
      }
    }
  }
})

export const mouseStateActions = stateSliceMouseInfo.actions
