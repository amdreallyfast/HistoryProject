import { configureStore } from "@reduxjs/toolkit";
import { stateSliceReducerPointsOfInterest } from "./stateSlicePointsOfInterest";
import { stateSliceReducerSelectedPoi } from "./StateSliceSelectedPoi";

export const stateStore = configureStore({
  reducer: {
    pointsOfInterestReducer: stateSliceReducerPointsOfInterest,
    // selectedPoiReducer: stateSliceReducerSelectedPoi
  }
})
