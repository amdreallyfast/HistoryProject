using System.Text.Json;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebAPI.Models;
using WebAPI.Validation;

namespace WebAPI.Tests
{
    // The backend half of the cross-tier winding contract. The frontend half is
    // npmfrontend/src/GlobeSection/Region/regionWindingContract.test.js, and both read the SAME
    // fixture file so neither can drift its own copy of the expectations.
    //
    // Why this matters: the sign of the signed area depends on the handedness of the lat/long to
    // XYZ mapping, which is duplicated in two languages. If the implementations disagree, every
    // verdict inverts — valid regions get rejected with a 422 and clockwise ones sail through.
    [TestClass]
    public class RegionWindingContractTests
    {
        private sealed record ContractCase(string Name, string Expect, double[][] Points);

        private static (double Epsilon, List<ContractCase> Cases) LoadContract()
        {
            // Walk up from the test binary to the repo root. Deliberately a hard failure with a
            // clear message if the fixture moves: a contract test that silently finds no cases
            // would pass while guarding nothing.
            var dir = AppContext.BaseDirectory;
            string? path = null;
            for (var probe = new DirectoryInfo(dir); probe is not null; probe = probe.Parent)
            {
                var candidate = Path.Combine(
                    probe.FullName, "npmfrontend", "tests", "fixtures", "regionWindingContract.json");
                if (File.Exists(candidate))
                {
                    path = candidate;
                    break;
                }
            }
            Assert.IsNotNull(path,
                "Could not locate npmfrontend/tests/fixtures/regionWindingContract.json by walking up from "
                + dir + ". If the fixture moved, update BOTH sides of this contract.");

            using var doc = JsonDocument.Parse(File.ReadAllText(path!));
            var root = doc.RootElement;

            var cases = new List<ContractCase>();
            foreach (var element in root.GetProperty("cases").EnumerateArray())
            {
                var points = element.GetProperty("points").EnumerateArray()
                    .Select(pair => pair.EnumerateArray().Select(v => v.GetDouble()).ToArray())
                    .ToArray();
                cases.Add(new ContractCase(
                    element.GetProperty("name").GetString()!,
                    element.GetProperty("expect").GetString()!,
                    points));
            }

            return (root.GetProperty("epsilon").GetDouble(), cases);
        }

        private static List<EventLocation> ToRegion(double[][] points)
            => points.Select((p, i) => new EventLocation
            {
                Id = Guid.NewGuid(),
                Latitude = p[0],
                Longitude = p[1],
                OrderIndex = i,
            }).ToList();

        private static string Classify(double area, double epsilon)
        {
            if (!double.IsFinite(area) || Math.Abs(area) <= epsilon) return "degenerate";
            return area > 0 ? "counterclockwise" : "clockwise";
        }

        [TestMethod]
        public void BackendAgreesWithTheSharedEpsilon()
        {
            var (epsilon, _) = LoadContract();
            Assert.AreEqual(epsilon, EventValidation.RegionWindingEpsilon,
                "the epsilon is duplicated across tiers and must match the shared fixture");
        }

        [TestMethod]
        public void BackendClassifiesEveryContractCaseAsSpecified()
        {
            var (epsilon, cases) = LoadContract();
            Assert.IsTrue(cases.Count > 0, "the contract fixture yielded no cases");

            var failures = new List<string>();
            foreach (var testCase in cases)
            {
                var area = EventValidation.RegionSignedArea(ToRegion(testCase.Points));
                var actual = Classify(area, epsilon);
                if (actual != testCase.Expect)
                {
                    failures.Add($"  '{testCase.Name}': expected {testCase.Expect}, got {actual} (area {area})");
                }
            }

            // Report every mismatch at once — if the handedness is inverted, all of them fail,
            // and seeing that pattern is the fastest route to the actual cause.
            Assert.AreEqual(0, failures.Count,
                "backend winding classification disagrees with the shared contract:\n"
                + string.Join("\n", failures));
        }

        [TestMethod]
        public void ContractCoversAllThreeClassifications()
        {
            var (_, cases) = LoadContract();
            var seen = cases.Select(c => c.Expect).Distinct().OrderBy(x => x).ToList();
            CollectionAssert.AreEqual(
                new[] { "clockwise", "counterclockwise", "degenerate" },
                seen,
                "the fixture must exercise every band, or a lost case would weaken both tiers silently");
        }
    }
}
