using System.Linq;
using WebAPI.Models;

namespace WebAPI.LiveE2ETests
{
    // Live full-stack tests against the deployed test App Service + its SQL DB. These verify
    // the real frontend↔backend JSON contract and genuine long-term persistence/edits — the
    // things the mocked Playwright suite and the in-process unit tests deliberately can't.
    // They run nightly/manual (see .github/workflows/live-e2e.yml) and skip when
    // E2E_API_BASE_URL is unset.
    [TestClass]
    public class LiveBackendTests
    {
        [ClassInitialize]
        public static async Task ClassInit(TestContext _)
        {
            if (!E2ESupport.IsConfigured)
            {
                return; // individual tests will Assert.Inconclusive
            }
            await E2ESupport.CleanupOrphansAsync();
            await E2ESupport.EnsureSeededAsync();
        }

        [TestMethod]
        public async Task GetFirst100_ReturnsContractShape_WithPermanentE2EEvents()
        {
            E2ESupport.RequireConfigured();

            var events = await E2ESupport.GetFirst100Async();
            Assert.IsTrue(events.Count > 0, "GetFirst100 returned no events");

            // The permanent E2E events are present and deserialized into the real Event model —
            // proving the live JSON shape still matches what the model (and frontend mapper) expect.
            foreach (var (eventId, _) in E2ESupport.PermanentEvents)
            {
                var match = events.SingleOrDefault(e => e.EventId == eventId);
                Assert.IsNotNull(match, $"permanent E2E event {eventId} missing from GetFirst100");
                Assert.IsFalse(string.IsNullOrEmpty(match!.Title));
                Assert.IsNotNull(match.SpecificLocation, "SpecificLocation should be eager-loaded");
                Assert.IsTrue(match.Tags?.Any(t => t.Value == E2ESupport.E2ETag) == true, "E2E tag should round-trip");
            }
        }

        [TestMethod]
        public async Task EditAppendsRevision_AndPersists()
        {
            E2ESupport.RequireConfigured();

            var (eventId, _) = E2ESupport.PermanentEvents[0];

            var before = await E2ESupport.GetAllRevisionsAsync(eventId);
            Assert.IsTrue(before.Count > 0, "expected the permanent event to already exist");
            var latest = before.OrderByDescending(e => e.Revision).First();

            // Append a new revision (same EventId, Revision+1) — exercises the append-only edit
            // path and grows the history while the event count stays capped.
            var nextRevision = latest.Revision + 1;
            var edited = E2ESupport.BuildCanonicalEvent(eventId, nextRevision, $"Test Event 1 E2E (rev {nextRevision})");
            var resp = await E2ESupport.CreateAsync(edited);
            await E2ESupport.EnsureCreatedAsync(resp);

            var after = await E2ESupport.GetAllRevisionsAsync(eventId);
            Assert.AreEqual(before.Count + 1, after.Count, "a new revision should have been persisted");
            Assert.IsTrue(after.Any(e => e.Revision == nextRevision), "the new revision should be present");
        }
    }
}
