import { configureStore } from "@reduxjs/toolkit";
import { stateSliceEvent } from "./stateSliceEvent";
import { stateSliceEditEvent } from "./stateSliceEditEvent";
import { stateSliceMouseInfo } from "./stateSliceMouseInfo";
import { stateSliceSelectedEvent } from "./stateSliceSelectedEvent";
import { stateSliceEditSources } from "./stateSliceEditSources";

export const stateStore = configureStore({
  reducer: {
    eventReducer: stateSliceEvent.reducer,
    editEventReducer: stateSliceEditEvent.reducer,
    editSources: stateSliceEditSources.reducer,
    mouseInfoReducer: stateSliceMouseInfo.reducer,
    selectedEventReducer: stateSliceSelectedEvent.reducer
  }
})
