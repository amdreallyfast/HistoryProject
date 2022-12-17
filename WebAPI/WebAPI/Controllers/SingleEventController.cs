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
        public async Task<ActionResult<SingleEventDto>> Get(Guid id)
        {
            var singleEvent = await dbContext.Events
                .Where(x => x.Id == id)
                // TODO: include all the foreign keys
                .FirstOrDefaultAsync();
            if (singleEvent == null)
            {
                return NotFound($"Unknown EventID: '{id}'");
            }

            var singleEventDto = new SingleEventDto
            {
                Id = singleEvent.Id,
                Title = singleEvent.Title,
                ImageFilePath = singleEvent.ImageFilePath,
                Description = singleEvent.Description,
                LowerTimeBoundary = singleEvent.LowerTimeBoundary,
                UpperTimeBoundary = singleEvent.UpperTimeBoundary
            };
            return Ok(singleEventDto);
        }

        [Route("GetAll")]
        [HttpGet]
        public async Task<ActionResult<List<SingleEventDto>>> GetAll()
        {
            var singleEvents = await dbContext.Events
                .ToListAsync();

            var singleEventDtos = new List<SingleEventDto>();
            foreach (SingleEvent singleEvent in singleEvents)
            {
                singleEventDtos.Add(new SingleEventDto
                {
                    Id = singleEvent.Id,
                    Title = singleEvent.Title,
                    ImageFilePath = singleEvent.ImageFilePath,
                    Description = singleEvent.Description,
                    LowerTimeBoundary = singleEvent.LowerTimeBoundary,
                    UpperTimeBoundary = singleEvent.UpperTimeBoundary
                });
            }
            return Ok(singleEventDtos);
        }

        [Route("Create")]
        [HttpPost]
        public async Task<ActionResult<SingleEventDto>> Create(SingleEventDto singleEventDto)
        {
            // TODO: look up FK items

            // TODO: ??forbid entries with the same title??
            //var existingEvent = dbContext.Events
            //    .Where(x => x.Title == singleEventDto.Title)
            //    .Where(x => x.ImageFilePath == singleEventDto.ImageFilePath)
            //    .Where(x => x.Description == singleEventDto.Description)

            //if (existingEvent != null)
            //{
            //    return BadRequest("Already have an event with the same title.");
            //}

            //existingEvent = dbContext.Events.Where(x => x.Description == singleEventDto.Description);
            //if (existingEvent != null)
            //{
            //    return BadRequest($"Event already exists with the exact same description")
            //}

            var newSingleEvent = new SingleEvent
            {
                Id = Guid.NewGuid(),
                Title = singleEventDto.Title,
                ImageFilePath = singleEventDto.ImageFilePath,
                Description = singleEventDto.Description,
                LowerTimeBoundary = singleEventDto.LowerTimeBoundary,
                UpperTimeBoundary = singleEventDto.UpperTimeBoundary
            };
            dbContext.Events.Add(newSingleEvent);
            await dbContext.SaveChangesAsync();
            return Ok(newSingleEvent);
        }

        [Route("Update")]
        [HttpPut]
        public async Task<ActionResult<SingleEventDto>> Update(SingleEventDto singleEventDto)
        {
            var existing = await dbContext.Events
                .Where(x => x.Id == singleEventDto.Id)
                .FirstOrDefaultAsync();
            if (existing == null)
            {
                return NotFound($"Unknown event ID: '{singleEventDto.Id}'");
            }

            // TODO: check foreign keys

            existing.Title = singleEventDto.Title;
            existing.ImageFilePath = singleEventDto.ImageFilePath;
            existing.Description = singleEventDto.Description;
            existing.LowerTimeBoundary = singleEventDto.LowerTimeBoundary;
            existing.UpperTimeBoundary = singleEventDto.UpperTimeBoundary;
            dbContext.Events.Add(existing);
            await dbContext.SaveChangesAsync();
            return Ok(singleEventDto);
        }

        [Route("Delete/{id}")]
        [HttpDelete]
        public async Task<ActionResult> Delete(SingleEventDto singleEventDto)
        {
            var existing = await dbContext.Events
                .Where(x => x.Id == singleEventDto.Id)
                .FirstOrDefaultAsync();
            if (existing == null)
            {
                return NotFound($"Unknown event ID: '{singleEventDto.Id}'");
            }

            dbContext.Events.Remove(existing);
            await dbContext.SaveChangesAsync();
            return Ok("Delete successful");
        }
    }
}
