import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { describe, it, expect } from "vitest"
import { isRangeInverted, isSourceBeforeEvent } from "./partialDate"
import { isDateRangeInverted } from "../DetailsSection/Edit/detailRestrictions"

// The frontend half of the partial-date contract; the backend half is
// WebAPI/UnitTesting/PartialDateContractTests.cs. Both read the same fixture.
const fixturePath = join(dirname(fileURLToPath(import.meta.url)), "../../tests/fixtures/partialDateContract.json")
const contract = JSON.parse(readFileSync(fixturePath, "utf8"))

const toRange = ([[ey, em, ed], [ly, lm, ld]]) => ({
  earliestYear: ey, earliestMonth: em, earliestDay: ed,
  latestYear: ly, latestMonth: lm, latestDay: ld,
})

describe("partial-date contract: source before event", () => {
  it("has cases", () => expect(contract.sourceBeforeEvent.length).toBeGreaterThan(0))
  for (const c of contract.sourceBeforeEvent) {
    it(c.name, () => {
      expect(isSourceBeforeEvent(toRange(c.event), toRange(c.source))).toBe(c.expect)
    })
  }
})

describe("partial-date contract: range inverted", () => {
  it("has cases", () => expect(contract.rangeInverted.length).toBeGreaterThan(0))
  for (const c of contract.rangeInverted) {
    it(c.name, () => {
      const r = toRange(c.range)
      expect(isRangeInverted(r)).toBe(c.expect)
      // The editors' helper must agree (it delegates to partialDate).
      expect(isDateRangeInverted(r.earliestYear, r.earliestMonth, r.earliestDay,
        r.latestYear, r.latestMonth, r.latestDay)).toBe(c.expect)
    })
  }
})

describe("partialDate input handling", () => {
  it("accepts the string values the editors hold", () => {
    expect(isSourceBeforeEvent(
      { earliestYear: "1066", earliestMonth: "", earliestDay: "" },
      { latestYear: " 1050 ", latestMonth: "", latestDay: null },
    )).toBe(true)
  })

  it("gives no verdict for malformed parts", () => {
    expect(isSourceBeforeEvent(
      { earliestYear: "10x6" },
      { latestYear: "1050" },
    )).toBe(false)
    expect(isRangeInverted({ earliestYear: "1070", latestYear: "1060", latestMonth: "1.5" })).toBe(false)
  })
})
