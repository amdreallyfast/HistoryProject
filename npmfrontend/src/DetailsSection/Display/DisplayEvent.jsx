import { useSelector } from "react-redux"
import { DisplayEventHeader } from "./DisplayEventHeader"
import { DisplayEventType } from "./DisplayEventType"
import { DisplayEventImage } from "./DisplayEventImage"
import { DisplayEventTime } from "./DisplayEventTime"
import { DisplayEventRegion } from "./DisplayEventRegion"
import { DisplayEventSummary } from "./DisplayEventSummary"
import { DisplayEventSources } from "./DisplayEventSources"

export function DisplayEvent({ }) {
  const eventState = useSelector((state) => state.eventReducer)

  return (
    <div className="flex flex-col h-full">
      <DisplayEventHeader />
      <DisplayEventType />
      <DisplayEventImage />
      <DisplayEventTime />
      <DisplayEventRegion />
      <DisplayEventSummary />
      <DisplayEventSources />

      {/* Revision author fixed by whoever is logged in */}
      <input className="m-2 text-black text-left" type="text" maxLength={128} placeholder="Revision author" />
    </div>
  )
}
