namespace WebAPI.Models
{
    // TODO: Split all fields into their own models, then make the Event a place of foreign keys
    public class Event
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime LowerTimeBoundary { get; set; } = DateTime.Now;
        public DateTime UpperTimeBoundary { get; set; } = DateTime.MinValue;
    }

    public class EventDto
    {
        public int? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ImageFilePath { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime LowerTimeBoundary { get; set; } = DateTime.Now;
        public DateTime UpperTimeBoundary { get; set; } = DateTime.MinValue;
    }
}
