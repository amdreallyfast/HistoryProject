using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebAPI.Models;
using WebAPI.Validation;

namespace WebAPI.Tests
{
    // Server-side re-validation of the rest of the Create payload — coordinates and list sizes.
    // The frontend checks some of this and not the rest, but either way the client is untrusted:
    // a user can strip every guardrail in devtools and POST whatever they like, so each rule is
    // enforced here before anything is persisted.
    //
    // Companion to CreateImageValidationTests, which covers the image bytes.
    [TestClass]
    public class CreatePayloadValidationTests
    {
        private static EventLocation Loc(double lat, double lon, int order = 0)
            => new() { Id = Guid.NewGuid(), Latitude = lat, Longitude = lon, OrderIndex = order };

        // A counterclockwise triangle, so these tests exercise the check they name rather than
        // tripping the winding gate added in the next step.
        private static List<EventLocation> SmallValidRegion()
            => new() { Loc(10, 10, 0), Loc(10, 12, 1), Loc(12, 11, 2) };

        private static async Task<ActionResult<Event>> Post(Event e)
        {
            using var db = TestSupport.NewInMemoryContext();
            return await TestSupport.NewController(db).Create(e);
        }

        private static async Task Assert422(Event e, string becauseContains)
        {
            var result = await Post(e);
            Assert.IsInstanceOfType(result.Result, typeof(UnprocessableEntityObjectResult),
                "expected a 422 rejection");
            var body = ((UnprocessableEntityObjectResult)result.Result!).Value as string;
            StringAssert.Contains(body ?? "", becauseContains,
                "the 422 body is shown to the user, so it must name the actual problem");
        }

        // ---- coordinate ranges ------------------------------------------------------------

        [TestMethod]
        public async Task Create_LatitudeAboveRange_Returns422()
        {
            var e = TestSupport.ValidEvent(null);
            e.SpecificLocation = Loc(91, 0);
            await Assert422(e, "latitude");
        }

        [TestMethod]
        public async Task Create_LatitudeBelowRange_Returns422()
        {
            var e = TestSupport.ValidEvent(null);
            e.SpecificLocation = Loc(-90.0001, 0);
            await Assert422(e, "latitude");
        }

        [TestMethod]
        public async Task Create_LongitudeOutOfRange_Returns422()
        {
            var e = TestSupport.ValidEvent(null);
            e.SpecificLocation = Loc(0, 180.5);
            await Assert422(e, "longitude");
        }

        [TestMethod]
        public async Task Create_RegionPointOutOfRange_Returns422()
        {
            var e = TestSupport.ValidEvent(null);
            e.Region = SmallValidRegion();
            e.Region[1] = Loc(500, 10, 1);
            await Assert422(e, "latitude");
        }

        // The message must identify WHICH point. "A coordinate is out of range" is useless when
        // a region can hold 128 of them.
        [TestMethod]
        public async Task Create_OutOfRangeRegionPoint_NamesTheOffendingPoint()
        {
            var e = TestSupport.ValidEvent(null);
            e.Region = SmallValidRegion();
            e.Region[2] = Loc(0, 999, 2);
            await Assert422(e, "point 3");
        }

        // Worse than out-of-range: a non-finite coordinate reaches the frontend's geometry
        // buffers, makes the bounding sphere NaN, and the region then silently fails every
        // frustum test and vanishes with nothing logged.
        [TestMethod]
        public async Task Create_NonFiniteCoordinate_Returns422()
        {
            foreach (var bad in new[] { double.NaN, double.PositiveInfinity, double.NegativeInfinity })
            {
                var e = TestSupport.ValidEvent(null);
                e.SpecificLocation = Loc(bad, 0);
                await Assert422(e, "non-finite");
            }
        }

        [TestMethod]
        public async Task Create_CoordinatesAtExactBounds_ReturnsOk()
        {
            // The bounds are inclusive: the poles and the antimeridian are real places.
            var e = TestSupport.ValidEvent(null);
            e.SpecificLocation = Loc(90, 180);

            var result = await Post(e);

            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        }

        // ---- list caps --------------------------------------------------------------------

        [TestMethod]
        public async Task Create_RegionOverCap_Returns422()
        {
            var e = TestSupport.ValidEvent(null);
            e.Region = new List<EventLocation>();
            for (int i = 0; i < EventValidation.MaxRegionPoints + 1; i++)
            {
                e.Region.Add(Loc(10 + (i * 0.001), 10, i));
            }

            await Assert422(e, "boundary points");
        }

        [TestMethod]
        public async Task Create_TagsOverCap_Returns422()
        {
            var e = TestSupport.ValidEvent(null);
            e.Tags = new List<Tag>();
            for (int i = 0; i < EventValidation.MaxTags + 1; i++)
            {
                e.Tags.Add(new Tag { Id = Guid.NewGuid(), Value = "t" + i });
            }

            await Assert422(e, "tags");
        }

        [TestMethod]
        public async Task Create_SourcesOverCap_Returns422()
        {
            var e = TestSupport.ValidEvent(null);
            e.Sources = new List<EventSource>();
            for (int i = 0; i < EventValidation.MaxSources + 1; i++)
            {
                e.Sources.Add(new EventSource { Id = Guid.NewGuid(), Title = "s" + i });
            }

            await Assert422(e, "sources");
        }

        [TestMethod]
        public async Task Create_AuthorsPerSourceOverCap_Returns422()
        {
            var e = TestSupport.ValidEvent(null);
            var source = new EventSource
            {
                Id = Guid.NewGuid(),
                Title = "crowded",
                Authors = new List<EventSourceAuthor>(),
            };
            for (int i = 0; i < EventValidation.MaxAuthorsPerSource + 1; i++)
            {
                source.Authors.Add(new EventSourceAuthor { Id = Guid.NewGuid(), Name = "a" + i });
            }
            e.Sources = new List<EventSource> { source };

            await Assert422(e, "authors");
        }

        // The cap is a ceiling, not a target: a region exactly at it must still go through.
        [TestMethod]
        public async Task Create_RegionExactlyAtCap_ReturnsOk()
        {
            var e = TestSupport.ValidEvent(null);
            e.Region = new List<EventLocation>();
            // A counterclockwise ring, so this exercises the cap and not the winding check.
            for (int i = 0; i < EventValidation.MaxRegionPoints; i++)
            {
                double angle = (i / (double)EventValidation.MaxRegionPoints) * 2 * Math.PI;
                e.Region.Add(Loc(10 + (5 * Math.Sin(angle)), 10 + (5 * Math.Cos(angle)), i));
            }

            var result = await Post(e);

            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        }
    }
}
