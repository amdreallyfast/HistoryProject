using System.ComponentModel.DataAnnotations;
using System.Security.AccessControl;

namespace WebAPI.Models
{
    public class Employee
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime DateOfJoining { get; set; }
        public string PhotoFileName { get; set; } = string.Empty;

        //??how do I make this a required foreign key without the null error??
        public Department Department { get; set; }
        public int DepartmentId { get; set; }
    }

    public class CreateEmployeeDto
    {
        public int? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime DateOfJoining { get; set; }
        public string PhotoFileName { get; set; } = string.Empty;
        public int DepartmentId { get; set; }
    }
}
