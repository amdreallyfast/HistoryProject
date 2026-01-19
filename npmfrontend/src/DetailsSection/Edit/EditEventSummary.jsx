import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editStateActions } from "../../AppState/stateSliceEditPoi"
import { detailRestrictions } from "./detailRestrictions"

export function EditEventSummary() {
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()

  const summaryInputRef = useRef()
  const charCountLabelRef = useRef()
  const [error, setError] = useState(null)

  // Validation function
  const isComplete = (summary) => {
    if (!summary || summary.trim() === "") {
      setError("Missing required value: 'Summary'")
      return false
    }
    setError(null)
    return true
  }

  // Determine border color based on validation state
  const getBorderClass = () => {
    if (error) {
      return "border-red-500 border-opacity-80 border-2"
    } else {
      return "border-green-600 border-opacity-80 border-2"
    }
  }

  // On start, load values from state
  useEffect(() => {
    console.log({ "EditEventSummary.useEffect[editState.Summary]": editState.summary })

    if (!summaryInputRef.current || !charCountLabelRef.current) {
      return
    }

    charCountLabelRef.current.innerHTML = `0/${detailRestrictions.maxSummaryLength}`
    if (editState.summary) {
      summaryInputRef.current.innerHTML = editState.summary
      charCountLabelRef.current.innerHTML = `${editState.summary.length}/${detailRestrictions.maxSummaryLength}`
    }
    isComplete(editState.summary)
  }, [summaryInputRef.current, charCountLabelRef.current, editState.summary])

  // On text change, set state
  const summaryTextChanged = (e) => {
    let newText = e.target.value
    reduxDispatch(editStateActions.setSummary(newText))
    charCountLabelRef.current.innerHTML = `${newText.length}/${detailRestrictions.maxSummaryLength}`
    isComplete(newText)
  }

  return (
    <div className={`flex flex-col m-1 rounded-md ${getBorderClass()}`}>
      {/* Summary */}
      <textarea ref={summaryInputRef}
        className="m-2 text-black overflow-auto "
        rows={6}
        maxLength={detailRestrictions.maxSummaryLength}
        placeholder={`Summary (max ${detailRestrictions.maxSummaryLength})`}
        onChange={(e) => summaryTextChanged(e)} />

      {/* char count */}
      <label ref={charCountLabelRef} className="text-right mr-2"></label>

      {/* Error display */}
      <label className="text-red-500 text-sm m-1 block text-left">{error}</label>
    </div>
  )
}
