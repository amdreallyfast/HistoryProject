import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editSourcesStateActions } from "../../AppState/stateSliceEditSources"
import { isDateRangeInverted, isMonthOutOfRange, isDayOutOfRange, isExactDate } from "./detailRestrictions"

/*
TODO: (??maybe just duplicate the form and customize it? how much do you want to avoid duplication? are you willing to sacrifice the readability of the code??
  
  split further
  EditTimeRange takes:
    lowerBoundYearStartingDate,
    lowerBoundYearChangedCallback,
    
    lowerBoundMonthStartingDate,
    lowerBoundMonthChangedCallback,
    
    lowerBoundDayStartingDate,
    lowerBoundDayChangedCallback,
    
    upperBoundYearStartingDate,
    upperBoundYearChangedCallback,
    
    upperBoundMonthStartingDate,
    upperBoundMonthChangedCallback,
    
    upperBoundDayStartingDate,
    upperBoundDayChangedCallback,
  
    EditSourcePublicationTimeRange takes:
      Id: guid,   // used to speak with the state machine
      
      uses:
        EditTimeRange
        Provides callbacks
        When callbacks are called, will dispatch to the state machine
    
    EditSourceAuthorLifetimeTimeRange taks:
      Id: guid,   // used to speak with the state machine
      
      uses:
        EditTimeRange
        Provides callbacks
        When callbacks are called, will dispatch to the state machine
   
*/



