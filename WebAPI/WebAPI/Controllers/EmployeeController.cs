using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAPI.Models;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeeController : ControllerBase
    {
        private readonly DataContext _dataContext;

        public EmployeeController(DataContext dataContext)
        {
            _dataContext = dataContext;
        }

        [HttpGet]
        public async Task<ActionResult<List<Employee>>> Get(int employeeId)
        {
            var employees = await _dataContext.Employees
                .Where(x => x.Id == employeeId)
                .Include(x => x.Department)
                .ToListAsync();
            return employees;
        }

        [HttpPost]
        public async Task<ActionResult<List<Employee>>> Create(CreateEmployeeDto createEmployeeDto)
        {
            var department = await _dataContext.Departments
                .FirstOrDefaultAsync(x => x.Id == createEmployeeDto.DepartmentId);
            if (department == null)
            {
                return NotFound();
            }

            var newEmployee = new Employee
            {
                Name = createEmployeeDto.Name,
                DateOfJoining = createEmployeeDto.DateOfJoining,
                PhotoFileName = createEmployeeDto.PhotoFileName,
                Department = department
            };

            _dataContext.Employees.Add(newEmployee);
            await _dataContext.SaveChangesAsync();
            return await Get(newEmployee.Id);
        }
    }
}
