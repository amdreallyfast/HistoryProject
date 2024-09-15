import { useSelector } from "react-redux"
import { ShowHeaderDetails } from "./ShowHeaderDetails"
import { ShowImageDetails } from "./ShowImageDetails"
import { ShowRegionDetails } from "./ShowRegionDetails"
import { ShowSummaryDetails } from "./ShowSummaryDetails"

export function ShowDetails({ }) {
  const poiState = useSelector((state) => state.poiReducer)

  // TODO: ??pull from poiState or let the individual modules do that??

  return (
    <div className="flex flex-col h-full">
      <ShowHeaderDetails />
      <ShowImageDetails />
      <ShowRegionDetails />
      <ShowSummaryDetails />

      {/* Revision author fixed by whoever is logged in */}
      <input className="m-2 text-black text-left" type="text" maxLength={128} placeholder="Revision author" />
    </div>
  )
}