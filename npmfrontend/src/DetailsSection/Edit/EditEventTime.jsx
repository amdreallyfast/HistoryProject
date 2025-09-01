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

  const [firstCall, setFirstCall] = useState(true)

  // On start, load values from state
  useEffect(() => {
    console.log({ "EditEventTime.useEffect": editState })
    if (firstCall) {
      console.log("first call")
      setFirstCall(false)
    }
    let inputNotDefined = !earliestYearInputRef.current && !earliestMonthInputRef.current && !earliestDayInputRef.current && !latestYearInputRef.current && !latestMonthInputRef.current && !latestDayInputRef.current
    console.log(`earliestYearInputRef: '${earliestYearInputRef.current}'`)
    console.log(`earliestMonthInputRef: '${earliestMonthInputRef.current}'`)
    console.log(`earliestDayInputRef: '${earliestDayInputRef.current}'`)
    console.log(`latestYearInputRef: '${latestYearInputRef.current}'`)
    console.log(`latestMonthInputRef: '${latestMonthInputRef.current}'`)
    console.log(`latestDayInputRef: '${latestDayInputRef.current}'`)
    console.log(`inputNotDefined: '${inputNotDefined}'`)
    if (inputNotDefined) {
      console.log("someone not defined, returning")
      return
    }

    setEarliestYear(editState.eventTimeEarliestYear || "")
    setEarliestMonth(editState.eventTimeEarliestMonth || "")
    setEarliestDay(editState.eventTimeEarliestDay || "")
    setLatestYear(editState.eventTimeLatestYear || "")
    setLatestMonth(editState.eventTimeLatestMonth || "")
    setLatestDay(editState.eventTimeLatestDay || "")

    console.log("initial startup done")
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
    else if (!Number.isInteger(year)) {
      setErrorFunction(`Year must be an integer (no decimal): '${year}'`)
      return
    }

    let monthDefined = (month && month?.trim() !== "")
    if (monthDefined) {
      if (isNaN(month) || !Number.isInteger(month) || month < 1) {
        setErrorFunction(`Month (if defined) must be a positive integer (no decimal): '${month}'`)
        return
      }
    }

    let dayDefined = (day && day.trim() !== "")
    if (dayDefined) {
      if (isNaN(day) || !Number.isInteger(day) || day < 1)
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

  return (
    <div className="flex flex-col border-2 m-1 border-gray-600">
      <h3 className="text-white font-medium">Event time</h3>

      {/* Earliest subsection */}
      <div className="m-1">
        <span className="text-white text-sm text-left">Earliest possiblxe:</span>
        <div className="grid grid-cols-3 gap-1">
          <input ref={earliestYearInputRef} className="text-black text-center" type="text" value={earliestYear} onChange={onEarliestYearChanged} placeholder="YYYY (ex: -500)" />
          <input ref={earliestMonthInputRef} className="text-black text-center" type="text" value={earliestMonth} onChange={onEarliestMonthChanged} placeholder="MM (optional)" />
          <input ref={earliestDayInputRef} className="text-black text-center" type="text" value={earliestDay} onChange={onEarliestDayChanged} placeholder="DD (optional)" />
        </div>
        <label className="text-red-500 text-sm mt-1">{earliestError}</label>
      </div>

      {/* Latest subsection */}
      <div className="m-1">
        <span className="text-white text-sm text-left">Latest possiblxe:</span>
        <div className="grid grid-cols-3 gap-1">
          <input ref={latestYearInputRef} className="text-black text-center" type="text" value={latestYear} onChange={onLatestYearChanged} placeholder="YYYY (ex: -500)" />
          <input ref={latestMonthInputRef} className="text-black text-center" type="text" value={latestMonth} onChange={onLatestMonthChanged} placeholder="MM (optional)" />
          <input ref={latestDayInputRef} className="text-black text-center" type="text" value={latestDay} onChange={onLatestDayChanged} placeholder="DD (optional)" />
        </div>
        <label className="text-red-500 text-sm mt-1">{latestError}</label>
      </div>
    </div>
  )
}