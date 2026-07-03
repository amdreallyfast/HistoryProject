using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebAPI.Controllers;

namespace WebAPI.Tests
{
    // Delete/{eventId} is backend-only test/admin cleanup: it hard-deletes the WHOLE event (all
    // revisions + owned children) and is gated to dev/test environments. These run the real
    // controller over an in-memory DB. Note: the in-memory provider does not enforce FK
    // constraints, so it verifies the rows are removed but not the real-SQL 500 — that path is
    // covered end-to-end by the live E2E cleanup against the test App Service.
    [TestClass]
    public class DeleteTests
    {
        [TestMethod]
        public async Task Delete_RemovesAllRevisionsAndChildren()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();

            // Seed two fully-populated revisions of one event with a separate context.
            using (var seed = TestSupport.NewInMemoryContext(dbName))
            {
                seed.Events.Add(TestSupport.FullyPopulatedEvent(eventId, 1, "rev1"));
                seed.Events.Add(TestSupport.FullyPopulatedEvent(eventId, 2, "rev2"));
                await seed.SaveChangesAsync();
            }

            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                var controller = TestSupport.NewController(db); // Testing env → allowed
                var result = await controller.Delete(eventId);
                Assert.IsInstanceOfType(result, typeof(OkObjectResult));
            }

            // Every revision and all owned children are gone.
            using (var verify = TestSupport.NewInMemoryContext(dbName))
            {
                Assert.AreEqual(0, await verify.Events.CountAsync(e => e.EventId == eventId), "events");
                Assert.AreEqual(0, await verify.Sources.CountAsync(), "sources");
                Assert.AreEqual(0, await verify.SourceAuthors.CountAsync(), "source authors");
                Assert.AreEqual(0, await verify.Locations.CountAsync(), "locations (specific + region)");
                Assert.AreEqual(0, await verify.Images.CountAsync(), "images");
            }
        }

        [TestMethod]
        public async Task Delete_UnknownEvent_ReturnsNotFound()
        {
            using var db = TestSupport.NewInMemoryContext();
            var controller = TestSupport.NewController(db);

            var result = await controller.Delete(Guid.NewGuid());

            Assert.IsInstanceOfType(result, typeof(NotFoundObjectResult));
        }

        [TestMethod]
        public async Task Delete_InProduction_IsForbidden_AndDeletesNothing()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventId = Guid.NewGuid();
            using (var seed = TestSupport.NewInMemoryContext(dbName))
            {
                seed.Events.Add(TestSupport.FullyPopulatedEvent(eventId, 1, "rev1"));
                await seed.SaveChangesAsync();
            }

            using (var db = TestSupport.NewInMemoryContext(dbName))
            {
                var controller = new HistoricalEventController(db, new StubWebHostEnvironment { EnvironmentName = "Production" });
                var result = await controller.Delete(eventId);

                var status = result as ObjectResult;
                Assert.IsNotNull(status);
                Assert.AreEqual(StatusCodes.Status403Forbidden, status!.StatusCode);
            }

            // The event survives the forbidden call.
            using (var verify = TestSupport.NewInMemoryContext(dbName))
            {
                Assert.AreEqual(1, await verify.Events.CountAsync(e => e.EventId == eventId));
            }
        }
    }
}
