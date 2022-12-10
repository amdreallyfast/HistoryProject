using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAPI.Models;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventController : ControllerBase
    {
        private readonly HistoryProjectDbContext dbContext;
        private readonly IWebHostEnvironment webHostEnvironment;

        public EventController(HistoryProjectDbContext dbContext, IWebHostEnvironment webHostEnvironment)
        {
            this.dbContext = dbContext;
            this.webHostEnvironment = webHostEnvironment;
        }

        [Route("GetById/{id}")]
        [HttpGet]
        public async Task<ActionResult<EventDto>> Get(int id)
        {
            var singleEvent = await dbContext.Events
                .Where(x => x.Id == id)
                // TODO: include all the foreign keys
                .FirstOrDefaultAsync();
            if (singleEvent == null)
            {
                return NotFound($"Unknown EventID: '{id}'");
            }

            var eventDto = new EventDto
            {
                Id = singleEvent.Id,
                Name = singleEvent.Name,
                ImageFilePath = singleEvent.ImageFilePath,
                Description = singleEvent.Description,
                LowerTimeBoundary = singleEvent.LowerTimeBoundary,
                UpperTimeBoundary = singleEvent.UpperTimeBoundary
            };
            return Ok(eventDto);
        }
    }
}
