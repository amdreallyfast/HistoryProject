import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  searchTerm: null,
  searchStatus: null,
  searchResults: null,
  runNewSearch: false,


  isLoading: false,
  isError: false,
  isFetching: false,
  isSuccess: false
}

export const stateSliceSearch = createSlice({
  name: "stateSliceSearch",
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      stateSliceSearch
      setSearchTerm
    },
    setSearchResult: (state, action) => {
      stateSliceSearch
      setSearchResult
    },

  }
})

export const { setSearchTerm, setSearchResult } = stateSliceSearch.actions
