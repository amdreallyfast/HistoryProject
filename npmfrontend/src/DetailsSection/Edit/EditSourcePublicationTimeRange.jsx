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

  // const onPubDateLowerBoundMonthInput = (e) => {
  //   console.log({ "EditSource.onPubDateLowerBoundMonthInput": e })

  //   evaluateLowerBoundComplete()

  //   // let value = e.target.value
  //   // let maxLength = 3
  //   // if (value?.length > maxLength) {
  //   //   // cut off the new character, and don't update the value
  //   //   value = value.slice(0, maxLength)
  //   //   pubDateLowerBoundMonthRef.current.valueAsNumber = value
  //   // }
  //   // else {
  //   //   let args = {
  //   //     editId: editId,
  //   //     value: e.target.value
  //   //   }
  //   //   reduxDispatch(editSourcesStateActions.updateSourcePubDateLowerBoundYear(args))
  //   // }

  // }
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
    if (!pubDateLowerBoundYearRef.current) return
    if (!pubDateLowerBoundMonthRef.current) return
    if (!pubDateLowerBoundDayRef.current) return
    if (!editSource) return // deleted last frame from state machine

    // on load
    let year = editSource.publicationTimeRange.lowerBoundYear
    // pubDateLowerBoundYearRef.current.valueAsNumber = year ? year : NaN
    pubDateLowerBoundYearRef.current.value = year

    let month = editSource.publicationTimeRange.lowerBoundMonth
    // pubDateLowerBoundMonthRef.current.valueAsNumber = month ? month : NaN
    pubDateLowerBoundMonthRef.current.value = month

    let day = editSource.publicationTimeRange.lowerBoundDay
    // pubDateLowerBoundDayRef.current.valueAsNumber = day ? day : NaN
    pubDateLowerBoundDayRef.current.value = day

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




  // const [lowerBoundYear, setLowerBoundYear] = useState(startingDateLowerBoundYear)

  // const publicationLowerBoundDateLabelRef = useRef()
  // const publicationUpperBoundDateLabelRef = useRef()



  // const onPublicationLowerBoundYearChanged = (e) => {
  //   console.log({ "EditSourcePublicationTimeRange.onPublicationLowerBoundYearChanged": e })
  // }

  // const onPublicationLowerBoundMonthChanged = (e) => {
  //   console.log({ "EditSourcePublicationTimeRange.onPublicationLowerBoundMonthChanged": e })
  // }

  // const onPublicationLowerBoundDayChanged = (e) => {
  //   console.log({ "EditSourcePublicationTimeRange.onPublicationLowerBoundDayChanged": e })
  // }

  // const onPublicationUpperBoundYearChanged = (e) => {
  //   console.log({ "EditSourcePublicationTimeRange.onPublicationUpperBoundYearChanged": e })
  // }

  // const onPublicationUpperBoundMonthChanged = (e) => {
  //   console.log({ "EditSourcePublicationTimeRange.onPublicationUpperBoundMonthChanged": e })
  // }

  // const onPublicationUpperBoundDayChanged = (e) => {
  //   console.log({ "EditSourcePublicationTimeRange.onPublicationUpperBoundDayChanged": e })
  // }

  // const onSubmitSourceClick = (e) => {
  //   console.log({ "EditSourcePublicationTimeRange.onSubmitSourceClick": e })
  //   submitCallback({
  //     things: "and such"
  //   })
  // }

  // return (
  //   <div>


  //     <style>{`
  //       table {
  //         border - collapse: collapse;
  //         border: 2px solid grey;
  //         table-layout: fixed;
  //         width: 100%;
  //       }
  //       th, td {
  //         border: 2px solid grey;
  //         padding: 8px;
  //         text-align: center;
  //       }
  //     `
  //     }
  //     </style>

  //     <table>
  //       <thead>
  //         <tr>
  //           <th></th>
  //           <th>Year</th>
  //           <th>Month</th>
  //           <th>Day</th>
  //         </tr>
  //       </thead>
  //       <tbody>
  //         <tr>
  //           <td>Lower bound</td>
  //           <td>
  //             <input className="m-1 text-black w-3/4" type="number" placeholder="Year" onChange={onPublicationLowerBoundYearChanged}></input>
  //           </td>
  //           <td>
  //             <input className="m-1 text-black w-3/4" type="number" placeholder="Month" onChange={onPublicationLowerBoundMonthChanged}></input>
  //           </td>
  //           <td>
  //             <input className="m-1 text-black w-3/4" type="number" placeholder="Day" onChange={onPublicationLowerBoundDayChanged}></input>
  //           </td>
  //         </tr>
  //         <tr>
  //           <td>Upper bound</td>
  //           <td>
  //             <input className="m-1 text-black w-3/4" type="number" placeholder="Year" onChange={onPublicationUpperBoundYearChanged}></input>
  //           </td>
  //           <td>
  //             <input className="m-1 text-black w-3/4" type="number" placeholder="Month" onChange={onPublicationUpperBoundMonthChanged}></input>
  //           </td>
  //           <td>
  //             <input className="m-1 text-black w-3/4" type="number" placeholder="Day" onChange={onPublicationUpperBoundDayChanged}></input>
  //           </td>
  //         </tr>
  //       </tbody>
  //     </table>

  //     {/* <div className="flex flex-col items-start">
  //       <label ref={publicationLowerBoundDateLabelRef}>Lower Bound (----/--/--)</label>
  //       <div className="flex flex-row items-start">
  //         <input className="m-1 text-black w-1/4" type="number" placeholder="Year" onChange={onPublicationLowerBoundYearChanged}></input>
  //         <input className="m-1 text-black w-1/4" type="number" placeholder="Month" onChange={onPublicationLowerBoundMonthChanged}></input>
  //         <input className="m-1 text-black w-1/4" type="number" placeholder="Day" onChange={onPublicationLowerBoundDayChanged}></input>
  //       </div>
  //     </div>

  //     <div className="flex flex-col items-start">
  //       <label ref={publicationLowerBoundDateLabelRef}>Upper Bound (----/--/--)</label>
  //       <div className="flex flex-row items-start">
  //         <input className="m-1 text-black w-1/4" type="number" placeholder="Year" onChange={onPublicationUpperBoundYearChanged}></input>
  //         <input className="m-1 text-black w-1/4" type="number" placeholder="Month" onChange={onPublicationUpperBoundMonthChanged}></input>
  //         <input className="m-1 text-black w-1/4" type="number" placeholder="Day" onChange={onPublicationUpperBoundDayChanged}></input>
  //       </div>
  //     </div> */}
  //   </div>
  // )
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

      {/* <form ref={formRef}>
      <table>
        <tbody>
          <tr>
            <td><label ref={pubDateLowerBoundLabelRef}>Lower bound</label></td>
            <td><input ref={pubDateLowerBoundYearRef} className="m-1 text-black w-full" type="text" maxLength={4} placeholder="YYYY" required onChange={onPubDateLowerBoundYearChanged}></input></td>
            <td><input ref={pubDateLowerBoundMonthRef} className="m-1 text-black w-full" type="text" maxLength={2} placeholder="MM" onChange={onPubDateLowerBoundMonthChanged}></input></td>
            <td><input ref={pubDateLowerBoundDayRef} className="m-1 text-black w-full" type="text" maxLength={2} placeholder="DD" onChange={onPubDateLowerBoundDayChanged}></input></td>
          </tr>
          <tr>
            <td><label>Upper bound</label></td>
            <td><input ref={pubDateUpperBoundYearRef} className="m-1 text-black w-full" type="text" maxLength={4} placeholder="YYYY" required onChange={onPubDateUpperBoundYearChanged}></input></td>
            <td><input ref={pubDateUpperBoundMonthRef} className="m-1 text-black w-full" type="text" maxLength={2} placeholder="MM" onChange={onPubDateUpperBoundMonthChanged}></input></td>
            <td><input ref={pubDateUpperBoundDayRef} className="m-1 text-black w-full" type="text" maxLength={2} placeholder="DD" onChange={onPubDateUpperBoundDayChanged}></input></td>
          </tr>
        </tbody>
      </table>
    </form> */}
    </div>
  )
}
