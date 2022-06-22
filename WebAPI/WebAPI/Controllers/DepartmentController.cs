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

        //[HttpGet]
        //public JsonResult Get()
        //{
        //    string query = @"
        //    select *
        //    from dbo.Department
        //    ";

        //    DataTable table = new DataTable();
        //    string sqlDataSource = _configuration.GetConnectionString("EmployeeAppConnectionStr");
        //    SqlDataReader sqlDataReader;

        //    //??simplify to single-line using statements? convert to Entity Framework??
        //    using (SqlConnection sqlConnection = new SqlConnection(sqlDataSource))
        //    {
        //        sqlConnection.Open();
        //        using (SqlCommand sqlCommand = new SqlCommand(query, sqlConnection))
        //        {
        //            sqlDataReader = sqlCommand.ExecuteReader();
        //            table.Load(sqlDataReader);
        //            sqlDataReader.Close();
        //            sqlConnection.Close();
        //        }
        //    }

        //    return new JsonResult(table);
        //}

        [HttpGet]
        public async Task<ActionResult<List<Department>>> Get(int departmentId)
        {
            var departments = await _dataContext.Departments
                .Where(x => x.Id == departmentId)
                .Include(x => x.Employees)
                .ToListAsync();
            return departments;
        }

        [HttpPost]
        public async Task<ActionResult<List<Department>>> Create(CreateDepartmentDto createDepartmentDto)
        {
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
