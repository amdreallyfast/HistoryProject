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
        private readonly IWebHostEnvironment _webHostEnvironment;

        public EmployeeController(DataContext dataContext, IWebHostEnvironment webHostEnvironment)
        {
            _dataContext = dataContext;
            _webHostEnvironment = webHostEnvironment;
        }

        [Route("GetById/{id}")]
        [HttpGet]
        public async Task<ActionResult<EmployeeDto>> Get(int id)
        {
            var employee = await _dataContext.Employees
                .Where(x => x.Id == id)
                .Include(x => x.Department)
                .FirstOrDefaultAsync();
            if (employee == null)
            {
                return NotFound($"Unknown Employee ID: {id}");
            }

            var employeeDto = new EmployeeDto
            {
                Id = employee.Id,
                Name = employee.Name,
                DateOfJoining = employee.DateOfJoining,
                PhotoFileName = employee.PhotoFileName,
                DepartmentName = employee.Department.Name
            };
            return Ok(employeeDto);
        }

        [Route("GetAll")]
        [HttpGet]
        public async Task<ActionResult<List<EmployeeDto>>> GetAll()
        {
            var employees = await _dataContext.Employees
                .Include(x => x.Department)
                .ToListAsync();

            var employeeDtos = new List<EmployeeDto>();
            foreach (Employee employee in employees)
            {
                employeeDtos.Add(new EmployeeDto
                {
                    Id = employee.Id,
                    Name = employee.Name,
                    DateOfJoining = employee.DateOfJoining,
                    PhotoFileName = employee.PhotoFileName,
                    DepartmentName = employee.Department.Name
                });
            }
            return Ok(employeeDtos);
        }

        [Route("Create")]
        [HttpPost]
        public async Task<ActionResult<List<Employee>>> Create(EmployeeDto createEmployeeDto)
        {
            var existingDepartment = await _dataContext.Departments
                .FirstOrDefaultAsync(x => x.Name == createEmployeeDto.DepartmentName);
            if (existingDepartment == null)
            {
                return NotFound($"Unknown Department: {createEmployeeDto.DepartmentName}");
            }

            // Note: _dataContext.SaveChanges() will automatically create the new PK in this object.
            var newEmployee = new Employee
            {
                Name = createEmployeeDto.Name,
                DateOfJoining = createEmployeeDto.DateOfJoining,
                PhotoFileName = createEmployeeDto.PhotoFileName,
                Department = existingDepartment
            };

            _dataContext.Employees.Add(newEmployee);
            await _dataContext.SaveChangesAsync();
            return Ok(newEmployee);
        }

        [Route("Update")]
        [HttpPut]
        public async Task<ActionResult<Employee>> Update(EmployeeDto employeeDto)
        {
            var existingEmployee = await _dataContext.Employees
                .Where(x => x.Id == employeeDto.Id)
                .FirstOrDefaultAsync();
            if (existingEmployee == null)
            {
                return NotFound($"Unknown Employee ID: {employeeDto.Id}");
            }

            var existingDepartment = await _dataContext.Departments
                .FirstOrDefaultAsync(x => x.Name == employeeDto.DepartmentName);
            if (existingDepartment == null)
            {
                return NotFound($"Department: {employeeDto.DepartmentName}");
            }

            existingEmployee.Name = employeeDto.Name;
            existingEmployee.DateOfJoining = employeeDto.DateOfJoining;
            existingEmployee.PhotoFileName = employeeDto.PhotoFileName;
            existingEmployee.Department = existingDepartment;

            await _dataContext.SaveChangesAsync();
            return Ok(existingEmployee);
        }

        [Route("Delete/{id}")]
        [HttpDelete]
        public async Task<ActionResult> Delete(int id)
        {
            var existingEmployee = await _dataContext.Employees
                .Where(x => x.Id == id)
                .FirstOrDefaultAsync();
            if (existingEmployee == null)
            {
                return NotFound($"Unknown Employee ID: {id}");
            }

            _dataContext.Employees.Remove(existingEmployee);
            await _dataContext.SaveChangesAsync();
            return Ok("Delete success");
        }

        [Route("SaveFile")]
        [HttpPost]
        public async Task<ActionResult<string>> SaveFile(IFormFile file)
        {
            try
            {
                var newFilePath = Path.Combine(_webHostEnvironment.ContentRootPath, "Photos", file.FileName);
                Console.WriteLine("newFilePath: ", newFilePath);
                using (var stream = new FileStream(newFilePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                return Ok(newFilePath);
            }
            catch (Exception ex)
            {
                return ex.ToString();
            }
        }
    }
}
