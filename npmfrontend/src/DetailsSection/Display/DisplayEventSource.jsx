import { DisplaySourceAuthor } from "./DisplaySourceAuthor"
import { DisplaySourcePublicationTimeRange } from "./DisplaySourcePublicationTimeRange"

export function DisplayEventSource({ source }) {
  return (
    <div className="m-1">
      <div>
        <span className="text-gray-400">Title: </span>
        <span className="text-white">{source.title || "NA"}</span>
      </div>

      <div>
        <span className="text-gray-400">Authors: </span>
        {source.authors?.length > 0
          ? source.authors.map((author, index) => (
              <span key={index}>
                <DisplaySourceAuthor author={author} />
                {index < source.authors.length - 1 && ", "}
              </span>
            ))
          : <span className="text-white">NA</span>
        }
      </div>

      <DisplaySourcePublicationTimeRange source={source} />

      <div>
        <span className="text-gray-400">Where in source: </span>
        <span className="text-white">{source.whereInSource || "NA"}</span>
      </div>

      {source.isbn && (
        <div>
          <span className="text-gray-400">ISBN: </span>
          <span className="text-white">{source.isbn}</span>
        </div>
      )}
    </div>
  )
}
