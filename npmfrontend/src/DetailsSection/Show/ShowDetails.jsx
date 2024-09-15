import { useSelector } from "react-redux"
import { HeaderDetails } from "./HeaderDetails";
import { ImageDetails } from "./ImageDetails";
import { RegionDetails } from "./RegionDetails";
import { SummaryDetails } from "./SummaryDetails";

export function ShowDetails({ }) {
  const poiState = useSelector((state) => state.poiReducer)

  // TODO: ??pull from poiState or let the individual modules do that??

  return (
    <div className="flex flex-col h-full">
      <HeaderDetails />
      <ImageDetails />
      <RegionDetails />
      <SummaryDetails />

      {/* Revision author fixed by whoever is logged in */}
      <input className="m-2 text-black text-left" type="text" maxLength={128} placeholder="Revision author" />
    </div>
  )
}