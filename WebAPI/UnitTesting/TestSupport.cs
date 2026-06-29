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
        {
            var options = new DbContextOptionsBuilder<HistoryProjectDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
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
