import { useSelector } from "react-redux"
import { convertTimeRangeToGregorianYearMonthDayString } from "../convertTimeRangeToString"

export function DisplayEventTime() {
  const selectedEventState = useSelector((state) => state.selectedEventReducer)

  let timeString = "NA"
  if (selectedEventState.eventTime?.earliestYear) {
    try {
      timeString = convertTimeRangeToGregorianYearMonthDayString(
        selectedEventState.eventTime.earliestYear,
        selectedEventState.eventTime.earliestMonth,
        selectedEventState.eventTime.earliestDay,
        selectedEventState.eventTime.latestYear,
        selectedEventState.eventTime.latestMonth,
        selectedEventState.eventTime.latestDay
      )
    }
    catch {
      timeString = "NA"
    }
  }

  return (
    <div className="m-1">
      <span className="text-gray-400">When: </span>
      <span className="text-white">{timeString}</span>
    </div>
  )
}
