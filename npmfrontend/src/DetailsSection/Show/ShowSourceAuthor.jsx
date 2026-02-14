export function ShowSourceAuthor({ author }) {
  return (
    <span className="text-white">{author?.name || "NA"}</span>
  )
}
