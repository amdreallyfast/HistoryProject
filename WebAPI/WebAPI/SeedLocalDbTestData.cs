using WebAPI.Models;

namespace WebAPI;

internal static class SeedLocalDbTestData
{
    internal static void Initialize(HistoryProjectDbContext db)
    {
        // Wipe all data in FK-safe order, then reseed fresh on every Development startup.
        db.Database.ExecuteSqlRaw("DELETE FROM SourceAuthors");
        db.Database.ExecuteSqlRaw("DELETE FROM Sources");
        db.Database.ExecuteSqlRaw("UPDATE Events SET SpecificLocationId = NULL");
        db.Database.ExecuteSqlRaw("DELETE FROM Locations");
        db.Database.ExecuteSqlRaw("DELETE FROM Events");
        db.Database.ExecuteSqlRaw("DELETE FROM Images");
        db.Database.ExecuteSqlRaw("DELETE FROM Tags");

        var event1 = new Event
        {
            Id = new Guid("aaaaaaaa-0000-0000-0000-000000000001"),
            EventId = new Guid("aaaaaaaa-0000-0000-0000-000000000001"),
            Revision = 0,
            RevisionDateTime = new DateTime(2024, 1, 1),
            RevisionAuthor = "amdreallyfast",
            Title = "Test Title Event 1",
            Summary = "This is the first test event. It occurred somewhere in West Africa.",
            LBYear = -500,
            LBMonth = 3,
            UBYear = -480,
            UBMonth = 6,
            EventImage = new EventImage
            {
                Id = new Guid("aaaaaaaa-0001-0000-0000-000000000001"),
                ImageBinary = Array.Empty<byte>(),
            },
            Tags = new List<Tag>
            {
                new Tag { Id = new Guid("aaaaaaaa-0002-0000-0000-000000000001"), Value = "ancient" },
                new Tag { Id = new Guid("aaaaaaaa-0003-0000-0000-000000000001"), Value = "west-africa" },
            },
            SpecificLocation = new EventLocation
            {
                Id = new Guid("aaaaaaaa-0004-0000-0000-000000000001"),
                Latitude = 11.0895,
                Longitude = -14.0557,
            },
            Region = new List<EventLocation>
            {
                new EventLocation { Id = new Guid("aaaaaaaa-0005-0000-0000-000000000001"), OrderIndex = 0, Latitude = 19.0895,  Longitude = -14.0557 },
                new EventLocation { Id = new Guid("aaaaaaaa-0006-0000-0000-000000000001"), OrderIndex = 1, Latitude = 16.681,   Longitude = -19.9523 },
                new EventLocation { Id = new Guid("aaaaaaaa-0007-0000-0000-000000000001"), OrderIndex = 2, Latitude = 10.9803,  Longitude = -22.2059 },
                new EventLocation { Id = new Guid("aaaaaaaa-0008-0000-0000-000000000001"), OrderIndex = 3, Latitude = 5.3879,   Longitude = -19.7284 },
                new EventLocation { Id = new Guid("aaaaaaaa-0009-0000-0000-000000000001"), OrderIndex = 4, Latitude = 3.0895,   Longitude = -14.0557 },
                new EventLocation { Id = new Guid("aaaaaaaa-000a-0000-0000-000000000001"), OrderIndex = 5, Latitude = 5.3879,   Longitude = -8.3829  },
                new EventLocation { Id = new Guid("aaaaaaaa-000b-0000-0000-000000000001"), OrderIndex = 6, Latitude = 10.9803,  Longitude = -5.9055  },
                new EventLocation { Id = new Guid("aaaaaaaa-000c-0000-0000-000000000001"), OrderIndex = 7, Latitude = 16.681,   Longitude = -8.1591  },
            },
            Sources = new List<EventSource>
            {
                new EventSource
                {
                    Id = new Guid("aaaaaaaa-0010-0000-0000-000000000001"),
                    Title = "Baggery",
                    ISBN = "978-0-123456-47-2",
                    Where = "Chapter 3, paragraph 12",
                    PublicationLBYear = 1995,
                    PublicationLBMonth = 1,
                    PublicationLBDay = 15,
                    PublicationUBYear = 1995,
                    PublicationUBMonth = 1,
                    PublicationUBDay = 15,
                    Authors = new List<EventSourceAuthor>
                    {
                        new EventSourceAuthor { Id = new Guid("aaaaaaaa-0011-0000-0000-000000000001"), Name = "Test Author" },
                    },
                },
            },
        };

        var event2 = new Event
        {
            Id = new Guid("bbbbbbbb-0000-0000-0000-000000000002"),
            EventId = new Guid("bbbbbbbb-0000-0000-0000-000000000002"),
            Revision = 0,
            RevisionDateTime = new DateTime(2024, 1, 1),
            RevisionAuthor = "amdreallyfast",
            Title = "Test Title Event 2",
            Summary = "This is the second test event. It occurred near Madagascar.",
            LBYear = 1100,
            UBYear = 1200,
            EventImage = new EventImage
            {
                Id = new Guid("bbbbbbbb-0001-0000-0000-000000000002"),
                ImageBinary = Array.Empty<byte>(),
            },
            Tags = new List<Tag>
            {
                new Tag { Id = new Guid("bbbbbbbb-0002-0000-0000-000000000002"), Value = "medieval" },
                new Tag { Id = new Guid("bbbbbbbb-0003-0000-0000-000000000002"), Value = "east-africa" },
            },
            SpecificLocation = new EventLocation
            {
                Id = new Guid("bbbbbbbb-0004-0000-0000-000000000002"),
                Latitude = -14.2267,
                Longitude = 34.8246,
            },
            Region = new List<EventLocation>
            {
                new EventLocation { Id = new Guid("bbbbbbbb-0005-0000-0000-000000000002"), OrderIndex = 0, Latitude = -6.2288,   Longitude = 34.6401 },
                new EventLocation { Id = new Guid("bbbbbbbb-0006-0000-0000-000000000002"), OrderIndex = 1, Latitude = -8.6382,   Longitude = 28.9816 },
                new EventLocation { Id = new Guid("bbbbbbbb-0007-0000-0000-000000000002"), OrderIndex = 2, Latitude = -14.2687,  Longitude = 26.5704 },
                new EventLocation { Id = new Guid("bbbbbbbb-0008-0000-0000-000000000002"), OrderIndex = 3, Latitude = -19.9334,  Longitude = 28.956  },
                new EventLocation { Id = new Guid("bbbbbbbb-0009-0000-0000-000000000002"), OrderIndex = 4, Latitude = -22.2245,  Longitude = 35.0227 },
                new EventLocation { Id = new Guid("bbbbbbbb-000a-0000-0000-000000000002"), OrderIndex = 5, Latitude = -19.6662,  Longitude = 40.9602 },
                new EventLocation { Id = new Guid("bbbbbbbb-000b-0000-0000-000000000002"), OrderIndex = 6, Latitude = -13.9022,  Longitude = 43.0655 },
                new EventLocation { Id = new Guid("bbbbbbbb-000c-0000-0000-000000000002"), OrderIndex = 7, Latitude = -8.384,    Longitude = 40.4002 },
            },
            Sources = new List<EventSource>
            {
                new EventSource
                {
                    Id = new Guid("bbbbbbbb-0010-0000-0000-000000000002"),
                    Title = "This Book Took Too Long",
                    ISBN = null,
                    Where = "Page 42",
                    PublicationLBYear = 2010,
                    PublicationLBMonth = 6,
                    PublicationUBYear = 2010,
                    PublicationUBMonth = 6,
                    Authors = new List<EventSourceAuthor>
                    {
                        new EventSourceAuthor { Id = new Guid("bbbbbbbb-0011-0000-0000-000000000002"), Name = "Author One" },
                        new EventSourceAuthor { Id = new Guid("bbbbbbbb-0012-0000-0000-000000000002"), Name = "Author Two" },
                    },
                },
            },
        };

        db.Events.AddRange(event1, event2);
        db.SaveChanges();
    }
}
