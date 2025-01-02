import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editSourcesStateActions } from "../../AppState/stateSliceEditSources"

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

  // const setLowerBoundErrorStyle = () => {
  //   pubDateLowerBoundContainerRef.current.style.border = "2px solid red"
  // }

  // const clearLowerBoundErrorStyle = () => {
  //   pubDateLowerBoundContainerRef.current.style.border = "2px solid transparent"
  // }

  const evaluateLowerBoundComplete = () => {
    // assume bad
    pubDateLowerBoundContainerRef.current.style.border = "2px solid red"

    // Year is required. For everything else, just make sure that they are numbers.

    let year = pubDateLowerBoundYearRef.current.value
    if (isNaN(Number(year))) {
      setLowerBoundError(`Year is not a number: '${year}'`)
      return
    }
    else if (!year) {
      setLowerBoundError("Missing required value: 'Year'")
      return false
    }

    let month = pubDateLowerBoundMonthRef.current.value
    if (isNaN(Number(month))) {
      setLowerBoundError(`Month is not a number: '${month}'`)
      return
    }

    let day = pubDateLowerBoundDayRef.current.value
    if (isNaN(Number(day))) {
      setLowerBoundError(`Day is not a number: '${day}'`)
      return
    }

    // Ok
    pubDateLowerBoundContainerRef.current.style.border = "2px solid transparent"
    setLowerBoundError("")
  }

  // On changed
  const onPubDateLowerBoundYearChanged = (e) => {
    console.log({ "EditSource.onPubDateLowerBoundYearChanged": e })

    evaluateLowerBoundComplete()
    let args = {
      editId: editId,
      value: e.target.value
    }
    reduxDispatch(editSourcesStateActions.updateSourcePubDateLowerBoundYear(args))
  }

  const onPubDateLowerBoundMonthChanged = (e) => {
    console.log({ "EditSource.onPubDateLowerBoundMonthChanged": e })

    evaluateLowerBoundComplete()
    let args = {
      editId: editId,
      value: e.target.value
    }
    reduxDispatch(editSourcesStateActions.updateSourcePubDateLowerBoundMonth(args))
  }

  const onPubDateLowerBoundDayChanged = (e) => {
    console.log({ "EditSource.onPubDateLowerBoundDayChanged": e })

    evaluateLowerBoundComplete()
    let args = {
      editId: editId,
      value: e.target.value
    }
    reduxDispatch(editSourcesStateActions.updateSourcePubDateLowerBoundDay(args))
  }

  useEffect(() => {
    console.log({ "EditSource.useEffect[editSource.publicationTimeRange.lowerBoundYear]": editSource?.publicationTimeRange.lowerBoundYear })
    if (!editSource) return // deleted last frame from state machine
    if (!pubDateLowerBoundYearRef.current) return
    if (!pubDateLowerBoundMonthRef.current) return
    if (!pubDateLowerBoundDayRef.current) return

    // on load
    pubDateLowerBoundYearRef.current.value = editSource.publicationTimeRange.lowerBoundYear
    pubDateLowerBoundMonthRef.current.value = editSource.publicationTimeRange.lowerBoundMonth
    pubDateLowerBoundDayRef.current.value = editSource.publicationTimeRange.lowerBoundDay

    evaluateLowerBoundComplete()
  }, [
    pubDateLowerBoundYearRef.current,
    pubDateLowerBoundMonthRef.current,
    pubDateLowerBoundDayRef.current
  ])





  const pubDateUpperBoundYearRef = useRef()
  const pubDateUpperBoundMonthRef = useRef()
  const pubDateUpperBoundDayRef = useRef()
  const onPubDateUpperBoundYearChanged = (e) => {
    console.log({ "EditSource.onPubDateUpperBoundYearChanged": e })
  }

  const onPubDateUpperBoundMonthChanged = (e) => {
    console.log({ "EditSource.onPubDateUpperBoundMonthChanged": e })
  }

  const onPubDateUpperBoundDayChanged = (e) => {
    console.log({ "EditSource.onPubDateUpperBoundDayChanged": e })
  }



  return (
    <div className="flex flex-col m-1">
      <label className="text-left text-lg">Publication date</label>

      {/* Lower bound */}
      <div ref={pubDateLowerBoundContainerRef} className="flex flex-col p-1">
        <label className="text-left">Lower bound</label>
        <div className="grid grid-cols-3 auto-rows-min gap-1">
          <input ref={pubDateLowerBoundYearRef} className="text-black" type="text" placeholder="YYYY" onChange={onPubDateLowerBoundYearChanged}></input>
          <input ref={pubDateLowerBoundMonthRef} className="text-black" type="text" placeholder="MM (optional)" onChange={onPubDateLowerBoundMonthChanged}></input>
          <input ref={pubDateLowerBoundDayRef} className="text-black" type="text" placeholder="DD (optional)" onChange={onPubDateLowerBoundDayChanged}></input>
        </div>
        <label className="text-left text-red-500">{lowerBoundError}</label>
      </div>

    </div>
  )
}
