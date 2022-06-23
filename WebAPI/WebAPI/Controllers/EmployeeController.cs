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

        [Route("GetById")]
        [HttpGet]
        public async Task<ActionResult<Employee>> Get(int employeeId)
        {
            var employee = await _dataContext.Employees
                .Where(x => x.Id == employeeId)
                .Include(x => x.Department)
                .FirstOrDefaultAsync();
            if (employee == null)
            {
                return NotFound($"Unknown Employee ID: {employeeId}");
            }
            return Ok(employee);
        }

        [Route("GetAll")]
        [HttpGet]
        public async Task<ActionResult<List<Employee>>> GetAll()
        {
            var employees = await _dataContext.Employees
                .ToListAsync();
            return employees;
        }

        [Route("Create")]
        [HttpPost]
        public async Task<ActionResult<List<Employee>>> Create(CreateEmployeeDto createEmployeeDto)
        {
            var existingDepartment = await _dataContext.Departments
                .FirstOrDefaultAsync(x => x.Id == createEmployeeDto.DepartmentId);
            if (existingDepartment == null)
            {
                return NotFound($"Unknown Department ID: {createEmployeeDto.DepartmentId}");
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
        public async Task<ActionResult<Employee>> Update(int employeeId, CreateEmployeeDto createEmployeeDto)
        {
            var existingEmployee = await _dataContext.Employees
                .Where(x => x.Id == employeeId)
                .FirstOrDefaultAsync();
            if (existingEmployee == null)
            {
                return NotFound($"Unknown Employee ID: {employeeId}");
            }

            var existingDepartment = await _dataContext.Departments
                .FirstOrDefaultAsync(x => x.Id == createEmployeeDto.DepartmentId);
            if (existingDepartment == null)
            {
                return NotFound($"Department ID: {createEmployeeDto.DepartmentId}");
            }

            existingEmployee.Name = createEmployeeDto.Name;
            existingEmployee.DateOfJoining = createEmployeeDto.DateOfJoining;
            existingEmployee.PhotoFileName = createEmployeeDto.PhotoFileName;
            existingEmployee.Department = existingDepartment;

            await _dataContext.SaveChangesAsync();
            return Ok(existingEmployee);
        }

        [Route("Delete")]
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
            return Ok();
        }

        [Route("SaveFile")]
        [HttpPost]
        public async Task<ActionResult<string>> SaveFile(IFormFile file)
        {
            try
            {
                //var thing = file.FileName;
                //var httpRequest = Request.Form;
                //var postedFile = httpRequest.Files[0];
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
