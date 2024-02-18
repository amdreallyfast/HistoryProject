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
  prevMouseIsDown: false,
  mouseClicked: false,

  // via ThreeJs raycasting
  // The globe that is being intersected.
  cursorIntersectionGlobe: {
    point: null,
    meshName: null
  },

  // A mesh on top the globe.
  cursorIntersectionFirst: {
    point: null,
    meshName: null
  }
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
      }
    },

    mouseDown: (state, action) => {
      console.log({ msg: "stateSliceMouseInfo_mouseDown", value: action.payload })

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
      console.log({ msg: "stateSliceMouseInfo_mouseUp", value: action.payload })

      let mouseUpSamePos =
        state.mouseDownPos.x == action.payload.x &&
        state.mouseDownPos.y == action.payload.y

      // console.log({
      //   same: state.mouseDownPos.x == action.payload.x && state.mouseDownPos.y == action.payload.y,
      //   mouseDown: {
      //     x: state.mouseDownPos.x,
      //     y: state.mouseDownPos.y
      //   },
      //   mouseUpPos: {
      //     x: action.payload.x,
      //     y: action.payload.y
      //   }
      // })

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
        mouseClicked: mouseUpSamePos
      }
    },

    // updateMouseIsDown: (state, action) => {
    //   console.log({ msg: "stateSliceMouseInfo_updateMouseIsDown", value: action.payload })

    //   return {
    //     ...state,
    //     prevMouseIsDown: mouseIsDown
    //   }
    // },


    // TODO: fix the state machine for the mouse
    //  If the "mouse up" function is processed, and then "disable mouse click", then I have noticed (what seems to be) a race condition between setting the "mouse is clicked" flag and making sure that it is only true for 1 frame


    // disableMouseClick: (state, action) => {
    //   // console.log({ msg: "stateSliceMouseInfo_disableMouseClick", value: action.payload })

    //   return {
    //     ...state,
    //     mouseClickedCurrPos: false
    //   }
    // },

    // The first mesh called "globe" intersected by a ray cast from the cursor into the scene.
    setCursorIntersectionGlobe: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_setCursorIntersectionGlobe", value: action.payload })

      return {
        ...state,
        cursorIntersectionGlobe: {
          point: action.payload.point,
          meshName: action.payload.meshName
        }
      }
    },

    // The first thing intersected by a raycaster from the mouse into the scene.
    setCursorIntersectionFirst: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_setCursorIntersectionFirst", value: action.payload })

      return {
        ...state,
        cursorIntersectionFirst: {
          point: action.payload.point,
          meshName: action.payload.meshName
        }
      }
    },



    //TODO: eliminate "updateOneFrame" and instead rely on the MouseHandler state response to silence it?
    updateOneFrame: (state, action) => {
      // console.log({ msg: "stateSliceMouseInfo_updateOneFrame", value: action.payload })

      // Mouse clicking should only trigger once.
      return {
        ...state,
        mouseClicked: false,
        prevMouseIsDown: state.mouseIsDown
      }
    }
  }
})

export const mouseStateActions = stateSliceMouseInfo.actions
