import { configureStore } from "@reduxjs/toolkit";
import { stateSliceReducerPointsOfInterest } from "./stateSlicePointsOfInterest";
import { stateSliceReducerClickedPoints } from "./stateSliceClickedPoints";

export const stateStore = configureStore({
  reducer: {
    pointsOfInterestReducer: stateSliceReducerPointsOfInterest,
    clickedPointsReducer: stateSliceReducerClickedPoints,
  }
})
