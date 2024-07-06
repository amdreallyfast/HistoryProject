import { createSlice } from "@reduxjs/toolkit"

// TODO: define POI
/*
let poi = {
  id: <guid>,
  title: <string>
  image: <nullable>
  description: <string>
  ??which planet??
  location: {
    // ??also store x,y,z in the database??
    id,lat,long,x,y,z
  }
  regionBoundaryPoints: [
    {
      lat,long,x,y,z
    }
  ]	
}
*/


const initialState = {
  allPois: null,
  selectedPoi: null,
  prevSelectedPoi: null
}

export const stateSlicePoi = createSlice({
  name: "stateSlicePoi",
  initialState,
  reducers: {
    setAllPois: (state, action) => {
      console.log({ stateSlicePoi_setAllPois: action.payload })

      // Reset selectedPoi along with recording the new collection.
      return {
        ...state,
        allPois: action.payload,
        selectedPoi: null,
        prevSelectedPoi: null
      }
    },
    setSelectedPoi: (state, action) => {
      console.log({ stateSlicePoi_setSelectedPoi: action.payload })

      return {
        ...state,
        selectedPoi: action.payload,
        prevSelectedPoi: state.selectedPoi
      }
    }
  }
})

// export const { setAllPois, setSelectedPoi } = stateSlicePoi.actions
export const poiStateActions = stateSlicePoi.actions
