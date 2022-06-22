using System.ComponentModel.DataAnnotations;
using System.Security.AccessControl;

namespace WebAPI.Models
{
    public class Employee
    {
        public int EmployeeId { get; set; }

        public string EmployeeName { get; set; } = string.Empty;

        //private Department? _department;
        //[Required]
        //public Department Department {
        //    get => _department ?? throw new InvalidOperationException("Uninitialized property: " + nameof(Department));
        //    set => _department = value;
        //}
        //??how do I make this a required foreign key without the null error??
        public Department? Department { get; set; }

        public DateTime DateOfJoining { get; set; }

        public string PhotoFileName { get; set; } = string.Empty;
    }
}
