using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebAPI.Models;

namespace WebAPI.Tests
{
    // Create shares an unchanged image with earlier revisions of the same event instead of
    // storing another copy (claudePlans/8). Each Create here uses a fresh context, like separate
    // HTTP requests, over a shared in-memory database.
    [TestClass]
    public class ImageSharingTests
    {
        private static async Task<ActionResult<Event>> Create(string dbName, Guid eventId, byte[]? image, Guid? existingImageId = null, Guid? clientImageId = null)
        {
            using var db = TestSupport.NewInMemoryContext(dbName);
            var e = TestSupport.ValidEvent(image);
            e.EventId = eventId;
            e.ExistingImageId = existingImageId;
            if (existingImageId is not null)
            {
                // What the frontend sends when keeping the image: a wrapper with no bytes.
                e.EventImage = new EventImage { Id = Guid.NewGuid(), ImageBinary = Array.Empty<byte>() };
            }
            if (clientImageId is Guid id && e.EventImage is not null)
            {
                e.EventImage.Id = id;
            }
            return await TestSupport.NewController(db).Create(e);
        }

        private static async Task<List<Guid>> ImageIdsByRevision(string dbName, Guid eventId)
        {
            using var db = TestSupport.NewInMemoryContext(dbName);
            return await db.Events
                .Where(x => x.EventId == eventId)
                .OrderBy(x => x.Revision)
                .Select(x => EF.Property<Guid>(x, "EventImageId"))
                .ToListAsync();
        }

        private static async Task<int> ImageCount(string dbName)
        {
            using var db = TestSupport.NewInMemoryContext(dbName);
            return await db.Images.CountAsync();
        }

        private static byte[] Jpeg(byte variant) => TestSupport.JpegBytes().Append(variant).ToArray();

        [TestMethod]
        public async Task SameBytesInLaterRevision_ShareOneImageRow()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();

            Assert.IsInstanceOfType(( await Create(dbName, eventId, Jpeg(1))).Result, typeof(OkObjectResult));
            Assert.IsInstanceOfType((await Create(dbName, eventId, Jpeg(1))).Result, typeof(OkObjectResult));

            var ids = await ImageIdsByRevision(dbName, eventId);
            Assert.AreEqual(2, ids.Count);
            Assert.AreEqual(ids[0], ids[1], "both revisions point at the same image row");
            Assert.AreEqual(1, await ImageCount(dbName));
        }

        [TestMethod]
        public async Task ExistingImageId_ReusesEarlierRevisionsImage_WithoutBytes()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            await Create(dbName, eventId, Jpeg(1));
            var firstImageId = (await ImageIdsByRevision(dbName, eventId))[0];

