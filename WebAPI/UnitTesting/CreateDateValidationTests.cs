using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebAPI.Models;

namespace WebAPI.Tests
{
    // Per-field calendar ranges on the event time bounds and source publication ranges. The
    // frontend already checks these, but the client is untrusted and an out-of-range value
    // reaches the display formatters as nonsense rather than being caught.
    //
    // Scope boundary: per-month validity (Feb 30, Nov 31) is NOT checked here. That depends on
    // the calendar system, which the JulianCalendar TODO owns and both tiers are meant to share.
    [TestClass]
    public class CreateDateValidationTests
    {
        private static async Task<ActionResult<Event>> Post(Event e)
        {
            using var db = TestSupport.NewInMemoryContext();
            return await TestSupport.NewController(db).Create(e);
        }

        private static async Task Assert422(Event e, string becauseContains)
        {
            var result = await Post(e);
            Assert.IsInstanceOfType(result.Result, typeof(UnprocessableEntityObjectResult));
            StringAssert.Contains(
                ((UnprocessableEntityObjectResult)result.Result!).Value as string ?? "", becauseContains);
        }

        private static async Task AssertOk(Event e)
        {
            var result = await Post(e);
            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        }

        [TestMethod]
        public async Task Create_MonthOutOfRange_Returns422()
        {
            var e = TestSupport.ValidEvent(null); e.LBMonth = 13;
            await Assert422(e, "Earliest month");

            var e2 = TestSupport.ValidEvent(null); e2.UBMonth = 0;
            await Assert422(e2, "Latest month");
        }

        [TestMethod]
        public async Task Create_DayOutOfRange_Returns422()
        {
            var e = TestSupport.ValidEvent(null); e.LBDay = 32;
            await Assert422(e, "Earliest day");

            var e2 = TestSupport.ValidEvent(null); e2.UBDay = -1;
            await Assert422(e2, "Latest day");
        }

        [TestMethod]
        public async Task Create_HourOrMinuteOutOfRange_Returns422()
        {
            var e = TestSupport.ValidEvent(null); e.LBHour = 24;
            await Assert422(e, "Earliest hour");

            var e2 = TestSupport.ValidEvent(null); e2.UBMin = 60;
            await Assert422(e2, "Latest minute");
        }

        [TestMethod]
        public async Task Create_InvertedYearRange_Returns422()
        {
            var e = TestSupport.ValidEvent(null);
            e.LBYear = 1500;
            e.UBYear = 1400;
            await Assert422(e, "cannot be after");
        }

        // The editor records an exact date by setting both bounds to the same value (the
        // "Exact date" toggle), so equal years must not be mistaken for an inverted range.
        [TestMethod]
        public async Task Create_ExactDateWithEqualBounds_ReturnsOk()
        {
            var e = TestSupport.ValidEvent(null);
            e.LBYear = 1492; e.LBMonth = 10; e.LBDay = 12;
            e.UBYear = 1492; e.UBMonth = 10; e.UBDay = 12;
            await AssertOk(e);
        }

        // A partial date is a first-class case: an event known only to a year must submit.
        [TestMethod]
        public async Task Create_PartialDateWithNullFields_ReturnsOk()
        {
            var e = TestSupport.ValidEvent(null);
            e.LBYear = 603; e.LBMonth = null; e.LBDay = null;
            e.UBYear = 603; e.UBMonth = null; e.UBDay = null;
            await AssertOk(e);
        }

        // The sentinel defaults (-99999 / +99999) mean "unbounded" and must pass.
        [TestMethod]
        public async Task Create_SentinelYearDefaults_ReturnsOk()
        {
            await AssertOk(TestSupport.ValidEvent(null));
        }

        [TestMethod]
        public async Task Create_BoundaryValuesAreInclusive_ReturnsOk()
        {
            var e = TestSupport.ValidEvent(null);
            e.LBMonth = 1; e.LBDay = 1; e.LBHour = 0; e.LBMin = 0;
            e.UBMonth = 12; e.UBDay = 31; e.UBHour = 23; e.UBMin = 59;
            await AssertOk(e);
        }

        [TestMethod]
        public async Task Create_SourcePublicationMonthOutOfRange_Returns422()
        {
            var e = TestSupport.ValidEvent(null);
            e.Sources = new List<EventSource>
            {
                new() { Id = Guid.NewGuid(), Title = "Annals", PublicationLBMonth = 13 },
            };

            await Assert422(e, "Earliest publication month");
        }

        // The message must name which source, since an event can carry many.
        [TestMethod]
        public async Task Create_SourceDateError_NamesTheSource()
        {
            var e = TestSupport.ValidEvent(null);
            e.Sources = new List<EventSource>
            {
                new() { Id = Guid.NewGuid(), Title = "Fine Source" },
                new() { Id = Guid.NewGuid(), Title = "Broken Source", PublicationUBDay = 99 },
            };

            await Assert422(e, "Broken Source");
        }

        [TestMethod]
        public async Task Create_SourceInvertedPublicationYears_Returns422()
        {
            var e = TestSupport.ValidEvent(null);
            e.Sources = new List<EventSource>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Title = "Backwards",
                    PublicationLBYear = 1200,
                    PublicationUBYear = 1100,
                },
            };

            await Assert422(e, "cannot be after");
        }

        // Per-month validity is explicitly out of scope — pinned so that if the JulianCalendar
        // work later closes it, this test fails and is updated deliberately rather than by
        // accident.
        [TestMethod]
        public async Task Create_February30_IsAcceptedForNowByDesign()
        {
            var e = TestSupport.ValidEvent(null);
            e.LBYear = 1500; e.LBMonth = 2; e.LBDay = 30;
            e.UBYear = 1500; e.UBMonth = 2; e.UBDay = 30;

            await AssertOk(e);
        }
    }
}
