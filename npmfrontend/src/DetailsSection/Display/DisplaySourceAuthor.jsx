export function DisplaySourceAuthor({ author }) {
  return (
    <span className="text-white">{author?.name || "NA"}</span>
  )
}
