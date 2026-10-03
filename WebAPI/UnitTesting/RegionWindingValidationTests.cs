using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebAPI.Models;
using WebAPI.Validation;

namespace WebAPI.Tests
{
    // Server-side rejection of a badly-wound region boundary.
    //
    // EarClipping on the frontend requires a counterclockwise ring and throws otherwise, so a
    // clockwise ring that reaches the database is a region no viewer can draw. The frontend
    // normalizes on submit; the backend rejects, deliberately — a bad winding arriving at the API
    // means the frontend was bypassed or has regressed, and quietly repairing it would hide that.
    [TestClass]
    public class RegionWindingValidationTests
    {
        // The same fixture used as the winding oracle in npmfrontend/tests/region-winding.spec.ts
        // and src/GlobeSection/Region/regionSignedArea.test.js. EarClipping triangulates this
        // orientation, which is what makes it the definition of "valid" rather than a guess.
        private static readonly (double lat, double lon)[] CounterClockwise =
        {
            (42.0, 12.0), (42.0, 13.0), (43.0, 13.0), (43.0, 12.0),
        };

        private static List<EventLocation> Ring((double lat, double lon)[] points, bool reversed = false)
        {
            var source = reversed ? points.Reverse().ToArray() : points;
            return source
                .Select((p, i) => new EventLocation
                {
                    Id = Guid.NewGuid(),
                    Latitude = p.lat,
                    Longitude = p.lon,
                    OrderIndex = i,
                })
                .ToList();
        }

        private static Event EventWithRegion(List<EventLocation> region)
        {
            var e = TestSupport.ValidEvent(null);
            e.Region = region;
            return e;
        }

        private static async Task<ActionResult<Event>> Post(Event e)
        {
            using var db = TestSupport.NewInMemoryContext();
            return await TestSupport.NewController(db).Create(e);
        }

        // THE anchor test, and the one that would catch a mismatched axis convention between the
        // two tiers. The sign of the signed area depends on the handedness of the lat/long to XYZ
        // mapping; if C# and JS disagree, every verdict inverts and a valid region is rejected
        // while a clockwise one sails through.
        [TestMethod]
        public void SignedArea_IsPositiveForTheOrientationEarClippingAccepts()
        {
            Assert.IsTrue(EventValidation.RegionSignedArea(Ring(CounterClockwise)) > 0,
                "counterclockwise must be positive — must match regionSignedArea in regionMeshGeometry.js");
            Assert.IsTrue(EventValidation.RegionSignedArea(Ring(CounterClockwise, reversed: true)) < 0,
                "reversing the ring must flip the sign");
        }

        [TestMethod]
        public void SignedArea_ConvergesToTheAnalyticAreaOfASphericalCap()
        {
            // A cap above latitude 60N has area 2π(1 − sin 60°) steradians. The ring is an
            // inscribed polygon so it encloses slightly less, but it must land in the right place.
            var ring = new List<EventLocation>();
            int i = 0;
            for (double lon = -180; lon < 180; lon += 1)
            {
                ring.Add(new EventLocation { Id = Guid.NewGuid(), Latitude = 60, Longitude = lon, OrderIndex = i++ });
            }

            double analytic = 2 * Math.PI * (1 - Math.Sin(60.0 / 180.0 * Math.PI));
            double measured = Math.Abs(EventValidation.RegionSignedArea(ring));

            Assert.AreEqual(analytic, measured, 1e-3,
                $"expected ~{analytic}, measured {measured}");
        }

        // The subtle one. EF returns related rows unordered and the frontend sorts by OrderIndex
        // on read, so OrderIndex — not list position — is the stored ring order. Validating the
        // unsorted list would check the winding of a ring nobody will ever reconstruct.
        [TestMethod]
        public void SignedArea_UsesOrderIndexNotListPosition()
        {
            var ordered = Ring(CounterClockwise);
            var shuffled = new List<EventLocation> { ordered[2], ordered[0], ordered[3], ordered[1] };

            Assert.AreEqual(
                EventValidation.RegionSignedArea(ordered),
                EventValidation.RegionSignedArea(shuffled),
                1e-12,
                "shuffling the list without changing OrderIndex must not change the result");
        }

        [TestMethod]
        public async Task Create_CounterClockwiseRegion_ReturnsOk()
        {
            var result = await Post(EventWithRegion(Ring(CounterClockwise)));
            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        }

        [TestMethod]
        public async Task Create_ClockwiseRegion_Returns422()
        {
            var result = await Post(EventWithRegion(Ring(CounterClockwise, reversed: true)));

            Assert.IsInstanceOfType(result.Result, typeof(UnprocessableEntityObjectResult));
            var body = ((UnprocessableEntityObjectResult)result.Result!).Value as string;
            StringAssert.Contains(body ?? "", "clockwise");
        }

        // A collinear ring has no orientation at all. Reporting it as "wound clockwise" would be
        // actively misleading, so it gets its own message.
        [TestMethod]
        public async Task Create_CollinearRegion_Returns422AsDegenerateNotClockwise()
        {
            var collinear = Ring(new[] { (10.0, 0.0), (20.0, 0.0), (30.0, 0.0), (40.0, 0.0) });

            var result = await Post(EventWithRegion(collinear));

            Assert.IsInstanceOfType(result.Result, typeof(UnprocessableEntityObjectResult));
            var body = ((UnprocessableEntityObjectResult)result.Result!).Value as string;
            StringAssert.Contains(body ?? "", "degenerate");
            Assert.IsFalse((body ?? "").Contains("clockwise"),
                "a ring with no orientation must not be described as wound the wrong way");
        }

        [TestMethod]
        public async Task Create_DuplicatedPoints_Returns422AsDegenerate()
        {
            var duplicates = Ring(new[] { (10.0, 10.0), (10.0, 10.0), (10.0, 10.0) });

            var result = await Post(EventWithRegion(duplicates));

            Assert.IsInstanceOfType(result.Result, typeof(UnprocessableEntityObjectResult));
            StringAssert.Contains(
                ((UnprocessableEntityObjectResult)result.Result!).Value as string ?? "", "degenerate");
        }

        // Fewer than three points cannot enclose anything, but it is not an error — the event may
        // legitimately carry only a specific location.
        [TestMethod]
        public async Task Create_RegionWithFewerThanThreePoints_IsNotAWindingError()
        {
            var e = TestSupport.ValidEvent(null);
            e.Region = Ring(new[] { (10.0, 10.0), (10.0, 11.0) });

            var result = await Post(e);

            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        }

        // Pins the known gap rather than hiding it. The `twist` fixture from
        // region-winding.spec.ts is globally counterclockwise but crosses itself, so EarClipping
        // throws on it while this check accepts it. Tolerable only because DisplayRegion and
        // EditableRegion wrap the mesh in an ErrorBoundary: it fails to draw, nothing else breaks.
        // If this ever needs closing, the only sufficient fix is porting EarClipping itself.
        [TestMethod]
        public async Task Create_SelfIntersectingRegion_IsAcceptedKnownGap()
        {
            var twist = Ring(new[]
            {
                (42.5, 13.5), (43.21, 13.21), (42.36, 14.23), (43.21, 11.79),
                (42.5, 11.5), (41.14, 13.55), (41.5, 12.5), (42.0, 10.74),
            });

            Assert.IsTrue(EventValidation.RegionSignedArea(twist) > 0,
                "the twist fixture is globally counterclockwise, which is why orientation alone misses it");

            var result = await Post(EventWithRegion(twist));
            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        }
    }
}
