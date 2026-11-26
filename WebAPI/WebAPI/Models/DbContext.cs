using Microsoft.EntityFrameworkCore;

namespace WebAPI.Models
{
    public class HistoryProjectDbContext : DbContext
    {
        public HistoryProjectDbContext(DbContextOptions<HistoryProjectDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // An event is a chain of revisions keyed by (EventId, Revision), and several read
            // paths assume that pair is unique: GetSpecificRevision fetches exactly one row by it,
            // and both GetFirst100 and the frontend getLatestRevisions pick the MAX revision per
            // EventId. A duplicate pair makes "the revision" ambiguous and the latest-revision
            // choice arbitrary.
            //
            // HistoricalEventController.Create now assigns Revision itself (max + 1) rather than
            // trusting the client, which should make duplicates impossible. This index is the
            // difference between that being intended and it being enforced -- including against
            // a future second write path, or two concurrent Creates racing on the same max.
            modelBuilder.Entity<Event>()
                .HasIndex(e => new { e.EventId, e.Revision })
                .IsUnique();
        }

        // Note: The "!" will tell the compiler, "this isn't null, trust me", but it is not a
        // valid symbol in class member declarations, so we have to assign the member to
        // "default" so that EF's startup flow is not interrupted, and then add the "!" to say,
        // "this isn't null, trust me".
        public DbSet<Event> Events { get; set; } = default!;

        public DbSet<Tag> Tags { get; set; } = default!;

        public DbSet<EventImage> Images { get; set; } = default!;

        public DbSet<EventLocation> Locations { get; set; } = default!;

        public DbSet<EventSource> Sources { get; set; } = default!;

        public DbSet<EventSourceAuthor> SourceAuthors { get; set; } = default!;

        //public DbSet<EventTime> Times { get; set; } = default!;

        //public DbSet<EventTimeRange> EventTimeRanges { get; set; } = default!;

    }
}
