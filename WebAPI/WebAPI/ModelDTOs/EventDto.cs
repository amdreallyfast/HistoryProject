using System.ComponentModel.DataAnnotations;
using WebAPI.Models;

namespace WebAPI.ModelDTOs
{
    // "DTO" == "Data Transfer Object", a lightweight object for easy conversion to JSON and
    // passing to the website without exposing sensitive database info like PKs.
    public class EventDto
    {
        public Guid EventId { get; set; }
        public string RevisionAuthor { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new List<string>();
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;

        // EventTimeRange.LowerBound
        public int LBYear { get; set; } = -99999; // default value ridiculous
        public int? LBMonth { get; set; }
        public int? LBDay { get; set; }
        public int? LBHour { get; set; }
        public int? LBMin { get; set; }

        // EventTimeRange.LowerBound
        public int UBYear { get; set; } = -99999; // default value ridiculous
        public int? UBMonth { get; set; }
        public int? UBDay { get; set; }
        public int? UBHour { get; set; }
        public int? UBMin { get; set; }

        public byte[]? ImageBinary { get; set; } = Array.Empty<byte>();
        public EventLocation? SpecificLocation { get; set; }
        public List<EventLocation>? Region { get; set; } = new List<EventLocation>();
        public List<string> Sources { get; set; } = new List<string>();

        public EventDto(Event e)
        {
            EventId = e.EventId;
            RevisionAuthor = e.RevisionAuthor;
            Tags = e.Tags;
            Title = e.Title;
            Summary = e.Summary;
            EventTimeRange = 


            ImageBinary = e.EventImage?.ImageBinary;
            SpecificLocation = e.SpecificLocation;
            Region = e.Region;
            Sources = e.Sources;
        }

        public Event ToEvent()
        {
            return new Event
            {
                EventId = EventId,
                RevisionDateTime = DateTime.UtcNow,
                RevisionAuthor = RevisionAuthor,
                Tags = Tags,
                Title = Title,
                //Image
                Summary = Summary,
                SpecificLocation = SpecificLocation,
                Region = Region,
                Sources = Sources
            };


        }
    }
}
