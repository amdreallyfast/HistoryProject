using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAPI.ModelDTOs;
using WebAPI.Models;

namespace WebAPI.Tests
{
    // "No image" is stored as no image row (EventImageId NULL), not an empty-bytes row
    // (claudePlans/9). Each call uses a fresh context over a shared in-memory database, like
    // separate HTTP requests.
    [TestClass]
    public class OptionalImageTests
    {
        private static Event Imageless(Guid eventId)
        {
            var e = TestSupport.ValidEvent(image: null);
            e.EventId = eventId;
            e.Tags = new List<Tag>();
            e.Sources = new List<EventSource>();
            return e;
        }

        private static async Task<CreatedRevision> Create(string dbName, Event e)
        {
            using var db = TestSupport.NewInMemoryContext(dbName);
            var result = await TestSupport.NewController(db).Create(e);
            return (CreatedRevision)((OkObjectResult)result.Result!).Value!;
        }

        private static async Task<List<Guid?>> ImageIdsByRevision(string dbName, Guid eventId)
        {
            using var db = TestSupport.NewInMemoryContext(dbName);
            return await db.Events
                .Where(x => x.EventId == eventId)
                .OrderBy(x => x.Revision)
                .Select(x => EF.Property<Guid?>(x, "EventImageId"))
                .ToListAsync();
        }

        private static async Task<int> ImageCount(string dbName)
        {
            using var db = TestSupport.NewInMemoryContext(dbName);
            return await db.Images.CountAsync();
        }

        [TestMethod]
        public async Task NoImage_StoresNullAndNoImageRow_AcrossRevisions()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();

            var first = await Create(dbName, Imageless(eventId));
            var second = await Create(dbName, Imageless(eventId));

            Assert.IsNull(first.EventImageId);
            Assert.IsNull(second.EventImageId);
            CollectionAssert.AreEqual(new Guid?[] { null, null }, await ImageIdsByRevision(dbName, eventId));
            Assert.AreEqual(0, await ImageCount(dbName));
        }

        [TestMethod]
        public async Task LegacyEmptyWrapper_IsStoredAsNoImage()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            var e = Imageless(eventId);
            e.EventImage = new EventImage { Id = Guid.NewGuid(), ImageBinary = Array.Empty<byte>() };

            var created = await Create(dbName, e);

            Assert.IsNull(created.EventImageId);
            Assert.AreEqual(0, await ImageCount(dbName));
        }

        [TestMethod]
        public async Task ImageThenNoImage_LaterRevisionHasNone_EarlierKeepsIts()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            var withImage = Imageless(eventId);
            withImage.EventImage = new EventImage { Id = Guid.NewGuid(), ImageBinary = TestSupport.PngBytes() };

            var first = await Create(dbName, withImage);
            await Create(dbName, Imageless(eventId));

            var ids = await ImageIdsByRevision(dbName, eventId);
            Assert.AreEqual(first.EventImageId, ids[0]);
            Assert.IsNull(ids[1]);
            Assert.AreEqual(1, await ImageCount(dbName));
        }

        // Every read endpoint returns an imageless event with EventImage null, and with empty
        // Tags/Sources (collection navigations never filter the event out; checked, not assumed).
        [TestMethod]
        public async Task ImagelessEventWithEmptyLists_IsReturnedByEveryReadEndpoint()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            var created = await Create(dbName, Imageless(eventId));

            Event Single(ActionResult<Event> r) => (Event)((OkObjectResult)r.Result!).Value!;
            List<Event> Many(ActionResult<IEnumerable<Event>> r) => ((IEnumerable<Event>)((OkObjectResult)r.Result!).Value!).ToList();

            var reads = new List<Event>();
            using (var db = TestSupport.NewInMemoryContext(dbName))
                reads.Add(Single(await TestSupport.NewController(db).GetLatestRevision(eventId)));
            using (var db = TestSupport.NewInMemoryContext(dbName))
                reads.Add(Single(await TestSupport.NewController(db).GetSpecificRevision(eventId, created.Revision)));
            using (var db = TestSupport.NewInMemoryContext(dbName))
                reads.Add(Many(await TestSupport.NewController(db).GetAllRevisions(eventId)).Single());
            using (var db = TestSupport.NewInMemoryContext(dbName))
                reads.Add(Many(await TestSupport.NewController(db).GetFirst100()).Single(x => x.EventId == eventId));

            foreach (var e in reads)
            {
                Assert.IsNull(e.EventImage);
                Assert.AreEqual(0, e.Tags.Count);
                Assert.AreEqual(0, e.Sources.Count);
            }
        }
    }
}
