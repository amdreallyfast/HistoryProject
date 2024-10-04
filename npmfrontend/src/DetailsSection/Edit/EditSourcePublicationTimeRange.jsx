import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

export function EditSourcePublicationTimeRange({
  startingDateLowerBoundYear,
  startingDateLowerBoundMonth,
  startingDateLowerBoundDay,
  startingDateUpperBoundYear,
  startingDateUpperBoundMonth,
  startingDateUpperBoundDay,
  stateChangeFunctionCallback
}) {
  // if (!stateChangeFunctionCallback) {
  //   throw new Error("must provide 'stateChangeFunctionCallback'")
  // }

  const reduxDispatch = useDispatch()

  const [lowerBoundYear, setLowerBoundYear] = useState(startingDateLowerBoundYear)

  const publicationLowerBoundDateLabelRef = useRef()
  const publicationUpperBoundDateLabelRef = useRef()



  const onPublicationLowerBoundYearChanged = (e) => {
    console.log({ "EditSourcePublicationTimeRange.onPublicationLowerBoundYearChanged": e })
  }

  const onPublicationLowerBoundMonthChanged = (e) => {
    console.log({ "EditSourcePublicationTimeRange.onPublicationLowerBoundMonthChanged": e })
  }

  const onPublicationLowerBoundDayChanged = (e) => {
    console.log({ "EditSourcePublicationTimeRange.onPublicationLowerBoundDayChanged": e })
  }

  const onPublicationUpperBoundYearChanged = (e) => {
    console.log({ "EditSourcePublicationTimeRange.onPublicationUpperBoundYearChanged": e })
  }

  const onPublicationUpperBoundMonthChanged = (e) => {
    console.log({ "EditSourcePublicationTimeRange.onPublicationUpperBoundMonthChanged": e })
  }

  const onPublicationUpperBoundDayChanged = (e) => {
    console.log({ "EditSourcePublicationTimeRange.onPublicationUpperBoundDayChanged": e })
  }

  const onSubmitSourceClick = (e) => {
    console.log({ "EditSourcePublicationTimeRange.onSubmitSourceClick": e })
    submitCallback({
      things: "and such"
    })
  }

  return (
    <div>


      <style>{`
        table {
          border - collapse: collapse;
          border: 2px solid grey;
          table-layout: fixed;
          width: 100%;
        }
        th, td {
          border: 2px solid grey;
          padding: 8px;
          text-align: center;
        }
      `
      }
      </style>

      <table>
        <thead>
          <tr>
            <th></th>
            <th>Year</th>
            <th>Month</th>
            <th>Day</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Lower bound</td>
            <td>
              <input className="m-1 text-black w-3/4" type="number" placeholder="Year" onChange={onPublicationLowerBoundYearChanged}></input>
            </td>
            <td>
              <input className="m-1 text-black w-3/4" type="number" placeholder="Month" onChange={onPublicationLowerBoundMonthChanged}></input>
            </td>
            <td>
              <input className="m-1 text-black w-3/4" type="number" placeholder="Day" onChange={onPublicationLowerBoundDayChanged}></input>
            </td>
          </tr>
          <tr>
            <td>Upper bound</td>
            <td>
              <input className="m-1 text-black w-3/4" type="number" placeholder="Year" onChange={onPublicationUpperBoundYearChanged}></input>
            </td>
            <td>
              <input className="m-1 text-black w-3/4" type="number" placeholder="Month" onChange={onPublicationUpperBoundMonthChanged}></input>
            </td>
            <td>
              <input className="m-1 text-black w-3/4" type="number" placeholder="Day" onChange={onPublicationUpperBoundDayChanged}></input>
            </td>
          </tr>
        </tbody>
      </table>

      {/* <div className="flex flex-col items-start">
        <label ref={publicationLowerBoundDateLabelRef}>Lower Bound (----/--/--)</label>
        <div className="flex flex-row items-start">
          <input className="m-1 text-black w-1/4" type="number" placeholder="Year" onChange={onPublicationLowerBoundYearChanged}></input>
          <input className="m-1 text-black w-1/4" type="number" placeholder="Month" onChange={onPublicationLowerBoundMonthChanged}></input>
          <input className="m-1 text-black w-1/4" type="number" placeholder="Day" onChange={onPublicationLowerBoundDayChanged}></input>
        </div>
      </div>

      <div className="flex flex-col items-start">
        <label ref={publicationLowerBoundDateLabelRef}>Upper Bound (----/--/--)</label>
        <div className="flex flex-row items-start">
          <input className="m-1 text-black w-1/4" type="number" placeholder="Year" onChange={onPublicationUpperBoundYearChanged}></input>
          <input className="m-1 text-black w-1/4" type="number" placeholder="Month" onChange={onPublicationUpperBoundMonthChanged}></input>
          <input className="m-1 text-black w-1/4" type="number" placeholder="Day" onChange={onPublicationUpperBoundDayChanged}></input>
        </div>
      </div> */}
    </div>
  )
}
