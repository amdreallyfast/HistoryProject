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

        [HttpGet]
        public async Task<ActionResult<List<Department>>> Get(int departmentId)
        {
            var departments = await _dataContext.Departments
                .Where(x => x.Id == departmentId)
                .Include(x => x.Employees)
                .ToListAsync();
            return departments;
        }

        [Route("GetAll")]
        [HttpGet]
        public async Task<ActionResult<List<Department>>> GetAll()
        {
            var departments = await _dataContext.Departments
                .ToListAsync();
            return departments;
        }

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
            return await Get(newDepartment.Id);
        }
    }
}
