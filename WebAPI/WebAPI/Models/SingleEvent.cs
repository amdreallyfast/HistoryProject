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
        [MaxLength(2048)]
        public string Summary { get; set; } = string.Empty;

        [Required]
        public EventTime LowerTimeBoundary { get; set; } = new EventTime();

        [Required]
        public EventTime UpperTimeBoundary { get; set; } = new EventTime();

        [Required]
        public Region Where { get; set; } = new Region();


        // TODO:
        //  implement IEquatable
        //      bool Equals(SingleEvent other)
        //      override bool Equals (object other)
        //          if (ReferenceEquals(null, other)) return false
        //          if (ReferenceEquals(this, other)) return true
        //          if (this.GetType() != other.GetType()) return false
        //          else return Equals(other as SingleEvent)
        //      override bool operator == (SingleEvent other)
        //          return Equals(other as SingleEvent)
        //      override bool operatoe != (SingleEvent other)
        //          return !Equals(other as SingleEvent)
        // TODO:
        //  override GetHashCode()
        // TODO:
        //  Create HashCodeBuilder
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
        public Guid? RevisionId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ImageFilePath { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;

        // TODO: ??will the SingleEventDto be able to construct a new EventTime object from the JSON DTO??
        public EventTime LowerTimeBoundary { get; set; } = new EventTime();

        public EventTime UpperTimeBoundary { get; set; } = new EventTime();
        public Region Where { get; set; } = new Region();

        public SingleEventDto()
        {
        }

        public SingleEventDto(SingleEvent singleEvent)
        {
            RevisionId = singleEvent.RevisionId;
            Title = singleEvent.Title;
            ImageFilePath = singleEvent.ImageFilePath;
            Summary = singleEvent.Summary;
            LowerTimeBoundary = singleEvent.LowerTimeBoundary;
            UpperTimeBoundary = singleEvent.UpperTimeBoundary;
            Where = singleEvent.Where;
        }
    }
}
