using Newtonsoft.Json;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using WebAPI.ModelDTOs;
using static System.Net.Mime.MediaTypeNames;

namespace WebAPI.Models
{
    public class Event // : IEquatable<Event>
    {
        [Key]
        public Guid Id { get; set; }

        // Shared between all revisions
        [Required]
        public Guid EventId { get; set; }

        [Required]
        public int Revision { get; set; } = 1;

        [Required]
        public DateTime RevisionDateTime { get; set; } = DateTime.Now;

        [Required, MaxLength(64)]
        public string RevisionAuthor { get; set; } = default!;

        [Required, MaxLength(128)]
        public string Title { get; set; } = default!;

        [Required]
        public EventImage? EventImage { get; set; }

        [Required]
        public List<Tag> Tags { get; set; } = default!;

        [Required, MaxLength(2048)]
        public string Summary { get; set; } = default!;

        public int LBYear { get; set; } = -99999; // default value ridiculous
        public int? LBMonth { get; set; }
        public int? LBDay { get; set; }
        public int? LBHour { get; set; }
        public int? LBMin { get; set; }

        public int UBYear { get; set; } = +99999; // default value ridiculous
        public int? UBMonth { get; set; }
        public int? UBDay { get; set; }
        public int? UBHour { get; set; }
        public int? UBMin { get; set; }

        // Depending on the accuracy of the source, we can get either a specific location or a region, or possibly both, but we need at least one.
        // TODO:
        //  Enforce use of at least one location.
        [AllowNull]
        public EventLocation? SpecificLocation { get; set; }

        [AllowNull]
        public List<EventLocation>? Region { get; set; }

        [Required]
        public List<EventSource> Sources { get; set; } = default!;

        //public Event()
        //{
        //}

        //public Event(Event other)
        //{
        //    Id = other.Id;
        //    EventId = other.EventId;
        //    Revision = other.Revision;
        //    RevisionDateTime = other.RevisionDateTime;
        //    RevisionAuthor = other.RevisionAuthor;

        //    // Same values, different reference so that editing one object's list doesn't affect another.
        //    Tags = new List<Tag>(other.Tags);

        //    Title = other.Title;
        //    EventImage = other.EventImage;
        //    Summary = other.Summary;
        //    LBYear = other.LBYear;
        //    LBMonth = other.LBMonth;
        //    LBDay = other.LBDay;
        //    LBHour = other.LBHour;
        //    LBMin = other.LBMin;
        //    UBYear = other.UBYear;
        //    UBMonth = other.UBMonth;
        //    UBDay = other.UBDay;
        //    UBHour = other.UBHour;
        //    UBMin = other.UBMin;
        //    SpecificLocation = other.SpecificLocation;

        //    Region = new List<EventLocation>(other.Region);
        //    Sources = new List<EventSource>(other.Sources);
        //}

        ////public EventDto ToDto()
        ////{
        ////    return new EventDto(this);
        ////}

        ////public static Event FromDto(EventDto eventDto)
        ////{
        ////    throw new NotImplementedException();
        ////}

        //public bool Equals(Event? other)
        //{
        //    if (ReferenceEquals(this, other)) return true;
        //    if (other is null) return false;
        //    return Same(other);
        //}

        //public override bool Equals(object? other)
        //{
        //    if (ReferenceEquals(this, other)) return true;
        //    if (other is null) return false;
        //    if (this.GetType() != other.GetType()) return false;
        //    return Same((other as Event)!);
        //}

        //public static bool operator ==(Event? left, Event? right)
        //{
        //    if (ReferenceEquals(left, right)) return true;
        //    if (left is null) return false;
        //    if (right is null) return false;
        //    return left.Same(right);
        //}

        //public static bool operator !=(Event? left, Event? right)
        //{
        //    if (ReferenceEquals(left, right)) return false;
        //    if (left is null) return false;
        //    if (right is null) return false;
        //    return !left.Same(right);
        //}

