using Microsoft.EntityFrameworkCore;

namespace WebAPI.Models
{
    public class HistoryProjectDbContext : DbContext
    {
        public HistoryProjectDbContext(DbContextOptions<HistoryProjectDbContext> options) : base(options)
        {

        }

        //public DbSet<MyTable> MyTable { get; set; }
    }
}
