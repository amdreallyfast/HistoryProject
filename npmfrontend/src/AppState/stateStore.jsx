import { configureStore } from "@reduxjs/toolkit";
import { stateSlicePoi } from "./stateSlicePoi";
import { stateSliceEditPoi } from "./stateSliceEditPoi";
import { stateSliceMouseInfo } from "./stateSliceMouseInfo";
import { stateSliceSelectedPoi } from "./stateSliceSelectedPoi";
import { stateSliceEditSource } from "./stateSliceEditSource";

export const stateStore = configureStore({
  reducer: {
    poiReducer: stateSlicePoi.reducer,
    editPoiReducer: stateSliceEditPoi.reducer,
    editSource: stateSliceEditSource.reducer,
    mouseInfoReducer: stateSliceMouseInfo.reducer,
    selectedPoiReducer: stateSliceSelectedPoi.reducer
  }
})
