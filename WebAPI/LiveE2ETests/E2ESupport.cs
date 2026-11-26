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
            var resp = await Http.DeleteAsync(Url($"Delete/{eventId}"));
            // Tolerate 404 (already gone), but surface anything else so orphan cleanup can't
            // silently no-op — e.g. the 403 env-gate or a 500 would otherwise be swallowed.
            if (!resp.IsSuccessStatusCode && resp.StatusCode != HttpStatusCode.NotFound)
            {
                var body = await resp.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Delete failed ({(int)resp.StatusCode} {resp.StatusCode}): {body}");
            }
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
                    await EnsureCreatedAsync(resp);
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

        // A complete, valid PNG loaded from the copied test asset (see LiveE2ETests.csproj).
        // Unlike the old signature-only bytes — which passed the server's magic-byte check but
        // were not a decodable image, so the frontend showed a broken img + "ERROR: Bad dataUrl."
        // — this round-trips as a real image the UI can display.
        private static readonly Lazy<byte[]> SeedImageBytes = new(() =>
            File.ReadAllBytes(Path.Combine(AppContext.BaseDirectory, "Assets", "JohnOethGuitar.png")));

        public static Event BuildCanonicalEvent(Guid eventId, int revision, string title)
        {
            // Mirror the shape the frontend's frontendToBackend sends: the Event model marks
            // EventImage, Tags, and Sources [Required], and the controller is [ApiController], so
            // any of them being null makes model binding return 400 before the action runs.
            return new Event
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                Revision = revision,
                RevisionDateTime = DateTime.UtcNow,
                RevisionAuthor = "e2e",
                Title = title,
                Summary = "Permanent E2E fixture event used by the live full-stack tests.",
                EventIsCreationOfSource = false,
                // Real time bounds so the details panel reads "between '1200/01/01 AD' and
                // '1400/12/31 AD'" instead of the ridiculous -99999/99999 sentinel defaults.
                LBYear = 1200,
                LBMonth = 1,
                LBDay = 1,
                UBYear = 1400,
                UBMonth = 12,
                UBDay = 31,
                Tags = new List<Tag> { new() { Id = Guid.NewGuid(), Value = E2ETag } },
                EventImage = new EventImage { Id = Guid.NewGuid(), ImageBinary = SeedImageBytes.Value },
                SpecificLocation = new EventLocation { Id = Guid.NewGuid(), Latitude = 41.9, Longitude = 12.5 },
                Region = new List<EventLocation>
                {
                    new() { Id = Guid.NewGuid(), Latitude = 42.0, Longitude = 12.0, OrderIndex = 0 },
                    new() { Id = Guid.NewGuid(), Latitude = 42.0, Longitude = 13.0, OrderIndex = 1 },
                    new() { Id = Guid.NewGuid(), Latitude = 43.0, Longitude = 12.5, OrderIndex = 2 },
                },
                // One source with real publication years (its defaults are the same sentinel),
                // so the Sources section renders a clean entry rather than an empty list.
                Sources = new List<EventSource>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        Title = "E2E Reference Work",
                        Where = "ch. 1",
                        Authors = new List<EventSourceAuthor>
                        {
                            new() { Id = Guid.NewGuid(), Name = "E2E Author" },
                        },
                        PublicationLBYear = 1300,
                        PublicationUBYear = 1300,
                    },
                },
            };
        }

        // Like EnsureSuccessStatusCode but includes the response body, so a 400/422 from Create
        // reports *why* (the validation message) instead of a bare status code.
        public static async Task EnsureCreatedAsync(HttpResponseMessage resp)
        {
            if (!resp.IsSuccessStatusCode)
            {
                var body = await resp.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Create failed ({(int)resp.StatusCode} {resp.StatusCode}): {body}");
            }
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
