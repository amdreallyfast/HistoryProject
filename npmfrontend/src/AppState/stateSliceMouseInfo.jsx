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
  //  }
  mouseDown: null,
  mouseUp: null,

  // via ThreeJs raycasting
  cursorRaycastIntersections: {
    // Expected:
    // Note: Using mesh "uuid" instead of "Id", which is an integer used by ThreeJs for something.
    // {
    //   point: null,         // Raycast intersection point
    //   mesh: {
    //     name: <name>,
    //     uuid: <guid>,
    //     originPos: { x, y, z } // Mesh geometry position
    //     userData: {            // Only applies to region pins and primary POI pins
    //       poiId: <poiId>,
    //       whereId: <guid>
    //     }
    //   }
    // },
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

      // // Note: An object with functions cannot be stored as state. Need to extract the values 
      // // manually and construct a JSON object before store this info.
      // let firstNonGlobe = null
      // if (action.payload.firstNonGlobe) {
      //   let intersection = action.payload.firstNonGlobe
      //   let point = {
      //     x: intersection.point.x,
      //     y: intersection.point.y,
      //     z: intersection.point.z
      //   }

      //   firstNonGlobe = {
      //     point: point,
      //     meshName: intersection.object.name,
      //     meshUuid: intersection.firstNonGlobe.object.uuid
      //   }
      // }

      // let globeIntersection = null
      // if (action.payload.globe) {
      //   globeIntersection = {
      //     point: action.payload.globe.point,
      //     meshName: action.payload.globe.object.name,
      //     meshUuid: action.payload.globe.object.uuid
      //   }
      // }

      // if (action.payload.firstNonGlobe) {
      //   // let firstIntersection = action.payload.firstNonGlobe
      //   // console.log(`'${firstIntersection.mesh.name}' only at '${JSON.stringify(firstIntersection.point)}'`)
      //   console.log(`intersections.firstNonGlobe.point: ${JSON.stringify(action.payload.firstNonGlobe.point)}`)
      // }

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
