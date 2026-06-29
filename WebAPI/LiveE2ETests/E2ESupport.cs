using System.Net;
using System.Text;
using Newtonsoft.Json;
using WebAPI.Models;

namespace WebAPI.LiveE2ETests
{
    // Live E2E support: a thin HttpClient over the deployed test API, plus the namespaced,
    // capped, never-wipe data strategy.
    //
    // All test data lives under a reserved namespace (the E2ETag tag) so cleanup is only ever
    // scoped to test data — the DB is never wiped and real events are never touched. A small set
    // of PERMANENT events (fixed EventIds) is seeded idempotently; read/long-term tests run
    // against them and edit tests APPEND a new revision (history grows, event count stays capped).
    internal static class E2ESupport
    {
        public const string E2ETag = "__e2e__";

        // Base URL of the test App Service, e.g. https://historyprojectapi-testing.azurewebsites.net.
        // When unset, tests skip (Assert.Inconclusive) so a stray local run is a no-op.
        public static readonly string? BaseUrl =
            Environment.GetEnvironmentVariable("E2E_API_BASE_URL")?.TrimEnd('/');

        public static bool IsConfigured => !string.IsNullOrWhiteSpace(BaseUrl);

        public static void RequireConfigured()
        {
            if (!IsConfigured)
            {
                Assert.Inconclusive("E2E_API_BASE_URL is not set; skipping live backend tests.");
            }
        }

        // Permanent test events: fixed EventIds + titles. Capped set — edits append revisions
        // rather than creating new events, so this never grows.
        public static readonly IReadOnlyList<(Guid EventId, string Title)> PermanentEvents = new[]
        {
            (Guid.Parse("0e2e0001-0000-0000-0000-000000000001"), "Test Event 1 E2E"),
            (Guid.Parse("0e2e0002-0000-0000-0000-000000000002"), "Test Event 2 E2E"),
            (Guid.Parse("0e2e0003-0000-0000-0000-000000000003"), "Test Event 3 E2E"),
            (Guid.Parse("0e2e0004-0000-0000-0000-000000000004"), "Test Event 4 E2E"),
            (Guid.Parse("0e2e0005-0000-0000-0000-000000000005"), "Test Event 5 E2E"),
        };

        private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(100) };

        private static string Url(string path) => $"{BaseUrl}/api/HistoricalEvent/{path}";

        // ---- API calls ----

        public static async Task<List<Event>> GetFirst100Async()
        {
            var resp = await GetWithRetryAsync(Url("GetFirst100"));
            resp.EnsureSuccessStatusCode();
            return Deserialize<List<Event>>(await resp.Content.ReadAsStringAsync()) ?? new List<Event>();
        }

        public static async Task<(HttpStatusCode Status, Event? Event)> GetLatestRevisionAsync(Guid eventId)
        {
            var resp = await GetWithRetryAsync(Url($"GetLatestRevision/{eventId}"));
            if (resp.StatusCode == HttpStatusCode.NotFound)
            {
                return (HttpStatusCode.NotFound, null);
            }
            resp.EnsureSuccessStatusCode();
            return (resp.StatusCode, Deserialize<Event>(await resp.Content.ReadAsStringAsync()));
        }

        public static async Task<List<Event>> GetAllRevisionsAsync(Guid eventId)
        {
            var resp = await GetWithRetryAsync(Url($"GetAllRevisions/{eventId}"));
            resp.EnsureSuccessStatusCode();
            return Deserialize<List<Event>>(await resp.Content.ReadAsStringAsync()) ?? new List<Event>();
        }

        public static async Task<HttpResponseMessage> CreateAsync(Event e)
        {
            var content = new StringContent(JsonConvert.SerializeObject(e), Encoding.UTF8, "application/json");
            return await Http.PostAsync(Url("Create"), content);
        }

        public static async Task DeleteAsync(Guid eventId)
        {
            await Http.DeleteAsync(Url($"Delete/{eventId}"));
        }

        // ---- Namespaced data strategy ----

        // Create any missing permanent events. Idempotent (create-if-absent); never bulk-deletes.
        public static async Task EnsureSeededAsync()
        {
            foreach (var (eventId, title) in PermanentEvents)
            {
                var (status, _) = await GetLatestRevisionAsync(eventId);
                if (status == HttpStatusCode.NotFound)
                {
                    var resp = await CreateAsync(BuildCanonicalEvent(eventId, revision: 1, title));
                    resp.EnsureSuccessStatusCode();
                }
            }
        }

        // Delete any E2E-tagged event that is NOT in the permanent set (orphans from crashed or
        // ad-hoc runs). Namespace-scoped only — real data is never considered.
        public static async Task CleanupOrphansAsync()
        {
            var permanentIds = PermanentEvents.Select(p => p.EventId).ToHashSet();
            var all = await GetFirst100Async();
            foreach (var e in all)
            {
                bool isE2E = e.Tags?.Any(t => t.Value == E2ETag) == true;
                if (isE2E && !permanentIds.Contains(e.EventId))
                {
                    await DeleteAsync(e.EventId);
                }
            }
        }

        public static Event BuildCanonicalEvent(Guid eventId, int revision, string title)
        {
            return new Event
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                Revision = revision,
                RevisionDateTime = DateTime.UtcNow,
                RevisionAuthor = "e2e",
                Title = title,
                Summary = "Permanent E2E fixture event.",
                Tags = new List<Tag> { new() { Id = Guid.NewGuid(), Value = E2ETag } },
                SpecificLocation = new EventLocation { Id = Guid.NewGuid(), Latitude = 41.9, Longitude = 12.5 },
                Region = new List<EventLocation>
                {
                    new() { Id = Guid.NewGuid(), Latitude = 42.0, Longitude = 12.0, OrderIndex = 0 },
                    new() { Id = Guid.NewGuid(), Latitude = 42.0, Longitude = 13.0, OrderIndex = 1 },
                    new() { Id = Guid.NewGuid(), Latitude = 43.0, Longitude = 12.5, OrderIndex = 2 },
                },
            };
        }

        // ---- helpers ----

        private static T? Deserialize<T>(string json) => JsonConvert.DeserializeObject<T>(json);

        // Tolerate cold-start transients on the test App Service (no Always-On): a couple of
        // retries on transient failures before giving up.
        private static async Task<HttpResponseMessage> GetWithRetryAsync(string url, int attempts = 4)
        {
            HttpResponseMessage? last = null;
            for (int i = 0; i < attempts; i++)
            {
                try
                {
                    last = await Http.GetAsync(url);
                    if (last.StatusCode != HttpStatusCode.GatewayTimeout &&
                        last.StatusCode != HttpStatusCode.ServiceUnavailable &&
                        last.StatusCode != HttpStatusCode.BadGateway)
                    {
                        return last;
                    }
                }
                catch (HttpRequestException) when (i < attempts - 1)
                {
                    // fall through to retry
                }
                await Task.Delay(TimeSpan.FromSeconds(5));
            }
            return last ?? throw new HttpRequestException($"GET failed after {attempts} attempts: {url}");
        }
    }
}
