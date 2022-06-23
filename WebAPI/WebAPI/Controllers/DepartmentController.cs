using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Data.SqlClient;
using WebAPI.Models;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly DataContext _dataContext;

        public DepartmentController(IConfiguration configuration, DataContext dataContext)
        {
            _configuration = configuration;
            _dataContext = dataContext;
        }

        [Route("GetById")]
        [HttpGet]
        public async Task<ActionResult<Department>> Get(int departmentId)
        {
            var department = await _dataContext.Departments
                .Where(x => x.Id == departmentId)
                .Include(x => x.Employees)
                .FirstOrDefaultAsync();
            if (department == null)
            {
                return NotFound($"Unknown Department ID: {departmentId}");
            }
            return Ok(department);
        }

        [Route("GetAll")]
        [HttpGet]
        public async Task<ActionResult<List<Department>>> GetAll()
        {
            var departments = await _dataContext.Departments
                .ToListAsync();
            return departments;
        }

        [Route("Create")]
        [HttpPost]
        public async Task<ActionResult<List<Department>>> Create(CreateDepartmentDto createDepartmentDto)
        {
            // Note: _dataContext.SaveChanges() will automatically assign the new PK.
            var newDepartment = new Department
            {
                Name = createDepartmentDto.Name
            };

            _dataContext.Departments.Add(newDepartment);
            await _dataContext.SaveChangesAsync();
            return Ok(newDepartment);
        }

        [Route("Update")]
        [HttpPut]
        public async Task<ActionResult<List<Department>>> Update(int departmentId, CreateDepartmentDto createDepartmentDto)
        {
            var existingDepartment = await _dataContext.Departments
                .Where(x => x.Id == departmentId)
                .FirstOrDefaultAsync();
            if (existingDepartment == null)
            {
                return NotFound($"Unknown Department ID: {departmentId}");
            }

            existingDepartment.Name = createDepartmentDto.Name;

            await _dataContext.SaveChangesAsync();
            return Ok(existingDepartment);
        }

        [Route("Delete")]
        [HttpDelete]
        public async Task<ActionResult> Delete(int departmentId)
        {
            var existingDepartment = await _dataContext.Departments
                .Where(x => x.Id == departmentId)
                .FirstOrDefaultAsync();
            if (existingDepartment == null)
            {
                return NotFound($"Unknown Department ID: {departmentId}");
            }

            _dataContext.Departments.Remove(existingDepartment);
            await _dataContext.SaveChangesAsync();
            return Ok();
        }
    }
}
