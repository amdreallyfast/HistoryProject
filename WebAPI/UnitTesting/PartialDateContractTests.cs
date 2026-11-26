using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebAPI.Models;
using WebAPI.Validation;

namespace WebAPI.Tests
{
    // The backend half of the partial-date contract; the frontend half is
    // npmfrontend/src/dates/partialDate.contract.test.js. Both read the SAME fixture so the two
    // implementations of "compare dates with missing month/day" can't drift (claudePlans/10).
    [TestClass]
    public class PartialDateContractTests
    {
        private sealed record Bound(int? Year, int? Month, int? Day);

        private static JsonElement LoadContract()
        {
            // Walk up from the test binary to the repo root. Hard failure if the fixture moves: a
            // contract test that silently finds no cases would pass while guarding nothing.
            string? path = null;
            for (var probe = new DirectoryInfo(AppContext.BaseDirectory); probe is not null; probe = probe.Parent)
            {
                var candidate = Path.Combine(probe.FullName, "npmfrontend", "tests", "fixtures", "partialDateContract.json");
                if (File.Exists(candidate)) { path = candidate; break; }
            }
            Assert.IsNotNull(path, "Could not locate npmfrontend/tests/fixtures/partialDateContract.json. "
                + "If the fixture moved, update BOTH sides of this contract.");
            return JsonDocument.Parse(File.ReadAllText(path!)).RootElement.Clone();
        }

        private static int? Part(JsonElement v) => v.ValueKind == JsonValueKind.Null ? null : v.GetInt32();

        private static (Bound Earliest, Bound Latest) Range(JsonElement range)
        {
            var b = range.EnumerateArray().Select(x => x.EnumerateArray().Select(Part).ToArray()).ToArray();
            return (new Bound(b[0][0], b[0][1], b[0][2]), new Bound(b[1][0], b[1][1], b[1][2]));
        }

        [TestMethod]
        public void SourceBeforeEvent_MatchesContract()
        {
            var cases = LoadContract().GetProperty("sourceBeforeEvent").EnumerateArray().ToList();
            Assert.IsTrue(cases.Count > 0);
            foreach (var c in cases)
            {
                var name = c.GetProperty("name").GetString();
                var (eventEarliest, _) = Range(c.GetProperty("event"));
                var (_, sourceLatest) = Range(c.GetProperty("source"));
                // A missing year is "no verdict" on the frontend. The backend model can't hold a
                // missing year (non-nullable int, mapped to a sentinel), so those cases are the
                // frontend's alone.
                if (eventEarliest.Year is null || sourceLatest.Year is null) continue;

                var actual = PartialDate.IsSourceBeforeEvent(
                    eventEarliest.Year.Value, eventEarliest.Month, eventEarliest.Day,
                    sourceLatest.Year.Value, sourceLatest.Month, sourceLatest.Day);
                Assert.AreEqual(c.GetProperty("expect").GetBoolean(), actual, name);
            }
        }

        [TestMethod]
        public void RangeInverted_MatchesContract()
        {
            var cases = LoadContract().GetProperty("rangeInverted").EnumerateArray().ToList();
            Assert.IsTrue(cases.Count > 0);
            foreach (var c in cases)
            {
                var (lo, hi) = Range(c.GetProperty("range"));
                var actual = PartialDate.IsRangeInverted(lo.Year!.Value, lo.Month, lo.Day, hi.Year!.Value, hi.Month, hi.Day);
                Assert.AreEqual(c.GetProperty("expect").GetBoolean(), actual, c.GetProperty("name").GetString());
            }
        }

        // ---- Create, end to end through EventValidation ----

        private static Event EventWithSource(int lbYear, int? lbMonth, int? lbDay, EventSource source)
        {
            var e = TestSupport.ValidEvent(null);
            e.LBYear = lbYear; e.LBMonth = lbMonth; e.LBDay = lbDay;
            e.UBYear = lbYear + 1;
            source.Id = Guid.NewGuid();
            e.Sources = new List<EventSource> { source };
            return e;
        }

        private static async Task<ActionResult<WebAPI.ModelDTOs.CreatedRevision>> Post(Event e)
        {
            using var db = TestSupport.NewInMemoryContext();
            return await TestSupport.NewController(db).Create(e);
        }

        [TestMethod]
        public async Task Create_SourceBeforeEvent_Returns422NamingTheSource()
        {
            var e = EventWithSource(1066, 10, 14, new EventSource
            {
                Title = "Early Chronicle", PublicationLBYear = 1040, PublicationUBYear = 1050,
            });

            var result = await Post(e);

            Assert.IsInstanceOfType(result.Result, typeof(UnprocessableEntityObjectResult));
            var message = (string)((UnprocessableEntityObjectResult)result.Result!).Value!;
            StringAssert.Contains(message, "Early Chronicle");
            StringAssert.Contains(message, "before the event");
        }

        [TestMethod]
        public async Task Create_SourceOverlapsEvent_IsAccepted()
        {
            var e = EventWithSource(1066, null, null, new EventSource
            {
                Title = "Contemporary Annals", PublicationLBYear = 1060, PublicationUBYear = 1070,
            });
            Assert.IsInstanceOfType((await Post(e)).Result, typeof(OkObjectResult));
        }

        [TestMethod]
        public async Task Create_SourceSameDayAsEvent_IsAccepted()
        {
            var e = EventWithSource(1066, 10, 14, new EventSource
            {
                Title = "Same Day", PublicationLBYear = 1066, PublicationLBMonth = 10, PublicationLBDay = 14,
                PublicationUBYear = 1066, PublicationUBMonth = 10, PublicationUBDay = 14,
            });
            Assert.IsInstanceOfType((await Post(e)).Result, typeof(OkObjectResult));
        }

        [TestMethod]
        public async Task Create_SourceWithNoDates_IsAccepted()
        {
            // Defaults are the -99999/+99999 sentinels, so an undated source never trips this.
            var e = EventWithSource(1066, null, null, new EventSource { Title = "Undated" });
            Assert.IsInstanceOfType((await Post(e)).Result, typeof(OkObjectResult));
        }

        [TestMethod]
        public async Task Create_EventMonthsInvertedWithinAYear_Returns422()
        {
            // Used to pass: the order check compared years only.
            var e = TestSupport.ValidEvent(null);
            e.LBYear = 2026; e.LBMonth = 10;
            e.UBYear = 2026; e.UBMonth = 3;
            var result = await Post(e);
            Assert.IsInstanceOfType(result.Result, typeof(UnprocessableEntityObjectResult));
        }
    }
}
