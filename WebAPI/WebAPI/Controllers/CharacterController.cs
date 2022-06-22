using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAPI.Models;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CharacterController : ControllerBase
    {
        private readonly DataContext _dataContext;

        public CharacterController(DataContext dataContext)
        {
            _dataContext = dataContext;
        }

        [HttpGet]
        public async Task<ActionResult<List<Character>>> Get(int characterId)
        {
            var characters = await _dataContext.Characters
                .Where(c => c.Id == characterId)
                .Include(c => c.Weapon)
                .ToListAsync();
            
            return characters;
        }

        [HttpPost]
        public async Task<ActionResult<List<Character>>> Create (CreateCharacterDto character)
        {
            // Look up the associated user object just to make sure that EF links it correctly.
            var user = await _dataContext.Users.FindAsync(character.UserId);
            if (user == null)
            {
                return NotFound();
            }

            var newCharacter = new Character
            {
                Name = character.Name,
                RpgClass = character.RpgClass,
                User = user
            };

            _dataContext.Characters.Add(newCharacter);
            await _dataContext.SaveChangesAsync();
            return await Get(character.UserId);
        }
    }
}