        //public override int GetHashCode()
        //{
        //    HashCode hash = new();
        //    hash.Add(Id);
        //    hash.Add(EventId);
        //    hash.Add(Revision);
        //    hash.Add(RevisionDateTime);
        //    hash.Add(RevisionAuthor);
        //    if (Tags != null) hash.Add(Tags.GetHashCode());         // only same on reference equals
        //    hash.Add(Tags);
        //    hash.Add(Title);
        //    hash.Add(EventImage?.GetHashCode());
        //    hash.Add(Summary);
        //    hash.Add(LBYear);
        //    hash.Add(LBMonth);
        //    hash.Add(LBDay);
        //    hash.Add(LBHour);
        //    hash.Add(LBMin);
        //    hash.Add(UBYear);
        //    hash.Add(UBMonth);
        //    hash.Add(UBDay);
        //    hash.Add(UBHour);
        //    hash.Add(UBMin);
        //    hash.Add(SpecificLocation);
        //    if (Region != null) hash.Add(Region.GetHashCode());     // only same on reference equals
        //    if (Sources != null) hash.Add(Sources.GetHashCode());   // only same on reference equals

        //    return hash.ToHashCode();
        //}

        //private bool Same(Event other)
        //{
        //    bool same = true;
        //    same &= Id == other.Id;
        //    same &= EventId == other.EventId;
        //    same &= Revision == other.Revision;
        //    same &= RevisionDateTime == other.RevisionDateTime;
        //    same &= RevisionAuthor == other.RevisionAuthor;

        //    // Deep compare Tags
        //    //??necessary??
        //    var thisTagValues = Tags.Select(x => x.Value);
        //    var otherTagValues = other.Tags.Select(x => x.Value);
        //    var inThisButNotOther = thisTagValues.Except(otherTagValues).ToList();
        //    var inOtherButNotThis = otherTagValues.Except(thisTagValues).ToList();
        //    same &= (!inThisButNotOther.Any() && !inOtherButNotThis.Any());

        //    same &= Title == other.Title;
        //    same &= EventImage == other.EventImage;
        //    same &= Summary == other.Summary;
        //    same &= LBYear == other.LBYear;
        //    same &= LBMonth == other.LBMonth;
        //    same &= LBDay == other.LBDay;
        //    same &= LBHour == other.LBHour;
        //    same &= LBMin == other.LBMin;
        //    same &= UBYear == other.UBYear;
        //    same &= UBMonth == other.UBMonth;
        //    same &= UBDay == other.UBDay;
        //    same &= UBHour == other.UBHour;
        //    same &= UBMin == other.UBMin;
        //    same &= SpecificLocation == other.SpecificLocation;
        //    same &= Region == other.Region;     // only same on reference equals
        //    same &= Sources == other.Sources;   // only same on reference equals
        //    return same;
        //}
    }

    //public class HistoricalEvent : IEquatable<HistoricalEvent>
    //{
    //    // Represents a single revision of an event.
    //    [Key]
    //    public Guid RevisionId { get; set; }

    //    [Required]
    //    public DateTime RevisionDateTime { get; set; } = DateTime.Now;

    //    [Required]
    //    public string RevisionAuthor { get; set; } = string.Empty;

    //    // Represents a unique event in history. May be associated with multiple revisions.
    //    // Note: Handle manually. When an event is created, there shall be a new EventId. When an
    //    // event is updated, the EventId shall remain the same.
    //    [Required]
    //    public Guid EventId { get; set; } = Guid.NewGuid();

    //    [Required]
    //    [MaxLength(128)]
    //    public string Title { get; set; } = string.Empty;

    //    // This is small enough to stay in a single revision.
    //    [Required]
    //    [MaxLength(256)]
    //    public string ImageFilePath { get; set; } = string.Empty;

    //    [Required]
    //    public EventSummary Summary { get; set; } = new EventSummary();

    //    [Required]
    //    public EventTime TimeRange { get; set; } = new EventTime();

    //    [Required]
    //    public EventRegion Region { get; set; } = new EventRegion();

    //    public HistoricalEvent()
    //    {

    //    }

    //    public HistoricalEvent(HistoricalEventDto eventDto)
    //    {
    //        RevisionId = eventDto.RevisionId;
    //        RevisionDateTime = eventDto.RevisionDateTime;
    //        RevisionAuthor = eventDto.RevisionAuthor;

    //        Title = eventDto.Title;
    //        ImageFilePath = eventDto.ImageFilePath;
    //        Summary.Text = eventDto.Summary;
    //        TimeRange = eventDto.TimeRange;
    //        Region = eventDto.Region;
    //    }

