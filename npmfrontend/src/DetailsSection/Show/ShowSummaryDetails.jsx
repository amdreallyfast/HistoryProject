import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editStateActions } from "../AppState/stateSliceEditPoi"
import { detailRestrictions } from "../GlobeSection/constValues"

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
