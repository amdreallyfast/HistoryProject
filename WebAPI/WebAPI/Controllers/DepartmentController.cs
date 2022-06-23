using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using System.Data;
using System.Data.SqlClient;
using System.Runtime.InteropServices;
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
        public async Task<ActionResult<List<Department>>> Update(CreateDepartmentDto createDepartmentDto)
        {
            var existingDepartment = await _dataContext.Departments
                .Where(x => x.Id == createDepartmentDto.Id)
                .FirstOrDefaultAsync();
            if (existingDepartment == null)
            {
                return NotFound($"Unknown Department ID: {createDepartmentDto.Id}");
            }

            existingDepartment.Name = createDepartmentDto.Name;

            await _dataContext.SaveChangesAsync();
            return Ok(existingDepartment);
        }

        [Route("Delete/{id}")]
        [HttpDelete]
        public async Task<ActionResult> Delete(int id)
        {
            var existingDepartment = await _dataContext.Departments
                .Where(x => x.Id == id)
                .FirstOrDefaultAsync();
            if (existingDepartment == null)
            {
                return NotFound($"Unknown Department ID: {id}");
            }

            _dataContext.Departments.Remove(existingDepartment);
            await _dataContext.SaveChangesAsync();
            return Ok("Success");
        }
    }
}
