namespace WebAPI.Models
{
    // TODO: Split all fields into their own models, then make the SingleEvent a place of foreign keys
    public class SingleEvent
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ImageFilePath { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime LowerTimeBoundary { get; set; } = DateTime.Now;
        public DateTime UpperTimeBoundary { get; set; } = DateTime.MinValue;
    }

    public class SingleEventDto
    {
        public int? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ImageFilePath { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime LowerTimeBoundary { get; set; } = DateTime.Now;
        public DateTime UpperTimeBoundary { get; set; } = DateTime.MinValue;
    }
}
