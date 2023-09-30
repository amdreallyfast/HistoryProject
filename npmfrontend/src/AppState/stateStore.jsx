import { configureStore } from "@reduxjs/toolkit";
import { stateSliceReducerPointsOfInterest } from "./stateSlicePointsOfInterest";

export const stateStore = configureStore({
  reducer: {
    pointsOfInterestReducer: stateSliceReducerPointsOfInterest,
  }
})
