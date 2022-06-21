using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Data.SqlClient;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        public DepartmentController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet]
        public JsonResult Get()
        {
            string query = @"
            select *
            from dbo.Department
            ";

            DataTable table = new DataTable();
            string sqlDataSource = _configuration.GetConnectionString("EmployeeAppConnectionStr");
            SqlDataReader sqlDataReader;

            //??simplify to single-line using statements? convert to Entity Framework??
            using (SqlConnection sqlConnection = new SqlConnection(sqlDataSource))
            {
                sqlConnection.Open();
                using (SqlCommand sqlCommand = new SqlCommand(query, sqlConnection))
                {
                    sqlDataReader = sqlCommand.ExecuteReader();
                    table.Load(sqlDataReader);
                    sqlDataReader.Close();
                    sqlConnection.Close();
                }
            }

            return new JsonResult(table);
        }
    }
}
