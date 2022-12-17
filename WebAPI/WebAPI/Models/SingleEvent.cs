using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    // TODO: Split all fields into their own models, then make the SingleEvent a place of foreign keys
    public class SingleEvent
    {
        // Represents a single revision of an event.
        [Key]
        public Guid RevisionId { get; set; }

        [Required]
        public DateTime RevisionDateTime { get; set; } = DateTime.Now;

        // Represents a unique event in history. May be associated with multiple revisions.
        // Note: Handle manually. When an event is created, there shall be a new EventId. When an
        // event is updated, the EventId shall remain the same.
        [Required]
        public Guid EventId { get; set; }

        [Required]
        [MaxLength(128)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(256)]
        public string ImageFilePath { get; set; } = string.Empty;

        [Required]
        [MaxLength(2056)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public EventTime LowerTimeBoundary { get; set; } = new EventTime();

        [Required]
        public EventTime UpperTimeBoundary { get; set; } = new EventTime();

        [Required]
        public Region Region { get; set; } = new Region();
    }

    // Used in place of DateTime so that it would be easier to pretty print historical dates and
    // only mention the dates and times when they are known.
    // Note: DateTime does not accept null or negative values for any part of it, but only 1s for
    // the minimum date and 0s for the minimum time. There may be edge case events that occur
    // around that time period, and I don't want to misrepresent the time.
    // Ex: Suppose an event occurred in ~1000BC. We don't know the month, much less the day and
    // the hour. The UI will need to parse this info and know to only print the year.
    // Ex: The Attack on Pearl Harbor occurred at a precisely recorded time. The UI will need to
    // be able to recognize this and print accordingly.
    public class EventTime
    {
        [Key]
        public Guid Id { get; set; }

        // Note: Leave "BC/AD" and "BCE/CE" for the UI and represent the year in the DB as "+/-".
        [Required]
        public int Year { get; set; } = -1337;
        public int? Month { get; set; }
        public int? Day { get; set; }
        public int? Hour { get; set; }
        public int? Min { get; set; }
    }

    public class Region
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public List<Location> Locations { get; set; } = new List<Location>();
    }

    public class Location
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public double Latitude { get; set; }

        [Required]
        public double Longitude { get; set; }
    }


    public class SingleEventDto
    {
        public Guid? Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ImageFilePath { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime LowerTimeBoundary { get; set; } = DateTime.Now;
        public DateTime UpperTimeBoundary { get; set; } = DateTime.MinValue;

        public SingleEventDto()
        {
        }

        public SingleEventDto(SingleEvent singleEvent)
        {
            Id = singleEvent.Id;
            Title = singleEvent.Title.Text;
            ImageFilePath = singleEvent.ImageFilePath;
            Description = singleEvent.Description;
            LowerTimeBoundary = singleEvent.LowerTimeBoundary;
            UpperTimeBoundary = singleEvent.UpperTimeBoundary;
        }
    }
}
