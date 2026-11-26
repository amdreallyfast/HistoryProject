using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebAPI.ModelDTOs;
using WebAPI.Models;

namespace WebAPI.Tests
{
    // Create shares an unchanged image with earlier revisions of the same event instead of
    // storing another copy (claudePlans/8). Each Create here uses a fresh context, like separate
    // HTTP requests, over a shared in-memory database.
    [TestClass]
    public class ImageSharingTests
    {
        private static async Task<ActionResult<CreatedRevision>> Create(string dbName, Guid eventId, byte[]? image, Guid? existingImageId = null, Guid? clientImageId = null, bool legacyEmptyWrapper = false)
        {
            using var db = TestSupport.NewInMemoryContext(dbName);
            var e = TestSupport.ValidEvent(image);
            e.EventId = eventId;
            e.ExistingImageId = existingImageId;
            if (legacyEmptyWrapper)
            {
                // What the frontend sent before claudePlans/9 for "no image" and next to
                // ExistingImageId: a wrapper with no bytes. Still accepted. Today it sends none.
                e.EventImage = new EventImage { Id = Guid.NewGuid(), ImageBinary = Array.Empty<byte>() };
            }
            if (clientImageId is Guid id && e.EventImage is not null)
            {
                e.EventImage.Id = id;
            }
            return await TestSupport.NewController(db).Create(e);
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
        public async Task ExistingImageId_WithLegacyEmptyWrapper_StillReusesTheImage()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            await Create(dbName, eventId, Jpeg(1));
            var firstImageId = (await ImageIdsByRevision(dbName, eventId))[0];

            var result = await Create(dbName, eventId, image: null, existingImageId: firstImageId, legacyEmptyWrapper: true);

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
        public async Task GetAllRevisions_SendsNoImageBytes_OnlyEachRevisionsImageId()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            await Create(dbName, eventId, Jpeg(1));
            await Create(dbName, eventId, Jpeg(1));
            await Create(dbName, eventId, Jpeg(2));

            var revs = await GetAllRevisions(dbName, eventId); // newest first
            var expectedIds = (await ImageIdsByRevision(dbName, eventId)).AsEnumerable().Reverse().ToList();
            Assert.IsTrue(revs.All(r => r.EventImage!.ImageBinary.Length == 0), "no image bytes in the revision list");
            CollectionAssert.AreEqual(expectedIds, revs.Select(r => r.EventImage!.Id).ToList(), "each revision's real image Id");
            Assert.AreEqual(revs[1].EventImage!.Id, revs[2].EventImage!.Id, "revisions 1 and 2 share an image");
            Assert.AreNotEqual(revs[0].EventImage!.Id, revs[1].EventImage!.Id, "revision 3 changed it");
        }

        private static async Task<ActionResult> GetImage(string dbName, Guid imageId, Action<Microsoft.AspNetCore.Http.IHeaderDictionary>? headers = null)
        {
            using var db = TestSupport.NewInMemoryContext(dbName);
            var controller = TestSupport.NewController(db);
            var result = await controller.GetImage(imageId);
            headers?.Invoke(controller.Response.Headers);
            return result;
        }

        [TestMethod]
        public async Task GetImage_ReturnsTheBytes_WithLongLivedCaching()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            await Create(dbName, eventId, Jpeg(7));
            var imageId = (await ImageIdsByRevision(dbName, eventId))[0]!.Value;

            string? cacheControl = null;
            var result = await GetImage(dbName, imageId, h => cacheControl = h.CacheControl);

            var file = (FileContentResult)result;
            CollectionAssert.AreEqual(Jpeg(7), file.FileContents);
            Assert.AreEqual("image/jpeg", file.ContentType);
            StringAssert.Contains(cacheControl, "immutable");
        }

        [TestMethod]
        public async Task GetImage_Png_HasPngContentType()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            await Create(dbName, eventId, TestSupport.PngBytes());
            var file = (FileContentResult)await GetImage(dbName, (await ImageIdsByRevision(dbName, eventId))[0]!.Value);
            Assert.AreEqual("image/png", file.ContentType);
        }

        [TestMethod]
        public async Task GetImage_EmptyRow_Is204_UnknownId_Is404()
        {
            // Empty-bytes rows are no longer written (no image is now no row, claudePlans/9), but
            // GetImage still answers 204 for one rather than serving empty "image" bytes.
            var dbName = Guid.NewGuid().ToString();
            var emptyId = Guid.NewGuid();
            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                db.Images.Add(new EventImage { Id = emptyId, ImageBinary = Array.Empty<byte>() });
                await db.SaveChangesAsync();
            }

            Assert.IsInstanceOfType(await GetImage(dbName, emptyId), typeof(NoContentResult));
            Assert.IsInstanceOfType(await GetImage(dbName, Guid.NewGuid()), typeof(NotFoundObjectResult));
        }

        [TestMethod]
        public async Task Create_ReturnsTheSavedImageId_NewOrShared()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            var first = (CreatedRevision)((OkObjectResult)(await Create(dbName, eventId, Jpeg(1))).Result!).Value!;
            var second = (CreatedRevision)((OkObjectResult)(await Create(dbName, eventId, Jpeg(1))).Result!).Value!;

            var stored = await ImageIdsByRevision(dbName, eventId);
            Assert.AreEqual(stored[0], first.EventImageId);
            Assert.AreEqual(stored[1], second.EventImageId);
            Assert.AreEqual(first.EventImageId, second.EventImageId, "second revision shares the first's image");
        }

        [TestMethod]
        public async Task Create_ReturnsOnlyTheNewRevisionsIdentity_NotTheImage()
        {
            var result = await Create(Guid.NewGuid().ToString(), Guid.NewGuid(), Jpeg(1));
            var body = ((OkObjectResult)result.Result!).Value!;

            Assert.IsInstanceOfType(body, typeof(CreatedRevision));
            var json = Newtonsoft.Json.JsonConvert.SerializeObject(body);
            Assert.IsFalse(json.Contains("ImageBinary"), "the image must not be echoed back");
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