export function EditSourcePublicationTimeRange({
  editId,
}) {
  // if (!stateChangeFunctionCallback) {
  //   throw new Error("must provide 'stateChangeFunctionCallback'")
  // }

  const editSource = useSelector((state) => state.editSources[editId])
  const reduxDispatch = useDispatch()

  // Lower bound
  const pubDateLowerBoundContainerRef = useRef()
  const pubDateLowerBoundYearRef = useRef()
  const pubDateLowerBoundMonthRef = useRef()
  const pubDateLowerBoundDayRef = useRef()

  //??necessary? keep track of this in the state machine??
  const [publicationDateLowerBoundComplete, setPublicationDateLowerBoundComplete] = useState()

  const [lowerBoundError, setLowerBoundError] = useState()
  const [rangeError, setRangeError] = useState(null)

  // "Exact date" mode: a single publication date instead of a range. Persisted via the
  // begin==end proxy (no boolean column) — while on, the lower bound is mirrored into the
  // upper bound in Redux so the submitted source has PublicationLB==PublicationUB.
  const [exactDate, setExactDate] = useState(false)

  // const setLowerBoundErrorStyle = () => {
  //   pubDateLowerBoundContainerRef.current.style.border = "2px solid red"
  // }

  // const clearLowerBoundErrorStyle = () => {
  //   pubDateLowerBoundContainerRef.current.style.border = "2px solid transparent"
  // }

  const evaluateLowerBoundComplete = () => {
    pubDateLowerBoundContainerRef.current.style.border = "2px solid red"

    let year = pubDateLowerBoundYearRef.current.value
    if (isNaN(Number(year))) {
      setLowerBoundError(`Year is not a number: '${year}'`)
      setRangeError(null)
      return false
    }
    else if (!year) {
      setLowerBoundError("Missing required value: 'Year'")
      setRangeError(null)
      return false
    }

    let month = pubDateLowerBoundMonthRef.current.value
    if (isNaN(Number(month))) {
      setLowerBoundError(`Month is not a number: '${month}'`)
      setRangeError(null)
      return false
    }
    if (isMonthOutOfRange(month)) {
      setLowerBoundError(`Month must be between 1 and 12: '${month}'`)
      setRangeError(null)
      return false
    }

    let day = pubDateLowerBoundDayRef.current.value
    if (isNaN(Number(day))) {
      setLowerBoundError(`Day is not a number: '${day}'`)
      setRangeError(null)
      return false
    }
    if (isDayOutOfRange(day)) {
      setLowerBoundError(`Day must be between 1 and 31: '${day}'`)
      setRangeError(null)
      return false
    }

    pubDateLowerBoundContainerRef.current.style.border = "2px solid transparent"
    setLowerBoundError("")
    return true
  }

  const validateBoth = () => {
    const lowerValid = evaluateLowerBoundComplete()
    // In exact mode the upper inputs are hidden (refs null) and the upper bound is just a
    // mirror of the lower bound, so validating it would deref null — skip it.
    if (exactDate) return lowerValid
    const upperValid = evaluateUpperBoundComplete()
    return lowerValid && upperValid
  }

  // On changed
  // In exact-date mode, mirror each lower-bound change into the matching upper bound in
  // Redux so the persisted bounds stay equal (the begin==end proxy). The upper inputs are
  // hidden, so the mirror is dispatch-only (no ref to update).
  const onPubDateLowerBoundYearChanged = (e) => {
    console.log({ "EditSource.onPubDateLowerBoundYearChanged": e })

    validateBoth()
    let args = {
      editId: editId,
      value: e.target.value
    }
    reduxDispatch(editSourcesStateActions.updateSourcePubDateEarliestYear(args))
    if (exactDate) {
      reduxDispatch(editSourcesStateActions.updateSourcePubDateLatestYear(args))
    }
  }

  const onPubDateLowerBoundMonthChanged = (e) => {
    console.log({ "EditSource.onPubDateLowerBoundMonthChanged": e })

    validateBoth()
    let args = {
      editId: editId,
      value: e.target.value
    }
    reduxDispatch(editSourcesStateActions.updateSourcePubDateEarliestMonth(args))
    if (exactDate) {
      reduxDispatch(editSourcesStateActions.updateSourcePubDateLatestMonth(args))
    }
  }

  const onPubDateLowerBoundDayChanged = (e) => {
    console.log({ "EditSource.onPubDateLowerBoundDayChanged": e })

    validateBoth()
    let args = {
      editId: editId,
      value: e.target.value
    }
    reduxDispatch(editSourcesStateActions.updateSourcePubDateEarliestDay(args))
    if (exactDate) {
      reduxDispatch(editSourcesStateActions.updateSourcePubDateLatestDay(args))
    }
  }

  // Toggling "Exact date". When enabling, mirror the current lower bound into the upper
  // bound once (Redux) so begin==end immediately. Disabling makes no data change — the
  // upper bound already equals the lower and the user can now widen it.
  const onExactDateChanged = (e) => {
    const isChecked = e.target.checked
    setExactDate(isChecked)
    if (isChecked) {
      const year = pubDateLowerBoundYearRef.current?.value ?? ""
      const month = pubDateLowerBoundMonthRef.current?.value ?? ""
      const day = pubDateLowerBoundDayRef.current?.value ?? ""
      reduxDispatch(editSourcesStateActions.updateSourcePubDateLatestYear({ editId, value: year }))
      reduxDispatch(editSourcesStateActions.updateSourcePubDateLatestMonth({ editId, value: month }))
      reduxDispatch(editSourcesStateActions.updateSourcePubDateLatestDay({ editId, value: day }))
      setRangeError(null)
    }
  }

  useEffect(() => {
    console.log({ "EditSource.useEffect[editSource.publicationTime.earliestYear]": editSource?.publicationTime.earliestYear })
    if (!editSource) return // deleted last frame from state machine
    if (!pubDateLowerBoundYearRef.current) return
    if (!pubDateLowerBoundMonthRef.current) return
    if (!pubDateLowerBoundDayRef.current) return

    // on load
    pubDateLowerBoundYearRef.current.value = editSource.publicationTime.earliestYear
    pubDateLowerBoundMonthRef.current.value = editSource.publicationTime.earliestMonth
    pubDateLowerBoundDayRef.current.value = editSource.publicationTime.earliestDay

    // Open in exact-date mode if the stored source publication date is a single point
    // (begin == end with a year). A blank/new source stays in range mode.
    setExactDate(isExactDate(editSource.publicationTime))

    evaluateLowerBoundComplete()
  }, [
    pubDateLowerBoundYearRef.current,
    pubDateLowerBoundMonthRef.current,
    pubDateLowerBoundDayRef.current
  ])





  const pubDateUpperBoundYearRef = useRef()
  const pubDateUpperBoundMonthRef = useRef()
  const pubDateUpperBoundDayRef = useRef()
  const [upperBoundError, setUpperBoundError] = useState()
  const pubDateUpperBoundContainerRef = useRef()

  const evaluateUpperBoundComplete = () => {
    pubDateUpperBoundContainerRef.current.style.border = "2px solid red"

    let year = pubDateUpperBoundYearRef.current.value
    if (isNaN(Number(year))) {
      setUpperBoundError(`Year is not a number: '${year}'`)
      setRangeError(null)
      return false
    }
    else if (!year) {
      setUpperBoundError("Missing required value: 'Year'")
      setRangeError(null)
      return false
    }

    let month = pubDateUpperBoundMonthRef.current.value
    if (isNaN(Number(month))) {
      setUpperBoundError(`Month is not a number: '${month}'`)
      setRangeError(null)
      return false
    }
    if (isMonthOutOfRange(month)) {
      setUpperBoundError(`Month must be between 1 and 12: '${month}'`)
      setRangeError(null)
      return false
    }

    let day = pubDateUpperBoundDayRef.current.value
    if (isNaN(Number(day))) {
      setUpperBoundError(`Day is not a number: '${day}'`)
      setRangeError(null)
      return false
    }
    if (isDayOutOfRange(day)) {
      setUpperBoundError(`Day must be between 1 and 31: '${day}'`)
      setRangeError(null)
      return false
    }

    pubDateUpperBoundContainerRef.current.style.border = "2px solid transparent"
    setUpperBoundError("")

    if (isDateRangeInverted(
      pubDateLowerBoundYearRef.current.value,
      pubDateLowerBoundMonthRef.current.value,
      pubDateLowerBoundDayRef.current.value,
      year, month, day
    )) {
      pubDateUpperBoundContainerRef.current.style.border = "2px solid red"
      setRangeError("Latest cannot be earlier than earliest")
      return false
    }

    setRangeError(null)
    return true
  }

  const onPubDateUpperBoundYearChanged = (e) => {
    console.log({ "EditSource.onPubDateUpperBoundYearChanged": e })
    validateBoth()
    let args = { editId: editId, value: e.target.value }
    reduxDispatch(editSourcesStateActions.updateSourcePubDateLatestYear(args))
  }

  const onPubDateUpperBoundMonthChanged = (e) => {
    console.log({ "EditSource.onPubDateUpperBoundMonthChanged": e })
    validateBoth()
    let args = { editId: editId, value: e.target.value }
    reduxDispatch(editSourcesStateActions.updateSourcePubDateLatestMonth(args))
  }

  const onPubDateUpperBoundDayChanged = (e) => {
    console.log({ "EditSource.onPubDateUpperBoundDayChanged": e })
    validateBoth()
    let args = { editId: editId, value: e.target.value }
    reduxDispatch(editSourcesStateActions.updateSourcePubDateLatestDay(args))
  }

  useEffect(() => {
    if (!editSource) return
    if (!pubDateUpperBoundYearRef.current) return
    if (!pubDateUpperBoundMonthRef.current) return
    if (!pubDateUpperBoundDayRef.current) return

    pubDateUpperBoundYearRef.current.value = editSource.publicationTime.latestYear
    pubDateUpperBoundMonthRef.current.value = editSource.publicationTime.latestMonth
    pubDateUpperBoundDayRef.current.value = editSource.publicationTime.latestDay

    evaluateUpperBoundComplete()
  }, [
    pubDateUpperBoundYearRef.current,
    pubDateUpperBoundMonthRef.current,
    pubDateUpperBoundDayRef.current
  ])

  return (
    <div className="flex flex-col m-1">
      <label className="text-left text-lg">Publication date</label>

      {/* Exact date toggle */}
      <label className="flex items-center justify-between p-1">
        <span>Exact date</span>
        <input
          data-testid="source-exact-date-checkbox"
          type="checkbox"
          checked={exactDate}
          onChange={onExactDateChanged}
          className="ml-2"
        />
      </label>

      {/* Earliest (the only date row in exact mode) */}
      <div ref={pubDateLowerBoundContainerRef} className="flex flex-col p-1">
        <label className="text-left">{exactDate ? "Date" : "Earliest possible"}</label>
        <div className="grid grid-cols-3 auto-rows-min gap-1">
          <input ref={pubDateLowerBoundYearRef} className="text-black" type="text" placeholder="YYYY" onChange={onPubDateLowerBoundYearChanged}></input>
          <input ref={pubDateLowerBoundMonthRef} className="text-black" type="text" placeholder="MM (optional)" onChange={onPubDateLowerBoundMonthChanged}></input>
          <input ref={pubDateLowerBoundDayRef} className="text-black" type="text" placeholder="DD (optional)" onChange={onPubDateLowerBoundDayChanged}></input>
        </div>
        <label className="text-left text-red-500">{lowerBoundError}</label>
      </div>

      {/* Latest — hidden in exact mode (begin==end is mirrored automatically) */}
      {!exactDate && (
        <div ref={pubDateUpperBoundContainerRef} className="flex flex-col p-1" data-testid="source-latest-subsection">
          <label className="text-left">Latest possible</label>
          <div className="grid grid-cols-3 auto-rows-min gap-1">
            <input ref={pubDateUpperBoundYearRef} className="text-black" type="text" placeholder="YYYY" onChange={onPubDateUpperBoundYearChanged}></input>
            <input ref={pubDateUpperBoundMonthRef} className="text-black" type="text" placeholder="MM (optional)" onChange={onPubDateUpperBoundMonthChanged}></input>
            <input ref={pubDateUpperBoundDayRef} className="text-black" type="text" placeholder="DD (optional)" onChange={onPubDateUpperBoundDayChanged}></input>
          </div>
          <label className="text-left text-red-500">{upperBoundError}</label>
          <label className="text-left text-red-500">{rangeError}</label>
        </div>
      )}

    </div>
  )
}
