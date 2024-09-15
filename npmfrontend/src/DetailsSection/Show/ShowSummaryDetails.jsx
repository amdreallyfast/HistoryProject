import { useSelector } from "react-redux"

export function ShowSummaryDetails() {

  const selectedPoiState = useSelector((state) => state.selectedPoiReducer)

  return (
    <div className="flex flex-col">
      <label className="m-2 text-white">
        {selectedPoiState.summary}
      </label>
    </div>
  )
}
