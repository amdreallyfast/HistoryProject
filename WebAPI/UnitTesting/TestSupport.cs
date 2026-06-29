using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using WebAPI.Controllers;
using WebAPI.Models;

namespace WebAPI.Tests
{
    // Shared helpers for the backend controller tests: a fresh in-memory DbContext per test
    // and a controller wired to it. Each test gets its own uniquely-named in-memory database
    // so tests stay isolated.
    internal static class TestSupport
    {
        public static HistoryProjectDbContext NewInMemoryContext()
            => NewInMemoryContext(Guid.NewGuid().ToString());

        // Two contexts created with the same database name share data (InMemory provider). Seed
        // with one context and query with another so the query context has nothing tracked —
        // that way a missing .Include actually shows up (nav props stay null) rather than being
        // hidden by change-tracker fixup.
        public static HistoryProjectDbContext NewInMemoryContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<HistoryProjectDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new HistoryProjectDbContext(options);
        }

        public static HistoricalEventController NewController(HistoryProjectDbContext db)
            => new HistoricalEventController(db, new StubWebHostEnvironment());

        // Magic-byte prefixes the controller validates against.
        public static byte[] PngBytes() => new byte[] { 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a };
        public static byte[] JpegBytes() => new byte[] { 0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10 };

        // A minimal Event that passes the Title/Summary/location guards, so the image check is
        // what determines Ok vs 422. Pass null for no image.
        public static Event ValidEvent(byte[]? image)
        {
            var e = new Event
            {
                Id = Guid.NewGuid(),
                EventId = Guid.NewGuid(),
                Revision = 1,
                RevisionAuthor = "test",
                Title = "Test Title",
                Summary = "Test Summary",
                SpecificLocation = new EventLocation { Id = Guid.NewGuid(), Latitude = 41.9, Longitude = 12.5 },
            };
            if (image is not null)
            {
                e.EventImage = new EventImage { Id = Guid.NewGuid(), ImageBinary = image };
            }
            return e;
        }

        // A fully-populated Event (all related entities) for the contract / serialization tests.
        public static Event FullyPopulatedEvent(Guid eventId, int revision, string title)
        {
            return new Event
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                Revision = revision,
                RevisionDateTime = new DateTime(2026, 6, 28, 14, 30, 0, DateTimeKind.Utc),
                RevisionAuthor = "test",
                Title = title,
                Summary = "Test Summary",
                EventIsCreationOfSource = true,
                LBYear = 100, LBMonth = 1, LBDay = 1,
                UBYear = 200, UBMonth = 12, UBDay = 31,
                Tags = new List<Tag> { new() { Id = Guid.NewGuid(), Value = "rome" } },
                EventImage = new EventImage { Id = Guid.NewGuid(), ImageBinary = PngBytes() },
                SpecificLocation = new EventLocation { Id = Guid.NewGuid(), Latitude = 41.9, Longitude = 12.5 },
                Region = new List<EventLocation>
                {
                    new() { Id = Guid.NewGuid(), Latitude = 42.0, Longitude = 12.0, OrderIndex = 0 },
                    new() { Id = Guid.NewGuid(), Latitude = 43.0, Longitude = 13.0, OrderIndex = 1 },
                    new() { Id = Guid.NewGuid(), Latitude = 43.0, Longitude = 12.0, OrderIndex = 2 },
                },
                Sources = new List<EventSource>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        Title = "Source One",
                        ISBN = "12345",
                        Where = "Chapter 2",
                        PublicationLBYear = 150, PublicationUBYear = 160,
                        Authors = new List<EventSourceAuthor> { new() { Id = Guid.NewGuid(), Name = "Author A" } },
                    },
                },
            };
        }
    }

    // The controller stores an IWebHostEnvironment but Create/GetFirst100 never use it, so a
    // do-nothing stub is enough.
    internal sealed class StubWebHostEnvironment : IWebHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Testing";
        public string ApplicationName { get; set; } = "WebAPI.Tests";
        public string WebRootPath { get; set; } = string.Empty;
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string ContentRootPath { get; set; } = string.Empty;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
