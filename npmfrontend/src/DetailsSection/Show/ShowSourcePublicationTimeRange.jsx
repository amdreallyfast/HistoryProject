import { convertTimeRangeToGregorianYearMonthDayString } from "../convertTimeRangeToString"

export function ShowSourcePublicationTimeRange({ source }) {
  let timeString = "NA"
  if (source?.publicationTime?.earliestYear) {
    try {
      timeString = convertTimeRangeToGregorianYearMonthDayString(
        source.publicationTime.earliestYear,
        source.publicationTime.earliestMonth,
        source.publicationTime.earliestDay,
        source.publicationTime.latestYear,
        source.publicationTime.latestMonth,
        source.publicationTime.latestDay
      )
    }
    catch {
      timeString = "NA"
    }
  }

  return (
    <div>
      <span className="text-gray-400">Published: </span>
      <span className="text-white">{timeString}</span>
    </div>
  )
}
