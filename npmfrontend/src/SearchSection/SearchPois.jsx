import { useSelector, useDispatch } from "react-redux"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { setSearchResult } from "../AppState/stateSliceSearch"
import { setAllPois } from "../AppState/stateSlicePoi"
import { useEffect } from "react"
import { _ as lodash } from "lodash"

async function getSearchResults(url) {
  let response = await fetch(url)
  if (!response.ok) {
    throw Error(`${response.status} (${response.statusText}): '${response.url}'`)
  }
  return response.json()
}

export function SearchPois(searchText, lowerBoundYear, lowerBoundMon, lowerBoundDay, upperBoundYear, upperBoundMon, upperBoundDay) {
  const queryName = "anotherGetSearchResults"

  // Reset query cache and force a new search (rather than just trigger a refresh).
  const queryClient = useQueryClient()
  queryClient.resetQueries({ queryKey: [queryName] })

  // TODO: turn into a GET function once a server is available. For now (11/4/2023), just read from local file.
  let searchUri = import.meta.env.BASE_URL + "countryData.json"

  // Construct query hook as dependant on searchUri (that is, will re-run whenever it changes).
  const getSearchResultsQuery = useQuery({
    // Update query when these keys change
    queryKey: [queryName, searchUri],

    // Core function that actually does the search
    queryFn: () => getSearchResults(searchUri),

    // searchUri must not be null
    enabled: !!searchUri
  })

  useEffect(() => {
    if (getSearchResultsQuery.isLoading) {
      console.log("loading")
    }
    else if (getSearchResultsQuery.isError) {
      console.log("error")
    }
    else if (getSearchResultsQuery.isFetching) {
      // Ignore. Carry on.
      console.log("fetching")
    }
    else if (getSearchResultsQuery.isSuccess) {
      console.log("success")
    }
    else {
      console.log({ msg: "Unknown query status", error: getSearchResultsQuery.status })
    }
  }, [getSearchResultsQuery.isLoading,
  getSearchResultsQuery.isError,
  getSearchResultsQuery.isSuccess,
  getSearchResultsQuery.isFetching,
  getSearchResultsQuery.data])
}