    //    public HistoricalEvent CreateUpdatedFromDto(HistoricalEventDto eventDto)
    //    {
    //        // Always preserve the EventId, which must remain constant across all revisions.
    //        // Everything else is subject to change.
    //        var newEvent = new HistoricalEvent
    //        {
    //            EventId = eventDto.EventId,
    //        };

    //        // Take these simple objects as-is.
    //        newEvent.RevisionDateTime = eventDto.RevisionDateTime;
    //        newEvent.RevisionAuthor = eventDto.RevisionAuthor;
    //        newEvent.Title = eventDto.Title;
    //        newEvent.ImageFilePath = eventDto.ImageFilePath;

    //        // If summary changed, create a new entry, else preserve the existing one.
    //        var summaryFromDto = new EventSummary
    //        {
    //            Text = eventDto.Summary,
    //        };
    //        newEvent.Summary = Summary == summaryFromDto ? Summary : summaryFromDto;

    //        // If time boundary changed, create a new entry, else preserve the existing one.
    //        var timeBoundaryFromDto = new EventTime(eventDto.TimeRange);
    //        newEvent.TimeRange = TimeRange == timeBoundaryFromDto ? TimeRange : timeBoundaryFromDto;

    //        // If region changed, create a new entry, else preserve the existing one.
    //        var regionFromDto = new EventRegion(eventDto.Region);
    //        newEvent.Region = Region == regionFromDto ? Region : regionFromDto;

    //        return newEvent;
    //    }

    //    public bool Equals(HistoricalEvent? other)
    //    {
    //        if (ReferenceEquals(this, other)) return true;
    //        if (other is null) return false;
    //        return Same(other);
    //    }

    //    public override bool Equals(object? other)
    //    {
    //        if (ReferenceEquals(this, other)) return true;
    //        if (other is null) return false;
    //        if (this.GetType() != other.GetType()) return false;

    //        // Note: If the object type is the same, then it can be guaranteed cast to this object
    //        // without risk of null.
    //        return Same((other as HistoricalEvent)!);
    //    }

    //    public static bool operator ==(HistoricalEvent? left, HistoricalEvent? right)
    //    {
    //        if (ReferenceEquals(left, right)) return true;
    //        if (left is null) return false;
    //        if (right is null) return false;
    //        return left.Same(right);
    //    }

    //    public static bool operator !=(HistoricalEvent? left, HistoricalEvent? right)
    //    {
    //        if (ReferenceEquals(left, right)) return false;
    //        if (left is null) return false;
    //        if (right is null) return false;
    //        return !left.Same(right);
    //    }

    //    private bool Same(HistoricalEvent other)
    //    {
    //        bool same = true;
    //        //same &= RevisionId == other.RevisionId;
    //        same &= RevisionDateTime == other.RevisionDateTime;
    //        same &= RevisionAuthor == other.RevisionAuthor;
    //        same &= Title == other.Title;
    //        same &= ImageFilePath == other.ImageFilePath;
    //        same &= Summary == other.Summary;
    //        same &= TimeRange == other.TimeRange;
    //        same &= Region == other.Region;

    //        return same;
    //    }

    //    public override int GetHashCode()
    //    {
    //        HashCode hash = new HashCode();
    //        hash.Add(RevisionId);
    //        hash.Add(RevisionDateTime);
    //        hash.Add(EventId);
    //        hash.Add(Title);
    //        hash.Add(ImageFilePath);
    //        hash.Add(Summary);
    //        hash.Add(TimeRange);
    //        hash.Add(Region);
    //        return hash.ToHashCode();
    //    }
    //}

    //// TODO: move testing to a unit testing project
    ////  https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-with-mstest

    //// Testing
    ////var event1 = new Event
    ////{
    ////    RevisionId = Guid.NewGuid(),
    ////    RevisionDateTime = DateTime.Parse("12/19/1998 16:35:02"),
    ////    EventId = Guid.NewGuid(),
    ////    Title = "Title",
    ////    ImageFilePath = "path/to/file",
    ////    Summary = new EventSummary
    ////    {
    ////        Id = Guid.NewGuid(),
    ////        Text = "event text"
    ////    },
    ////    LowerTimeBoundary = new EventTime
    ////    {
    ////        Year = 1977
    ////    },
    ////    UpperTimeBoundary = new EventTime
    ////    {
    ////        Year = 2022
    ////    },
    ////    Region = new EventRegion
    ////    {
    ////        Locations = new List<EventLocation> {
    ////            new EventLocation { Latitude = 1.11, Longitude = 9.99 },
    ////            new EventLocation { Latitude = 2.22, Longitude = 8.88 },
    ////            new EventLocation { Latitude = 3.33, Longitude = 7.77 }
    ////        }
    ////    }
    ////};

