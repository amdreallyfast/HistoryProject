import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  allEvents: null,
  selectedEvent: null,
  prevSelectedEvent: null
}

export const stateSliceEvent = createSlice({
  name: "stateSliceEvent",
  initialState,
  reducers: {
    setAllEvents: (state, action) => {
      console.log({ stateSliceEvent_setAllEvents: action.payload })

      // Reset selectedEvent along with recording the new collection.
      return {
        ...state,
        allEvents: action.payload,
        selectedEvent: null,
        prevSelectedEvent: null
      }
    },
    appendEvent: (state, action) => {
      console.log({ stateSliceEvent_appendEvent: action.payload })

      return {
        ...state,
        allEvents: [...(state.allEvents || []), action.payload]
      }
    },
    setSelectedEvent: (state, action) => {
      console.log({ stateSliceEvent_setSelectedEvent: action.payload })

      return {
        ...state,
        selectedEvent: action.payload,
        prevSelectedEvent: state.selectedEvent
      }
    }
  }
})

export const eventStateActions = stateSliceEvent.actions
