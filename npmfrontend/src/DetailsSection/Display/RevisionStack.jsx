import { useQuery } from "@tanstack/react-query"
import { useSelector, useDispatch } from "react-redux"
import { getAllRevisions } from "../../api/historyEventApi"
import { backendToFrontend } from "../../api/eventMapper"
import { selectEvent } from "../../AppState/selectEvent"
import { formatRevisionDate } from "./formatRevisionDate"

export function RevisionStack({ eventId }) {
  const dispatch = useDispatch()
  const currentRevision = useSelector(state => state.selectedEventReducer.revision)

  const { data: revisions, isLoading, isError } = useQuery({
    queryKey: ["revisions", eventId],
    queryFn: () => getAllRevisions(eventId).then(rs => rs.map(backendToFrontend)),
    enabled: !!eventId,
  })

  const onRevisionClick = (rev) => {
    selectEvent(dispatch, rev)
  }

  if (isLoading) return <div className="text-gray-400 text-sm m-2">Loading revisions...</div>
  if (isError || !revisions?.length) return null

  return (
    <div className="flex flex-col mx-2 my-1 border border-gray-600 rounded">
      <span className="text-xs text-gray-400 px-2 pt-1">Revision history</span>
      {/* Cap the height and scroll: revisions only ever grow (append-only edits), so a
          long-lived event's history would otherwise push the panel arbitrarily tall. */}
      <div className="max-h-48 overflow-y-auto">
        {revisions.map(rev => (
          <button
            key={rev.revision}
            data-testid="revision-row"
            onClick={() => onRevisionClick(rev)}
            className={`w-full grid grid-cols-[1fr_auto] gap-2 items-baseline px-2 py-1 text-sm border-b border-gray-700 last:border-0
              ${rev.revision === currentRevision
                ? "bg-gray-600 text-white"
                : "text-gray-300 hover:bg-gray-700"}`}
          >
            <span className="text-left">Rev {rev.revision} — {rev.revisionAuthor}</span>
            <span data-testid="revision-date" className="text-right text-gray-400">{formatRevisionDate(rev.revisionDateTime)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
