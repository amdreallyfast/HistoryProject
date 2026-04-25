import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editSourcesStateActions } from "../../AppState/stateSliceEditSources"
import { isDateRangeInverted } from "./detailRestrictions"

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

    let day = pubDateLowerBoundDayRef.current.value
    if (isNaN(Number(day))) {
      setLowerBoundError(`Day is not a number: '${day}'`)
      setRangeError(null)
      return false
    }

    pubDateLowerBoundContainerRef.current.style.border = "2px solid transparent"
    setLowerBoundError("")
    return true
  }

  const validateBoth = () => {
    const lowerValid = evaluateLowerBoundComplete()
    const upperValid = evaluateUpperBoundComplete()
    return lowerValid && upperValid
  }

  // On changed
  const onPubDateLowerBoundYearChanged = (e) => {
    console.log({ "EditSource.onPubDateLowerBoundYearChanged": e })

    validateBoth()
    let args = {
      editId: editId,
      value: e.target.value
    }
    reduxDispatch(editSourcesStateActions.updateSourcePubDateEarliestYear(args))
  }

  const onPubDateLowerBoundMonthChanged = (e) => {
    console.log({ "EditSource.onPubDateLowerBoundMonthChanged": e })

    validateBoth()
    let args = {
      editId: editId,
      value: e.target.value
    }
    reduxDispatch(editSourcesStateActions.updateSourcePubDateEarliestMonth(args))
  }

  const onPubDateLowerBoundDayChanged = (e) => {
    console.log({ "EditSource.onPubDateLowerBoundDayChanged": e })

    validateBoth()
    let args = {
      editId: editId,
      value: e.target.value
    }
    reduxDispatch(editSourcesStateActions.updateSourcePubDateEarliestDay(args))
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

    let day = pubDateUpperBoundDayRef.current.value
    if (isNaN(Number(day))) {
      setUpperBoundError(`Day is not a number: '${day}'`)
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

      {/* Earliest */}
      <div ref={pubDateLowerBoundContainerRef} className="flex flex-col p-1">
        <label className="text-left">Earliest possible</label>
        <div className="grid grid-cols-3 auto-rows-min gap-1">
          <input ref={pubDateLowerBoundYearRef} className="text-black" type="text" placeholder="YYYY" onChange={onPubDateLowerBoundYearChanged}></input>
          <input ref={pubDateLowerBoundMonthRef} className="text-black" type="text" placeholder="MM (optional)" onChange={onPubDateLowerBoundMonthChanged}></input>
          <input ref={pubDateLowerBoundDayRef} className="text-black" type="text" placeholder="DD (optional)" onChange={onPubDateLowerBoundDayChanged}></input>
        </div>
        <label className="text-left text-red-500">{lowerBoundError}</label>
      </div>

      {/* Latest */}
      <div ref={pubDateUpperBoundContainerRef} className="flex flex-col p-1">
        <label className="text-left">Latest possible</label>
        <div className="grid grid-cols-3 auto-rows-min gap-1">
          <input ref={pubDateUpperBoundYearRef} className="text-black" type="text" placeholder="YYYY" onChange={onPubDateUpperBoundYearChanged}></input>
          <input ref={pubDateUpperBoundMonthRef} className="text-black" type="text" placeholder="MM (optional)" onChange={onPubDateUpperBoundMonthChanged}></input>
          <input ref={pubDateUpperBoundDayRef} className="text-black" type="text" placeholder="DD (optional)" onChange={onPubDateUpperBoundDayChanged}></input>
        </div>
        <label className="text-left text-red-500">{upperBoundError}</label>
        <label className="text-left text-red-500">{rangeError}</label>
      </div>

    </div>
  )
}
