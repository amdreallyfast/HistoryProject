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
        public async Task<ActionResult<Employee>> Get(int id)
        {
            // TODO: convert to DTO. We want to display the Department name, and that means getting it from the Department object, but ReactJS really does not like the Department object's embeded "Employees" object. Maybe the JSON isn't typical or something? Whatever the case, creating the Employee DTO and see if that helps.
            var employee = await _dataContext.Employees
                .Where(x => x.Id == id)
                .Include(x => x.Department)
                .FirstOrDefaultAsync();
            if (employee == null)
            {
                return NotFound($"Unknown Employee ID: {id}");
            }
            return Ok(employee);
        }

        [Route("GetAll")]
        [HttpGet]
        public async Task<ActionResult<List<Employee>>> GetAll()
        {
            var employees = await _dataContext.Employees
                .Include(x => x.Department)
                .ToListAsync();
            return employees;
        }

        [Route("Create")]
        [HttpPost]
        public async Task<ActionResult<List<Employee>>> Create(CreateEmployeeDto createEmployeeDto)
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
        public async Task<ActionResult<Employee>> Update(CreateEmployeeDto createEmployeeDto)
        {
            var existingEmployee = await _dataContext.Employees
                .Where(x => x.Id == createEmployeeDto.Id)
                .FirstOrDefaultAsync();
            if (existingEmployee == null)
            {
                return NotFound($"Unknown Employee ID: {createEmployeeDto.Id}");
            }

            var existingDepartment = await _dataContext.Departments
                .FirstOrDefaultAsync(x => x.Name == createEmployeeDto.DepartmentName);
            if (existingDepartment == null)
            {
                return NotFound($"Department: {createEmployeeDto.DepartmentName}");
            }

            existingEmployee.Name = createEmployeeDto.Name;
            existingEmployee.DateOfJoining = createEmployeeDto.DateOfJoining;
            existingEmployee.PhotoFileName = createEmployeeDto.PhotoFileName;
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
