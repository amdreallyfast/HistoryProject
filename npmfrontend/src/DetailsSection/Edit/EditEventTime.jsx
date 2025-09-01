import { useEffect, useReducer, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editStateActions } from "../../AppState/stateSliceEditPoi"

export function EditEventTime() {
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()

  const earliestYearInputRef = useRef()
  const earliestMonthInputRef = useRef()
  const earliestDayInputRef = useRef()
  const latestYearInputRef = useRef()
  const latestMonthInputRef = useRef()
  const latestDayInputRef = useRef()

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
    let inputNotDefined = !earliestYearInputRef.current && !earliestMonthInputRef.current && !earliestDayInputRef.current && !latestYearInputRef.current && !latestMonthInputRef.current && !latestDayInputRef.current
    if (inputNotDefined) {
      return
    }

    setEarliestYear(editState.eventTimeEarliestYear || "")
    setEarliestMonth(editState.eventTimeEarliestMonth || "")
    setEarliestDay(editState.eventTimeEarliestDay || "")
    setLatestYear(editState.eventTimeLatestYear || "")
    setLatestMonth(editState.eventTimeLatestMonth || "")
    setLatestDay(editState.eventTimeLatestDay || "")

    isComplete(earliestYear, earliestMonth, earliestDay, setEarliestError)
    isComplete(latestYear, latestMonth, latestDay, setLatestError)
  }, [
    earliestYearInputRef.current,
    earliestMonthInputRef.current,
    earliestDayInputRef.current,
    latestYearInputRef.current,
    latestMonthInputRef.current,
    latestDayInputRef.current
  ])

  // Validation function
  const isComplete = (year, month, day, setErrorFunction) => {
    console.log({ "EditEventTime.isComplete": `year: '${year}', month: '${month}', day: '${day}'` })

    let yearDefined = (year && year.trim() !== "")
    if (!yearDefined) {
      setErrorFunction("Missing required value: 'Year'")
      return
    }
    else if (isNaN(year)) {
      setErrorFunction(`Year is not a number: '${year}'. Use negative for BC and postive for AD.`)
      return
    }
    else if (!Number.isInteger(Number(year))) {
      setErrorFunction(`Year must be an integer (no decimal): '${year}'`)
      return
    }

    let monthDefined = (month && month?.trim() !== "")
    if (monthDefined) {
      if (isNaN(month) || !Number.isInteger(Number(month)) || month < 1) {
        setErrorFunction(`Month (if defined) must be a positive integer (no decimal): '${month}'`)
        return
      }
    }

    let dayDefined = (day && day.trim() !== "")
    if (dayDefined) {
      if (isNaN(day) || !Number.isInteger(Number(day)) || day < 1)
        setErrorFunction(`Day (if defined) must be a positive integer (no decimal): '${day}'`)
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

  // Determine border color based on validation state
  const getBorderClass = () => {
    const hasErrors = earliestError || latestError
    if (hasErrors) {
      return "border-red-500 border-opacity-80 border-2"
    } else {
      return "border-green-600 border-opacity-80 border-2"
    }
  }

  return (
    <div className={`flex flex-col m-1 rounded-md ${getBorderClass()}`}>
      <h3 className="text-white font-medium">Event time</h3>

      {/* Earliest subsection */}
      <div className="m-1">
        <span className="text-white text-sm text-left block">Earliest possible:</span>
        <div className="grid grid-cols-3 gap-1">
          <input ref={earliestYearInputRef} className="text-black text-center rounded-md border border-gray-300 px-2 py-1" type="text" value={earliestYear} onChange={onEarliestYearChanged} placeholder="YYYY (ex: -500)" />
          <input ref={earliestMonthInputRef} className="text-black text-center rounded-md border border-gray-300 px-2 py-1" type="text" value={earliestMonth} onChange={onEarliestMonthChanged} placeholder="MM (optional)" />
          <input ref={earliestDayInputRef} className="text-black text-center rounded-md border border-gray-300 px-2 py-1" type="text" value={earliestDay} onChange={onEarliestDayChanged} placeholder="DD (optional)" />
        </div>
        <label className="text-red-500 text-sm mt-1 block text-left">{earliestError}</label>
      </div>

      {/* Latest subsection */}
      <div className="m-1">
        <span className="text-white text-sm text-left block">Latest possible:</span>
        <div className="grid grid-cols-3 gap-1">
          <input ref={latestYearInputRef} className="text-black text-center rounded-md border border-gray-300 px-2 py-1" type="text" value={latestYear} onChange={onLatestYearChanged} placeholder="YYYY (ex: -500)" />
          <input ref={latestMonthInputRef} className="text-black text-center rounded-md border border-gray-300 px-2 py-1" type="text" value={latestMonth} onChange={onLatestMonthChanged} placeholder="MM (optional)" />
          <input ref={latestDayInputRef} className="text-black text-center rounded-md border border-gray-300 px-2 py-1" type="text" value={latestDay} onChange={onLatestDayChanged} placeholder="DD (optional)" />
        </div>
        <label className="text-red-500 text-sm mt-1 block text-left">{latestError}</label>
      </div>
    </div>
  )
}