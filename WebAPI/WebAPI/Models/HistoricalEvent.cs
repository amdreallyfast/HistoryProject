using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;




// (done) TODO: get SingleEventDto compiling
// (done) TODO: get Create method compiling
// (done) TODO: get Get methods compiling
// (done) TODO: get Update method compiling
// (done) TODO: get Delete method compiling
// TODO: implement equals, operator overrides, and GetHashCode for all classes
// TODO: create database
//      in initial migration, insert "null" items (that is, all zeros/empty strings
// 1.Report errors during creation
// 2. Create
// 3. Get
// 4. Change "when" display based 
// 5. Add question-mark-hover-text above "where" section to explain what it does




namespace WebAPI.Models
{
    public class HistoricalEvent : IEquatable<HistoricalEvent>
    {
        // Represents a single revision of an event.
        [Key]
        public Guid RevisionId { get; set; }

        [Required]
        public DateTime RevisionDateTime { get; set; } = DateTime.Now;

        [Required]
        public string RevisionAuthor { get; set; } = string.Empty;

        // Represents a unique event in history. May be associated with multiple revisions.
        // Note: Handle manually. When an event is created, there shall be a new EventId. When an
        // event is updated, the EventId shall remain the same.
        [Required]
        public Guid EventId { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(128)]
        public string Title { get; set; } = string.Empty;

        // This is small enough to stay in a single revision.
        [Required]
        [MaxLength(256)]
        public string ImageFilePath { get; set; } = string.Empty;

        [Required]
        public EventSummary Summary { get; set; } = new EventSummary();

        [Required]
        public EventTime TimeRange { get; set; } = new EventTime();

        [Required]
        public EventRegion Region { get; set; } = new EventRegion();

        public HistoricalEvent()
        {

        }

        public HistoricalEvent(HistoricalEventDto eventDto)
        {
            RevisionId = eventDto.RevisionId;
            RevisionDateTime = eventDto.RevisionDateTime;
            RevisionAuthor = eventDto.RevisionAuthor;

            Title = eventDto.Title;
            ImageFilePath = eventDto.ImageFilePath;
            Summary.Text = eventDto.Summary;
            TimeRange = eventDto.TimeRange;
            Region = eventDto.Region;
        }

        public HistoricalEvent CreateUpdatedFromDto(HistoricalEventDto eventDto)
        {
            // Always preserve the EventId, which must remain constant across all revisions.
            // Everything else is subject to change.
            var newEvent = new HistoricalEvent
            {
                EventId = eventDto.EventId,
            };

            // Take these simple objects as-is.
            newEvent.RevisionDateTime = eventDto.RevisionDateTime;
            newEvent.RevisionAuthor = eventDto.RevisionAuthor;
            newEvent.Title = eventDto.Title;
            newEvent.ImageFilePath = eventDto.ImageFilePath;

            // If summary changed, create a new entry, else preserve the existing one.
            var summaryFromDto = new EventSummary
            {
                Text = eventDto.Summary,
            };
            newEvent.Summary = Summary == summaryFromDto ? Summary : summaryFromDto;

            // If time boundary changed, create a new entry, else preserve the existing one.
            var timeBoundaryFromDto = new EventTime(eventDto.TimeRange);
            newEvent.TimeRange = TimeRange == timeBoundaryFromDto ? TimeRange : timeBoundaryFromDto;

            // If region changed, create a new entry, else preserve the existing one.
            var regionFromDto = new EventRegion(eventDto.Region);
            newEvent.Region = Region == regionFromDto ? Region : regionFromDto;

            return newEvent;
        }

        public bool Equals(HistoricalEvent? other)
        {
            if (ReferenceEquals(this, other)) return true;
            if (other is null) return false;
            return Same(other);
        }

        public override bool Equals(object? other)
        {
            if (ReferenceEquals(this, other)) return true;
            if (other is null) return false;
            if (this.GetType() != other.GetType()) return false;

            // Note: If the object type is the same, then it can be guaranteed cast to this object
            // without risk of null.
            return Same((other as HistoricalEvent)!);
        }

        public static bool operator ==(HistoricalEvent? left, HistoricalEvent? right)
        {
            if (ReferenceEquals(left, right)) return true;
            if (left is null) return false;
            if (right is null) return false;
            return left.Same(right);
        }

        public static bool operator !=(HistoricalEvent? left, HistoricalEvent? right)
        {
            if (ReferenceEquals(left, right)) return false;
            if (left is null) return false;
            if (right is null) return false;
            return !left.Same(right);
        }

        private bool Same(HistoricalEvent other)
        {
            bool same = true;
            //same &= RevisionId == other.RevisionId;
            same &= RevisionDateTime == other.RevisionDateTime;
            same &= RevisionAuthor == other.RevisionAuthor;
            same &= Title == other.Title;
            same &= ImageFilePath == other.ImageFilePath;
            same &= Summary == other.Summary;
            same &= TimeRange == other.TimeRange;
            same &= Region == other.Region;

            return same;
        }

