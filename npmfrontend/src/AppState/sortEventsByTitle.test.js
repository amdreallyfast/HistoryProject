import { describe, it, expect } from "vitest"
import { sortEventsByTitle } from "./sortEventsByTitle"

const ev = (title, eventId = title) => ({ eventId, title, revision: 1 })
const titles = (events) => events.map(e => e.title)

describe("sortEventsByTitle", () => {
  it("orders by title ascending", () => {
    const input = [ev("Siege of Tyre"), ev("Battle of Marathon"), ev("Fall of Rome")]
    expect(titles(sortEventsByTitle(input)))
      .toEqual(["Battle of Marathon", "Fall of Rome", "Siege of Tyre"])
  })

  it("does not mutate the input", () => {
    const input = [ev("Zeta"), ev("Alpha")]
    const before = [...input]

    sortEventsByTitle(input)

    expect(input).toEqual(before)
  })

  // The regression this exists for: after a submit, upsertEventRevisions rebuilds allEvents
  // as [...others, ...revisions], so the edited event lands at the END. Sorting must put it
  // back where its title belongs rather than leaving it stranded at the bottom.
  it("places a just-edited event by its title, not at the end", () => {
    const afterSubmit = [ev("Alpha"), ev("Charlie"), ev("Bravo")]  // Bravo was just edited

    expect(titles(sortEventsByTitle(afterSubmit))).toEqual(["Alpha", "Bravo", "Charlie"])
  })

  // Titles can change in an edit, so the new title is what decides the position.
  it("uses the current title, so a renamed event moves", () => {
    const renamed = [ev("Alpha"), ev("Charlie"), { eventId: "b", title: "Zulu", revision: 2 }]

    expect(titles(sortEventsByTitle(renamed))).toEqual(["Alpha", "Charlie", "Zulu"])
  })

  it("sorts case-insensitively rather than putting all capitals first", () => {
    const input = [ev("banana"), ev("Apple"), ev("cherry"), ev("Date")]
    expect(titles(sortEventsByTitle(input))).toEqual(["Apple", "banana", "cherry", "Date"])
  })

  it("orders embedded numbers naturally", () => {
    const input = [ev("Siege 10"), ev("Siege 2"), ev("Siege 1")]
    expect(titles(sortEventsByTitle(input))).toEqual(["Siege 1", "Siege 2", "Siege 10"])
  })

  // Without a tie-break, equal titles have no defined order and can swap between renders,
  // making the list jitter on unrelated state changes. Duplicate titles are plausible here.
  it("breaks ties deterministically on eventId", () => {
    const first = sortEventsByTitle([ev("Coronation", "b"), ev("Coronation", "a")])
    const second = sortEventsByTitle([ev("Coronation", "a"), ev("Coronation", "b")])

    expect(first.map(e => e.eventId)).toEqual(["a", "b"])
    expect(second.map(e => e.eventId)).toEqual(["a", "b"])
  })

  it("tolerates a missing title instead of throwing on the display path", () => {
    const input = [ev("Beta"), { eventId: "x", revision: 1 }, ev("Alpha")]

    const sorted = sortEventsByTitle(input)

    expect(sorted).toHaveLength(3)
    expect(titles(sorted).slice(1)).toEqual(["Alpha", "Beta"])
  })

  it("passes null and empty through unchanged", () => {
    expect(sortEventsByTitle(null)).toBeNull()
    expect(sortEventsByTitle(undefined)).toBeUndefined()
    expect(sortEventsByTitle([])).toEqual([])
  })
})
