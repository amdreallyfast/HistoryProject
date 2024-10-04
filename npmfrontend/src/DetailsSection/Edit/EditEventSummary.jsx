import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editStateActions } from "../../AppState/stateSliceEditPoi"
import { detailRestrictions } from "./detailRestrictions"

export function EditEventSummary() {
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()

  const summaryInputRef = useRef()
  const charCountLabelRef = useRef()

  // On start, load values from state
  useEffect(() => {
    console.log({ "EditEventSummary.useEffect[editState.Summary]": editState.summary })

    if (!summaryInputRef.current || !charCountLabelRef.current) {
      return
    }

    charCountLabelRef.current.innerHTML = `0/${detailRestrictions.maxSummaryLength}`
    if (editState.summary) {
      summaryInputRef.current.innerHTML = editState.summary
      charCountLabelRef.current.innerHTML = `${newText.length}/${detailRestrictions.maxSummaryLength}`
    }
  }, [summaryInputRef.current, charCountLabelRef.current, editState.summary])

  // On text change, set state
  const summaryTextChanged = (e) => {
    let newText = e.target.value
    reduxDispatch(editStateActions.setSummary(newText))
    charCountLabelRef.current.innerHTML = `${newText.length}/${detailRestrictions.maxSummaryLength}`
  }

  return (
    <div className="flex flex-col">
      {/* Summary */}
      <textarea ref={summaryInputRef}
        className="m-2 text-black overflow-auto "
        rows={6}
        maxLength={detailRestrictions.maxSummaryLength}
        placeholder={`Summary (max ${detailRestrictions.maxSummaryLength})`}
        onChange={(e) => summaryTextChanged(e)} />

      {/* char count */}
      <label ref={charCountLabelRef} className="text-right"></label>
    </div>
  )
}