        public override int GetHashCode()
        {
            HashCode hash = new HashCode();
            hash.Add(RevisionId);
            hash.Add(RevisionDateTime);
            hash.Add(EventId);
            hash.Add(Title);
            hash.Add(ImageFilePath);
            hash.Add(Summary);
            hash.Add(TimeRange);
            hash.Add(Region);
            return hash.ToHashCode();
        }
    }

    // Testing
    //var event1 = new Event
    //{
    //    RevisionId = Guid.NewGuid(),
    //    RevisionDateTime = DateTime.Parse("12/19/1998 16:35:02"),
    //    EventId = Guid.NewGuid(),
    //    Title = "Title",
    //    ImageFilePath = "path/to/file",
    //    Summary = new EventSummary
    //    {
    //        Id = Guid.NewGuid(),
    //        Text = "event text"
    //    },
    //    LowerTimeBoundary = new EventTime
    //    {
    //        Year = 1977
    //    },
    //    UpperTimeBoundary = new EventTime
    //    {
    //        Year = 2022
    //    },
    //    Region = new EventRegion
    //    {
    //        Locations = new List<EventLocation> {
    //            new EventLocation { Latitude = 1.11, Longitude = 9.99 },
    //            new EventLocation { Latitude = 2.22, Longitude = 8.88 },
    //            new EventLocation { Latitude = 3.33, Longitude = 7.77 }
    //        }
    //    }
    //};

    //var event2 = new Event
    //{
    //    RevisionId = event1.RevisionId,
    //    RevisionDateTime = DateTime.Parse("12/19/1998 16:35:02"),
    //    EventId = event1.EventId,
    //    Title = "Title",
    //    ImageFilePath = "path/to/file",
    //    Summary = new EventSummary
    //    {
    //        Id = event1.Summary.Id,
    //        Text = "event text"
    //    },
    //    LowerTimeBoundary = new EventTime
    //    {
    //        Year = 1977
    //    },
    //    UpperTimeBoundary = new EventTime
    //    {
    //        Year = 2022
    //    },
    //    Region = new EventRegion
    //    {
    //        Locations = new List<EventLocation> {
    //            new EventLocation { Latitude = 1.11, Longitude = 9.99 },
    //            new EventLocation { Latitude = 2.22, Longitude = 8.88 },
    //            new EventLocation { Latitude = 3.33, Longitude = 7.77 }
    //        }
    //    }
    //};

    //Console.WriteLine("Event test:");
    //var e1 = event1;
    //var e2 = event1;
    //Console.WriteLine($"    same reference:");
    //Console.WriteLine($"        e1.Equals(e2): '${e1.Equals(e2)}'");
    //Console.WriteLine($"        e1 == e2: '${e1 == e2}'");
    //Console.WriteLine($"        e1.GetHashCode() == e2.GetHashCode(): '${e1.GetHashCode() == e2.GetHashCode()}'");

    //e2 = event2;
    //Console.WriteLine($"    different reference, same values:");
    //Console.WriteLine($"        e1.Equals(e2): '${e1.Equals(e2)}'");
    //Console.WriteLine($"        e1 == e2: '${e1 == e2}'");
    //Console.WriteLine($"        e1.GetHashCode() == e2.GetHashCode(): '${e1.GetHashCode() == e2.GetHashCode()}'");

    ////e2.UpperTimeBoundary.Min = 37;
    //e2.Region.Locations.Add(new EventLocation { Latitude = 4.44, Longitude = 6.66 });
    //Console.WriteLine($"    different reference, different values:");
    //Console.WriteLine($"        e1.Equals(e2): '${e1.Equals(e2)}'");
    //Console.WriteLine($"        e1 == e2: '${e1 == e2}'");
    //Console.WriteLine($"        e1.GetHashCode() == e2.GetHashCode(): '${e1.GetHashCode() == e2.GetHashCode()}'");
    //Console.WriteLine("");


    public class HistoricalEventDto
    {
        public Guid RevisionId { get; set; }
        public DateTime RevisionDateTime { get; set; }
        public string RevisionAuthor { get; set; } = string.Empty;
        public Guid EventId { get; set; }

        public string Title { get; set; } = string.Empty;
        public string ImageFilePath { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public EventTime TimeRange { get; set; } = new EventTime();
        public EventRegion Region { get; set; } = new EventRegion();

        public HistoricalEventDto()
        {
        }

        public HistoricalEventDto(HistoricalEvent historicalEvent)
        {
            RevisionId = historicalEvent.RevisionId;
            RevisionDateTime = historicalEvent.RevisionDateTime;
            RevisionAuthor = historicalEvent.RevisionAuthor;
            EventId = historicalEvent.EventId;

            Title = historicalEvent.Title;
            ImageFilePath = historicalEvent.ImageFilePath;
            Summary = historicalEvent.Summary.Text;
            TimeRange = historicalEvent.TimeRange;
            Region = historicalEvent.Region;
        }
    }
}
