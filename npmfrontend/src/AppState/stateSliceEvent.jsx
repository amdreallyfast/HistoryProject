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
    upsertEventRevisions: (state, action) => {
      console.log({ stateSliceEvent_upsertEventRevisions: action.payload })

      // Replace one event's revisions in place (used after a submit re-fetches the
      // authoritative GetAllRevisions for the edited event): drop the existing entries for
      // that eventId and append the freshly fetched ones. Other events are untouched, and
      // getLatestRevisions dedups for display.
      let eventId = action.payload.eventId
      let revisions = action.payload.revisions || []
      let others = (state.allEvents || []).filter(ev => ev.eventId !== eventId)
      return {
        ...state,
        allEvents: [...others, ...revisions]
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
