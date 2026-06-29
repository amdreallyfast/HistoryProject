using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebAPI.Models;

namespace WebAPI.Tests
{
    // Guards the read path the frontend depends on: GetFirst100 must return the latest
    // revision per EventId and eager-load the related entities (Tags, EventImage,
    // SpecificLocation, Region, Sources+Authors) that eventMapper.backendToFrontend reads.
    [TestClass]
    public class ReadEndpointContractTests
    {
        [TestMethod]
        public async Task GetFirst100_ReturnsLatestRevisionPerEvent_WithRelatedEntities()
        {
            var dbName = Guid.NewGuid().ToString();
            var eventA = Guid.NewGuid();
            var eventB = Guid.NewGuid();

            // Seed with one context: event A has two revisions, event B has one.
            using (var seed = TestSupport.NewInMemoryContext(dbName))
            {
                seed.Events.Add(TestSupport.FullyPopulatedEvent(eventA, 1, "A rev1"));
                seed.Events.Add(TestSupport.FullyPopulatedEvent(eventA, 2, "A rev2"));
                seed.Events.Add(TestSupport.FullyPopulatedEvent(eventB, 1, "B rev1"));
                seed.SaveChanges();
            }

            // Query with a fresh context (nothing tracked) so a missing .Include would show up.
            using var query = TestSupport.NewInMemoryContext(dbName);
            var controller = TestSupport.NewController(query);

            var result = await controller.GetFirst100();

            var ok = result.Result as OkObjectResult;
            Assert.IsNotNull(ok, "GetFirst100 should return 200 OK");
            var events = (ok.Value as IEnumerable<Event>)?.ToList();
            Assert.IsNotNull(events);

            // Latest-only per EventId: A(rev2) + B(rev1) = 2 events.
            Assert.AreEqual(2, events!.Count);
            var a = events.Single(e => e.EventId == eventA);
            Assert.AreEqual(2, a.Revision, "should return the latest revision of event A");
            Assert.AreEqual("A rev2", a.Title);

            // Eager-loaded related entities (populated only because the controller .Includes them).
            Assert.IsNotNull(a.EventImage);
            Assert.IsTrue(a.EventImage!.ImageBinary.Length > 0);
            Assert.IsNotNull(a.SpecificLocation);
            Assert.IsNotNull(a.Region);
            Assert.AreEqual(3, a.Region!.Count);
            Assert.IsNotNull(a.Tags);
            Assert.IsTrue(a.Tags!.Any());
            Assert.IsNotNull(a.Sources);
            Assert.IsTrue(a.Sources!.Any());
            Assert.IsNotNull(a.Sources!.First().Authors);
            Assert.IsTrue(a.Sources!.First().Authors.Any());
        }
    }
}
