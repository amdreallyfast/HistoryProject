import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editStateActions } from "../../AppState/stateSliceEditPoi"

export function EditEventTime() {
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()

  const [earliestYear, setEarliestYear] = useState("")
  const [earliestMonth, setEarliestMonth] = useState("")
  const [earliestDay, setEarliestDay] = useState("")
  const [latestYear, setLatestYear] = useState("")
  const [latestMonth, setLatestMonth] = useState("")
  const [latestDay, setLatestDay] = useState("")
  const [earliestError, setEarliestError] = useState(null)
  const [latestError, setLatestError] = useState(null)

  // On start, load values from state
  useEffect(() => {
    console.log({ "EditEventTime.useEffect": editState })

    setEarliestYear(editState.eventTimeEarliestYear || "")
    setEarliestMonth(editState.eventTimeEarliestMonth || "")
    setEarliestDay(editState.eventTimeEarliestDay || "")
    setLatestYear(editState.eventTimeLatestYear || "")
    setLatestMonth(editState.eventTimeLatestMonth || "")
    setLatestDay(editState.eventTimeLatestDay || "")
  }, [editState.eventTimeEarliestYear, editState.eventTimeEarliestMonth, editState.eventTimeEarliestDay,
  editState.eventTimeLatestYear, editState.eventTimeLatestMonth, editState.eventTimeLatestDay])

  // Validation function
  const isComplete = (year, month, day, setErrorFunction) => {
    if (!year || year.trim() === "") {
      setErrorFunction("Missing required value: 'Year'")
      return
    }
    
    if (isNaN(year) || !Number.isInteger(Number(year))) {
      setErrorFunction(`Year is not a number: '${year}'`)
      return
    }
    
    if (month && month.trim() !== "" && (isNaN(month) || !Number.isInteger(Number(month)))) {
      setErrorFunction(`Month is not a number: '${month}'`)
      return
    }
    
    if (day && day.trim() !== "" && (isNaN(day) || !Number.isInteger(Number(day)))) {
      setErrorFunction(`Day is not a number: '${day}'`)
      return
    }
    
    setErrorFunction(null)
  }

  // Event handlers
  const onEarliestYearChanged = (e) => {
    const value = e.target.value
    setEarliestYear(value)
    reduxDispatch(editStateActions.setEventTimeEarliestYear(value || null))
    isComplete(value, earliestMonth, earliestDay, setEarliestError)
  }

  const onEarliestMonthChanged = (e) => {
    const value = e.target.value
    setEarliestMonth(value)
    reduxDispatch(editStateActions.setEventTimeEarliestMonth(value || null))
    isComplete(earliestYear, value, earliestDay, setEarliestError)
  }

  const onEarliestDayChanged = (e) => {
    const value = e.target.value
    setEarliestDay(value)
    reduxDispatch(editStateActions.setEventTimeEarliestDay(value || null))
    isComplete(earliestYear, earliestMonth, value, setEarliestError)
  }

  const onLatestYearChanged = (e) => {
    const value = e.target.value
    setLatestYear(value)
    reduxDispatch(editStateActions.setEventTimeLatestYear(value || null))
    isComplete(value, latestMonth, latestDay, setLatestError)
  }

  const onLatestMonthChanged = (e) => {
    const value = e.target.value
    setLatestMonth(value)
    reduxDispatch(editStateActions.setEventTimeLatestMonth(value || null))
    isComplete(latestYear, value, latestDay, setLatestError)
  }

  const onLatestDayChanged = (e) => {
    const value = e.target.value
    setLatestDay(value)
    reduxDispatch(editStateActions.setEventTimeLatestDay(value || null))
    isComplete(latestYear, latestMonth, value, setLatestError)
  }

  return (
    <div className="flex flex-col border-2 m-1 border-gray-600">
      <h3 className="text-white font-medium">Event time</h3>

      {/* Earliest subsection */}
      <div className="m-1">
        <span className="text-white text-sm text-left">Earliest possiblxe:</span>
        <div className="grid grid-cols-3 gap-1">
          <input
            type="text"
            value={earliestYear}
            onChange={onEarliestYearChanged}
            placeholder="YYYY"
            className="text-black text-center"
          />
          <input
            type="text"
            value={earliestMonth}
            onChange={onEarliestMonthChanged}
            placeholder="MM (optional)"
            className="text-black text-center"
          />
          <input
            type="text"
            value={earliestDay}
            onChange={onEarliestDayChanged}
            placeholder="DD (optional)"
            className="text-black text-center"
          />
        </div>
        {earliestError && (
          <div className="text-red-500 text-sm mt-1">{earliestError}</div>
        )}
      </div>

      {/* Latest subsection */}
      <div className="m-1">
        <label className="text-white text-sm text-left">Latest possible:</label>
        <div className="grid grid-cols-3 gap-1">
          <input
            type="text"
            value={latestYear}
            onChange={onLatestYearChanged}
            placeholder="YYYY"
            className="text-black text-center"
          />
          <input
            type="text"
            value={latestMonth}
            onChange={onLatestMonthChanged}
            placeholder="MM (optional)"
            className="text-black text-center"
          />
          <input
            type="text"
            value={latestDay}
            onChange={onLatestDayChanged}
            placeholder="DD (optional)"
            className="text-black text-center"
          />
        </div>
        {latestError && (
          <div className="text-red-500 text-sm mt-1">{latestError}</div>
        )}
      </div>
    </div>
  )
}