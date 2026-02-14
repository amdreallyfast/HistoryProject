import { useSelector } from "react-redux"
import { ShowEventHeader } from "./ShowEventHeader"
import { ShowEventType } from "./ShowEventType"
import { ShowEventImage } from "./ShowEventImage"
import { ShowEventTime } from "./ShowEventTime"
import { ShowEventRegion } from "./ShowEventRegion"
import { ShowEventSummary } from "./ShowEventSummary"
import { ShowEventSources } from "./ShowEventSources"

export function ShowDetails({ }) {
  const eventState = useSelector((state) => state.eventReducer)

  return (
    <div className="flex flex-col h-full">
      <ShowEventHeader />
      <ShowEventType />
      <ShowEventImage />
      <ShowEventTime />
      <ShowEventRegion />
      <ShowEventSummary />
      <ShowEventSources />

      {/* Revision author fixed by whoever is logged in */}
      <input className="m-2 text-black text-left" type="text" maxLength={128} placeholder="Revision author" />
    </div>
  )
}
