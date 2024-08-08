import { configureStore } from "@reduxjs/toolkit";
import { stateSlicePoi } from "./stateSlicePoi";
import { stateSliceEditPoi } from "./stateSliceEditPoi";
import { stateSliceMouseInfo } from "./stateSliceMouseInfo";
import { stateSliceSelectedPoi } from "./stateSliceSelectedPoi";

export const stateStore = configureStore({
  reducer: {
    poiReducer: stateSlicePoi.reducer,
    editPoiReducer: stateSliceEditPoi.reducer,
    mouseInfoReducer: stateSliceMouseInfo.reducer,
    selectedPoiReducer: stateSliceSelectedPoi.reducer
  }
})