            var result = await Create(dbName, eventId, image: null, existingImageId: firstImageId);

            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
            CollectionAssert.AreEqual(new[] { firstImageId, firstImageId }, await ImageIdsByRevision(dbName, eventId));
            Assert.AreEqual(1, await ImageCount(dbName));
        }

        [TestMethod]
        public async Task ChangedImage_StoresANewRow()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            await Create(dbName, eventId, Jpeg(1));
            await Create(dbName, eventId, Jpeg(2));

            var ids = await ImageIdsByRevision(dbName, eventId);
            Assert.AreNotEqual(ids[0], ids[1]);
            Assert.AreEqual(2, await ImageCount(dbName));
        }

        [TestMethod]
        public async Task ExistingImageId_FromAnotherEvent_IsRejected()
        {
            var dbName = Guid.NewGuid().ToString();
            var otherEventId = Guid.NewGuid();
            await Create(dbName, otherEventId, Jpeg(1));
            var othersImageId = (await ImageIdsByRevision(dbName, otherEventId))[0];

            var eventId = Guid.NewGuid();
            var result = await Create(dbName, eventId, image: null, existingImageId: othersImageId);

            Assert.IsInstanceOfType(result.Result, typeof(UnprocessableEntityObjectResult));
            Assert.AreEqual(0, (await ImageIdsByRevision(dbName, eventId)).Count, "nothing stored");
        }

        [TestMethod]
        public async Task ExistingImageId_Unknown_IsRejected()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            await Create(dbName, eventId, Jpeg(1));

            var result = await Create(dbName, eventId, image: null, existingImageId: Guid.NewGuid());

            Assert.IsInstanceOfType(result.Result, typeof(UnprocessableEntityObjectResult));
            Assert.AreEqual(1, (await ImageIdsByRevision(dbName, eventId)).Count);
        }

        [TestMethod]
        public async Task SameBytesInDifferentEvents_AreNotShared()
        {
            // Cross-event sharing is deliberately out of scope: deleting one event would cascade
            // through a shared image row to the other event.
            var dbName = Guid.NewGuid().ToString();
            var a = Guid.NewGuid();
            var b = Guid.NewGuid();
            await Create(dbName, a, Jpeg(1));
            await Create(dbName, b, Jpeg(1));

            Assert.AreNotEqual((await ImageIdsByRevision(dbName, a))[0], (await ImageIdsByRevision(dbName, b))[0]);
            Assert.AreEqual(2, await ImageCount(dbName));
        }

        [TestMethod]
        public async Task ClientChosenImageId_IsReplacedByServer()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            var clientId = Guid.NewGuid();
            await Create(dbName, eventId, Jpeg(1), clientImageId: clientId);

            Assert.AreNotEqual(clientId, (await ImageIdsByRevision(dbName, eventId))[0]);
        }

        private static async Task<List<Event>> GetAllRevisions(string dbName, Guid eventId)
        {
            using var db = TestSupport.NewInMemoryContext(dbName);
            var result = await TestSupport.NewController(db).GetAllRevisions(eventId);
            return ((IEnumerable<Event>)((OkObjectResult)result.Result!).Value!).ToList();
        }

        [TestMethod]
        public async Task GetAllRevisions_SendsSharedImageBytesOnce_OnNewestRevision()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            await Create(dbName, eventId, Jpeg(1));
            await Create(dbName, eventId, Jpeg(1));
            await Create(dbName, eventId, Jpeg(1));

            var revs = await GetAllRevisions(dbName, eventId); // newest first
            Assert.AreEqual(3, revs.Count);
            CollectionAssert.AreEqual(Jpeg(1), revs[0].EventImage!.ImageBinary, "newest revision carries the bytes");
            Assert.AreEqual(0, revs[1].EventImage!.ImageBinary.Length, "older revisions: no repeat bytes");
            Assert.AreEqual(0, revs[2].EventImage!.ImageBinary.Length);
            Assert.IsTrue(revs.All(r => r.EventImage!.Id == revs[0].EventImage!.Id), "same image Id lets the client fill them in");
        }

        [TestMethod]
        public async Task GetAllRevisions_DifferentImages_EachCarryTheirBytes()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            await Create(dbName, eventId, Jpeg(1));
            await Create(dbName, eventId, Jpeg(2));

            var revs = await GetAllRevisions(dbName, eventId);
            CollectionAssert.AreEqual(Jpeg(2), revs[0].EventImage!.ImageBinary);
            CollectionAssert.AreEqual(Jpeg(1), revs[1].EventImage!.ImageBinary);
        }

        [TestMethod]
        public async Task Delete_WithSharedImage_RemovesEverything()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            await Create(dbName, eventId, Jpeg(1));
            await Create(dbName, eventId, Jpeg(1));
            await Create(dbName, eventId, image: null, existingImageId: (await ImageIdsByRevision(dbName, eventId))[0]);
            Assert.AreEqual(1, await ImageCount(dbName));

            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                Assert.IsInstanceOfType(await TestSupport.NewController(db).Delete(eventId), typeof(OkObjectResult));
            }

            Assert.AreEqual(0, (await ImageIdsByRevision(dbName, eventId)).Count);
            Assert.AreEqual(0, await ImageCount(dbName));
        }
    }
}
