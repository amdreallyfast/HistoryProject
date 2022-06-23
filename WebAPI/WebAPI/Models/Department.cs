namespace WebAPI.Models
{
    public class Department
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public ICollection<Employee> Employees { get; set; }
    }

    public class CreateDepartmentDto
    {
        public int? Id { get; set; }
        public string Name { get; set; } = String.Empty;
    }
}
