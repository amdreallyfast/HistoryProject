using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata.Ecma335;

namespace WebAPI.Models
{
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions<DataContext> options) : base(options)
        {

        }

        public DbSet<Department> Departments { get; set; }
        public DbSet<Employee> Employees { get; set; }

        // Package Manager Console:
        //  Add-Migration AddUsersTable
        //  Update-Database
        public DbSet<User> Users { get; set; }
        public DbSet<Character> Characters { get; set; }
        public DbSet<Weapon> Weapons { get; set; }
    }
}
