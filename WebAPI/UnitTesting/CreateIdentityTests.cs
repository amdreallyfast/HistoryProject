using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebAPI.Models;

namespace WebAPI.Tests
{
    // Server authority over revision identity.
    //
    // What a forged Revision actually breaks is ORDERING, not confidentiality: both
    // GetFirst100's NOT EXISTS subquery and the frontend's getLatestRevisions pick the maximum
    // revision per EventId, so a revision numbered 99999 would pin itself as "latest" permanently.
    // The fix is not to validate the client's number but to stop accepting it.
    [TestClass]
    public class CreateIdentityTests
    {
        private static Event NewEventPayload(Guid eventId, int clientRevision)
        {
            var e = TestSupport.ValidEvent(null);
            e.EventId = eventId;
            e.Revision = clientRevision;
            e.Id = Guid.NewGuid();
            return e;
        }

        private static Event Created(ActionResult<Event> result)
        {
            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
            return (Event)((OkObjectResult)result.Result!).Value!;
        }

        [TestMethod]
        public async Task Create_AssignsSequentialRevisions_IgnoringWhatTheClientSent()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();

            // Both submissions claim absurd revision numbers. Neither should be honoured.
            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                var first = Created(await TestSupport.NewController(db).Create(NewEventPayload(eventId, 99999)));
                Assert.AreEqual(1, first.Revision, "the first revision of an event is 1, not what the client claimed");
            }
            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                var second = Created(await TestSupport.NewController(db).Create(NewEventPayload(eventId, -5)));
                Assert.AreEqual(2, second.Revision, "the next revision is max + 1, not what the client claimed");
            }
        }

        // The specific attack the TODO item describes: pin yourself as "latest" forever.
        [TestMethod]
        public async Task Create_CannotPinItselfAsLatestWithAHugeRevision()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();

            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                await TestSupport.NewController(db).Create(NewEventPayload(eventId, 1));
            }
            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                await TestSupport.NewController(db).Create(NewEventPayload(eventId, 99999));
            }
            // A legitimate third edit must still be able to supersede the tampered one.
            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                var third = Created(await TestSupport.NewController(db).Create(NewEventPayload(eventId, 1)));
                Assert.AreEqual(3, third.Revision);
            }

            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                var revisions = await db.Events.Where(x => x.EventId == eventId)
                    .Select(x => x.Revision).OrderBy(r => r).ToListAsync();
                CollectionAssert.AreEqual(new[] { 1, 2, 3 }, revisions,
                    "revisions must be a dense sequence the server controls");
            }
        }

        [TestMethod]
        public async Task Create_AssignsItsOwnPrimaryKey()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            var clientChosenId = Guid.NewGuid();

            using var db = TestSupport.NewInMemoryContext(dbName);
            var payload = NewEventPayload(eventId, 1);
            payload.Id = clientChosenId;

            var created = Created(await TestSupport.NewController(db).Create(payload));

            Assert.AreNotEqual(clientChosenId, created.Id, "the primary key is the server's to assign");
            Assert.AreNotEqual(Guid.Empty, created.Id);
        }

        // EventId is the ONE identity field kept as sent, and this test is the reason.
        // EditEvent.onSubmitClick re-fetches getAllRevisions(eventId) with the client's own value
        // after a successful Create; reassigning it server-side would 404 that call and drop the
        // UI into its degraded fallback path.
        [TestMethod]
        public async Task Create_PreservesTheClientsEventId()
        {
            var eventId = Guid.NewGuid();
            using var db = TestSupport.NewInMemoryContext();

            var created = Created(await TestSupport.NewController(db).Create(NewEventPayload(eventId, 1)));

            Assert.AreEqual(eventId, created.EventId);
        }

        [TestMethod]
        public async Task Create_AssignsAnEventIdWhenNoneWasSent()
        {
            using var db = TestSupport.NewInMemoryContext();
            var payload = NewEventPayload(Guid.Empty, 1);

            var created = Created(await TestSupport.NewController(db).Create(payload));

            Assert.AreNotEqual(Guid.Empty, created.EventId);
        }

        [TestMethod]
        public async Task Create_StampsTheServerClockInUtc()
        {
            var before = DateTime.UtcNow.AddSeconds(-5);
            using var db = TestSupport.NewInMemoryContext();

            var payload = NewEventPayload(Guid.NewGuid(), 1);
            // A client claiming a timestamp from the distant past must not be believed.
            payload.RevisionDateTime = new DateTime(1999, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            var created = Created(await TestSupport.NewController(db).Create(payload));

            Assert.IsTrue(created.RevisionDateTime >= before, "the timestamp must come from the server clock");
            Assert.IsTrue(created.RevisionDateTime <= DateTime.UtcNow.AddSeconds(5));
            // The frontend formats and the E2E asserts UTC; storing local time would be a silent
            // offset on any host not already running UTC.
            Assert.IsTrue(created.RevisionDateTime.Kind == DateTimeKind.Utc
                       || created.RevisionDateTime.Kind == DateTimeKind.Unspecified);
        }

        // Independent revision chains must not interfere.
        [TestMethod]
        public async Task Create_NumbersEachEventIndependently()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventA = Guid.NewGuid();
            var eventB = Guid.NewGuid();

            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                await TestSupport.NewController(db).Create(NewEventPayload(eventA, 1));
            }
            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                await TestSupport.NewController(db).Create(NewEventPayload(eventA, 1));
            }
            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                var firstOfB = Created(await TestSupport.NewController(db).Create(NewEventPayload(eventB, 1)));
                Assert.AreEqual(1, firstOfB.Revision, "a different event starts its own chain at 1");
            }
        }

        // Regression for a silently-vanishing write.
        //
        // Event.EventImage is a [Required] reference navigation, so .Include(x => x.EventImage)
        // is an INNER JOIN -- and every read endpoint includes it. An event stored without an
        // EventImage row saved fine and then could never be read back by ANY endpoint. The
        // frontend always sends a wrapper so it never bit in practice, but validation accepts a
        // null one, so a minimal client could trigger it. Create now fills in an empty wrapper.
        [TestMethod]
        public async Task Create_WithoutAnImage_IsStillReadableAfterwards()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();

            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                var payload = NewEventPayload(eventId, 1);
                payload.EventImage = null;
                Created(await TestSupport.NewController(db).Create(payload));
            }

            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                var latest = await TestSupport.NewController(db).GetLatestRevision(eventId);
                Assert.IsInstanceOfType(latest.Result, typeof(OkObjectResult),
                    "an imageless event must still be readable -- the [Required] navigation makes Include an inner join");
            }
            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                var all = await TestSupport.NewController(db).GetAllRevisions(eventId);
                Assert.IsInstanceOfType(all.Result, typeof(OkObjectResult));
            }
            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                var first100 = await TestSupport.NewController(db).GetFirst100();
                var events = (List<Event>)((OkObjectResult)first100.Result!).Value!;
                Assert.IsTrue(events.Any(x => x.EventId == eventId),
                    "an imageless event must appear in search results");
            }
        }

        // GetSpecificRevision filtered on Id (the per-revision primary key) while its route
        // parameter and every sibling endpoint mean EventId, so it could only ever match if the
        // caller happened to pass a revision's PK.
        [TestMethod]
        public async Task GetSpecificRevision_FindsByEventIdNotPrimaryKey()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();

            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                await TestSupport.NewController(db).Create(NewEventPayload(eventId, 1));
            }
            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                await TestSupport.NewController(db).Create(NewEventPayload(eventId, 1));
            }

            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                var result = await TestSupport.NewController(db).GetSpecificRevision(eventId, 2);

                Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult),
                    "looking up revision 2 of an event by its EventId must find it");
                var found = (Event)((OkObjectResult)result.Result!).Value!;
                Assert.AreEqual(2, found.Revision);
                Assert.AreEqual(eventId, found.EventId);
            }
        }
    }
}
