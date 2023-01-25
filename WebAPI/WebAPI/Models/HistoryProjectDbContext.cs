using Microsoft.EntityFrameworkCore;

namespace WebAPI.Models
{
    public class HistoryProjectDbContext : DbContext
    {
        public HistoryProjectDbContext(DbContextOptions<HistoryProjectDbContext> options) : base(options)
        {
        }

        // Note: The "!" will tell the compiler, "this isn't null, trust me", but it is not a
        // valid symbol in class member declarations, so we have to assign the member to
        // "default" so that EF's startup flow is not interrupted, and then add the "!" to say,
        // "this isn't null, trust me".
        //public DbSet<HistoricalEvent> Events { get; set; } = default!;

        //public DbSet<EventSummary> Summaries { get; set; } = default!;

        //public DbSet<EventTime> TimeRanges { get; set; } = default!;

        //public DbSet<EventRegion> Regions { get; set; } = default!;
        public DbSet<HistoricalEvent2> Event2s { get; set; } = default!;

        public DbSet<EventLocation> Locations { get; set; } = default!;

        public DbSet<EventSource> Sources { get; set; }
    }
}
