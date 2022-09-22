namespace WebAPI.Models
{
    public class Event
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime LowerTimeBoundary { get; set; } = DateTime.Now;
        public DateTime UpperTimeBoundary { get; set; } = DateTime.MinValue;
    }
}
