import { describe, it, expect } from "vitest"
import { classifyRegionWinding, REGION_WINDING_EPSILON } from "./regionMeshGeometry"
import { ConvertLatLongToXYZ } from "../convertLatLongXYZ"
import contract from "../../../tests/fixtures/regionWindingContract.json" with { type: "json" }

// The frontend half of the cross-tier winding contract. The backend half is
// WebAPI/UnitTesting/RegionWindingContractTests.cs, and both read the SAME fixture file so
// neither can drift its own copy of the expectations.
//
// Why this matters: the sign of the signed area depends on the handedness of the lat/long
// to XYZ mapping. If the two implementations disagree, every verdict inverts — valid
// regions get rejected with a 422 and clockwise ones sail through.

describe("region winding contract (frontend side)", () => {
  it("agrees with the shared epsilon", () => {
    expect(REGION_WINDING_EPSILON).toBe(contract.epsilon)
  })

  it.each(contract.cases.map(c => [c.name, c]))("classifies %s", (_name, testCase) => {
    const xyz = testCase.points.map(([lat, long]) => ConvertLatLongToXYZ(lat, long, 1))
    expect(classifyRegionWinding(xyz)).toBe(testCase.expect)
  })

  it("covers all three classifications, so the fixture can't silently lose a band", () => {
    const seen = new Set(contract.cases.map(c => c.expect))
    expect([...seen].sort()).toEqual(["clockwise", "counterclockwise", "degenerate"])
  })
})