    ////var event2 = new Event
    ////{
    ////    RevisionId = event1.RevisionId,
    ////    RevisionDateTime = DateTime.Parse("12/19/1998 16:35:02"),
    ////    EventId = event1.EventId,
    ////    Title = "Title",
    ////    ImageFilePath = "path/to/file",
    ////    Summary = new EventSummary
    ////    {
    ////        Id = event1.Summary.Id,
    ////        Text = "event text"
    ////    },
    ////    LowerTimeBoundary = new EventTime
    ////    {
    ////        Year = 1977
    ////    },
    ////    UpperTimeBoundary = new EventTime
    ////    {
    ////        Year = 2022
    ////    },
    ////    Region = new EventRegion
    ////    {
    ////        Locations = new List<EventLocation> {
    ////            new EventLocation { Latitude = 1.11, Longitude = 9.99 },
    ////            new EventLocation { Latitude = 2.22, Longitude = 8.88 },
    ////            new EventLocation { Latitude = 3.33, Longitude = 7.77 }
    ////        }
    ////    }
    ////};

    ////Console.WriteLine("Event test:");
    ////var e1 = event1;
    ////var e2 = event1;
    ////Console.WriteLine($"    same reference:");
    ////Console.WriteLine($"        e1.Equals(e2): '${e1.Equals(e2)}'");
    ////Console.WriteLine($"        e1 == e2: '${e1 == e2}'");
    ////Console.WriteLine($"        e1.GetHashCode() == e2.GetHashCode(): '${e1.GetHashCode() == e2.GetHashCode()}'");

    ////e2 = event2;
    ////Console.WriteLine($"    different reference, same values:");
    ////Console.WriteLine($"        e1.Equals(e2): '${e1.Equals(e2)}'");
    ////Console.WriteLine($"        e1 == e2: '${e1 == e2}'");
    ////Console.WriteLine($"        e1.GetHashCode() == e2.GetHashCode(): '${e1.GetHashCode() == e2.GetHashCode()}'");

    //////e2.UpperTimeBoundary.Min = 37;
    ////e2.Region.Locations.Add(new EventLocation { Latitude = 4.44, Longitude = 6.66 });
    ////Console.WriteLine($"    different reference, different values:");
    ////Console.WriteLine($"        e1.Equals(e2): '${e1.Equals(e2)}'");
    ////Console.WriteLine($"        e1 == e2: '${e1 == e2}'");
    ////Console.WriteLine($"        e1.GetHashCode() == e2.GetHashCode(): '${e1.GetHashCode() == e2.GetHashCode()}'");
    ////Console.WriteLine("");


    //public class HistoricalEventDto
    //{
    //    // TODO: remove RevisionId from the DTO. Do not expose that so that network sniffers can't get their hands on PKs and...do whatever it is that sneaky hackers can do when they get their hands on such info
    //    public Guid RevisionId { get; set; }
    //    public DateTime RevisionDateTime { get; set; }
    //    public string RevisionAuthor { get; set; } = string.Empty;
    //    public Guid EventId { get; set; }

    //    public string Title { get; set; } = string.Empty;
    //    public string ImageFilePath { get; set; } = string.Empty;
    //    public string Summary { get; set; } = string.Empty;
    //    public EventTime TimeRange { get; set; } = new EventTime();
    //    public EventRegion Region { get; set; } = new EventRegion();

    //    public HistoricalEventDto()
    //    {
    //    }

    //    public HistoricalEventDto(HistoricalEvent historicalEvent)
    //    {
    //        RevisionId = historicalEvent.RevisionId;
    //        RevisionDateTime = historicalEvent.RevisionDateTime;
    //        RevisionAuthor = historicalEvent.RevisionAuthor;
    //        EventId = historicalEvent.EventId;

    //        Title = historicalEvent.Title;
    //        ImageFilePath = historicalEvent.ImageFilePath;
    //        Summary = historicalEvent.Summary.Text;
    //        TimeRange = historicalEvent.TimeRange;
    //        Region = historicalEvent.Region;
    //    }
    //}
}
