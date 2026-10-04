/**
 * Order events for display by title, ascending.
 *
 * WHY THIS EXISTS: nothing sorted the search results, so they rendered in whatever order
 * `allEvents` happened to hold. That order is not arbitrary in an unhelpful way — it is
 * actively confusing, because `upsertEventRevisions` rebuilds the array as
 * `[...others, ...revisions]` after a submit, which moves the event you just edited to the
 * BOTTOM of the list. Editing an event made it appear to jump away.
 *
 * Sorting by title fixes that by giving the list an order that does not depend on edit
 * history. Selection highlighting is keyed on `eventId` (not list position), so an event
 * stays highlighted as it moves to its sorted place.
 *
 * Returns a NEW array; the input is not mutated.
 */
export function sortEventsByTitle(events) {
  if (!events) {
    return events
  }

  return [...events].sort(compareByTitle)
}

function compareByTitle(a, b) {
  // A title should always be present (the backend rejects an empty one), but a
  // locally-built optimistic event could be mid-construction — so don't throw on the
  // display path over something this cosmetic.
  const titleA = a?.title ?? ""
  const titleB = b?.title ?? ""

  // `sensitivity: "base"` so "Athens" and "athens" sort together instead of all capitals
  // first; `numeric: true` so "Siege 2" precedes "Siege 10" rather than following it.
  const byTitle = titleA.localeCompare(titleB, undefined, { sensitivity: "base", numeric: true })
  if (byTitle !== 0) {
    return byTitle
  }

  // Tie-break on eventId. Without it, two events sharing a title have no defined order and
  // could swap places between renders — the list would visibly jitter on unrelated state
  // changes. Duplicate titles are plausible here ("Coronation", "Treaty of Paris").
  return String(a?.eventId ?? "").localeCompare(String(b?.eventId ?? ""))
}
