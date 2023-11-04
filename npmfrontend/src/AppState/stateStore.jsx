import { configureStore } from "@reduxjs/toolkit";
import { stateSlicePoi } from "./stateSlicePoi";
import { stateSliceEditPoi } from "./stateSliceEditPoi";
import { stateSliceSearch } from "./stateSliceSearch";

export const stateStore = configureStore({
  reducer: {
    poiReducer: stateSlicePoi.reducer,
    editPoiReducer: stateSliceEditPoi.reducer,
    searchReducer: stateSliceSearch.reducer
  }
})
