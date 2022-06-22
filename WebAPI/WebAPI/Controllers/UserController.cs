using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAPI.Models;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly DataContext _dataContext;

        public UserController(DataContext dataContext)
        {
            _dataContext = dataContext;
        }

        [HttpGet]
        public async Task<ActionResult<List<User>>> Get(int userId)
        {
            var characters = await _dataContext.Users
                .Where(x => x.Id == userId)
                .ToListAsync();

            return characters;
        }

        [HttpPost]
        public async Task<ActionResult<List<User>>> Create(User user)
        {
            _dataContext.Users.Add(user);
            await _dataContext.SaveChangesAsync();
            return await Get(user.Id);
        }
    }
}
