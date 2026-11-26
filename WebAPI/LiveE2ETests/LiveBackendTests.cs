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

            var (eventId, title) = E2ESupport.PermanentEvents[0];

            var before = await E2ESupport.GetAllRevisionsAsync(eventId);
            Assert.IsTrue(before.Count > 0, "expected the permanent event to already exist");
            var latest = before.OrderByDescending(e => e.Revision).First();

            // Append a new revision (same EventId, Revision+1) — exercises the append-only edit
            // path and grows the history while the event count stays capped. Keep the Title stable
            // (no "(rev N)" suffix) so the search list doesn't drift; the new revision is still
            // distinguished by its Revision number and RevisionDateTime.
            var nextRevision = latest.Revision + 1;
            var edited = E2ESupport.BuildCanonicalEvent(eventId, nextRevision, title);
            var resp = await E2ESupport.CreateAsync(edited);
            await E2ESupport.EnsureCreatedAsync(resp);

            var after = await E2ESupport.GetAllRevisionsAsync(eventId);
            Assert.AreEqual(before.Count + 1, after.Count, "a new revision should have been persisted");
            Assert.IsTrue(after.Any(e => e.Revision == nextRevision), "the new revision should be present");
        }

        // An event with no image (EventImage null, claudePlans/9) must get past [ApiController]
        // model validation and come back from every read on real SQL Server. A required image
        // navigation made Include an INNER JOIN there, hiding imageless events from all reads.
        // Uses a throwaway E2E-tagged event, deleted at the end (or by CleanupOrphansAsync).
        [TestMethod]
        public async Task ImagelessEvent_CreatesAndReadsBack()
        {
            E2ESupport.RequireConfigured();

            var eventId = Guid.NewGuid();
            var e = E2ESupport.BuildCanonicalEvent(eventId, 1, "Imageless E2E (temporary)");
            e.EventImage = null;
            try
            {
                var resp = await E2ESupport.CreateAsync(e);
                await E2ESupport.EnsureCreatedAsync(resp);

                var (status, latest) = await E2ESupport.GetLatestRevisionAsync(eventId);
                Assert.AreEqual(System.Net.HttpStatusCode.OK, status, "imageless event must be readable");
                Assert.IsNull(latest!.EventImage);

                var revisions = await E2ESupport.GetAllRevisionsAsync(eventId);
                Assert.AreEqual(1, revisions.Count);
                Assert.IsNull(revisions[0].EventImage);

                var all = await E2ESupport.GetFirst100Async();
                Assert.IsTrue(all.Any(x => x.EventId == eventId), "imageless event must appear in search results");
            }
            finally
            {
                await E2ESupport.DeleteAsync(eventId);
            }
        }
    }
}
