import { useQuery } from "@tanstack/react-query"
import { useSelector, useDispatch } from "react-redux"
import { getAllRevisions } from "../../api/historyEventApi"
import { backendToFrontend } from "../../api/eventMapper"
import { selectEvent } from "../../AppState/selectEvent"

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
      {revisions.map(rev => (
        <button
          key={rev.revision}
          onClick={() => onRevisionClick(rev)}
          className={`text-left px-2 py-1 text-sm border-b border-gray-700 last:border-0
            ${rev.revision === currentRevision
              ? "bg-gray-600 text-white"
              : "text-gray-300 hover:bg-gray-700"}`}
        >
          Rev {rev.revision} — {rev.revisionAuthor}
        </button>
      ))}
    </div>
  )
}
