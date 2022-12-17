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

        [Route("Get/{id}")]
        [HttpGet]
        public async Task<ActionResult<SingleEventDto>> Get(Guid id)
        {
            var singleEvent = await dbContext.Events
                .Where(x => x.Id == id)
                .Include(x=>x.Title)
                // TODO: include all the foreign keys
                .FirstOrDefaultAsync();
            if (singleEvent == null)
            {
                return NotFound($"Unknown EventID: '{id}'");
            }

            //var singleEventDto = new SingleEventDto
            //{
            //    Id = singleEvent.Id,
            //    Title = singleEvent.Title,
            //    ImageFilePath = singleEvent.ImageFilePath,
            //    Description = singleEvent.Description,
            //    LowerTimeBoundary = singleEvent.LowerTimeBoundary,
            //    UpperTimeBoundary = singleEvent.UpperTimeBoundary
            //};
            var singleEventDto = new SingleEventDto
            {
                Id = singleEvent.Id,
                Title = singleEvent.Title.Text,
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
                .Include(x => x.Title)
                .ToListAsync();

            var singleEventDtos = new List<SingleEventDto>();
            foreach (SingleEvent singleEvent in singleEvents)
            {
                singleEventDtos.Add(new SingleEventDto
                {
                    Id = singleEvent.Id,
                    Title = singleEvent.Title.Text,
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
            // Take the new entry as-is.
            // Note: After much thought, I am not comfortable with trying to find duplicate entries. It is extremely unlikely that two different people are going to choose the exact same title for the exact same event.
            // TODO: Similarity search. ??maybe a machine learning search engine for similarity?? Suggest existing items and pop them up in a modal for preview prior to the user getting all the way through their creation.
            var newTitle = new TitleText
            {
                Text = singleEventDto.Title
            };

            var newSingleEvent = new SingleEvent
            {
                Title = newTitle,
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

            //existing.Title = singleEventDto.Title;
            //existing.ImageFilePath = singleEventDto.ImageFilePath;
            //existing.Description = singleEventDto.Description;
            //existing.LowerTimeBoundary = singleEventDto.LowerTimeBoundary;
            //existing.UpperTimeBoundary = singleEventDto.UpperTimeBoundary;
            await dbContext.SaveChangesAsync();
            return Ok(singleEventDto);
        }

        [Route("Delete/{id}")]
        [HttpDelete]
        public async Task<ActionResult> Delete(Guid id)
        {
            var existing = await dbContext.Events
                .Where(x => x.Id == id)
                .FirstOrDefaultAsync();
            if (existing == null)
            {
                return NotFound($"Unknown event ID: '{id}'");
            }

            dbContext.Events.Remove(existing);
            await dbContext.SaveChangesAsync();
            return Ok("Delete successful");
        }
    }
}
