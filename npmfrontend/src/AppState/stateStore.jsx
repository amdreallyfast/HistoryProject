import { configureStore } from "@reduxjs/toolkit";
import { stateSlicePoi } from "./stateSlicePoi";
import { stateSliceEditPoi } from "./stateSliceEditPoi";
import { stateSliceIntersectableMeshes } from "./stateSliceIntersectableMeshes";
import { stateSliceMouseInfo } from "./stateSliceMouseInfo";

export const stateStore = configureStore({
  reducer: {
    poiReducer: stateSlicePoi.reducer,
    editPoiReducer: stateSliceEditPoi.reducer,
    // intersectableMeshesReducer: stateSliceIntersectableMeshes.reducer,
    mouseInfoReducer: stateSliceMouseInfo.reducer
  }
})
