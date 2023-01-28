using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAPI.Models;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HistoricalEventController : ControllerBase
    {
        private readonly HistoryProjectDbContext dbContext;
        private readonly IWebHostEnvironment webHostEnvironment;
        private string uploadedFilePath = string.Empty;

        public HistoricalEventController(HistoryProjectDbContext dbContext, IWebHostEnvironment webHostEnvironment)
        {
            this.dbContext = dbContext;
            this.webHostEnvironment = webHostEnvironment;
        }

        [Route("GetLatestRevision/{eventId}")]
        [HttpGet]
        public async Task<ActionResult<HistoricalEvent2>> GetLatestRevision(Guid eventId)
        {
            var latestEvent = await dbContext.HistoricalEvents
                .Where(x => x.Id == eventId)
                .OrderByDescending(x => x.Revision)   // biggest revision number first
                .Take(1)
                .Include(x => x.Predecessors)
                .Include(x => x.Locations)
                .Include(x => x.Sources)
                .FirstOrDefaultAsync();
            if (latestEvent == null)
            {
                return NotFound($"Unknown HistoricalEvent Id: '{eventId}'");
            }

            return Ok(latestEvent);
        }

        [Route("GetAllRevisions/{eventId}")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<HistoricalEvent2>>> GetAllRevisions(Guid eventId)
        {
            var eventRevisions = await dbContext.HistoricalEvents
                .Where(x => x.Id == eventId)
                .Include(x => x.Predecessors)
                .Include(x => x.Locations)
                .Include(x => x.Sources)
                .ToListAsync();
            if (eventRevisions == null)
            {
                return NotFound($"Unknown HistoricalEvent Id: '{eventId}'");
            }

            return Ok(eventRevisions);
        }

        [Route("GetSpecificRevision/{eventId}/{revisionId}")]
        [HttpGet]
        public async Task<ActionResult<HistoricalEvent2>> GetSpecificRevision(Guid eventId, int revision)
        {
            var specificRevision = await dbContext.HistoricalEvents
                .Where(x => x.Id == eventId)
                .Where(x => x.Revision == revision)
                .Include(x => x.Predecessors)
                .Include(x => x.Locations)
                .Include(x => x.Sources)
                .FirstOrDefaultAsync();
            if (specificRevision == null)
            {
                return NotFound($"Unknown HistoricalEvent Id and revision: eventID: '{eventId}', revision: '{revision}'");
            }

            return Ok(specificRevision);
        }

        [Route("GetFirst100")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<HistoricalEvent2>>> GetFirst100()
        {
            var first100Events = await dbContext.HistoricalEvents
                .Take(100)
                .Include(x => x.Predecessors)
                .Include(x => x.Locations)
                .Include(x => x.Sources)
                .ToListAsync();

            return Ok(first100Events);
        }

        [Route("GetEventOfTheDay")]
        [HttpGet]
        public async Task<ActionResult<HistoricalEventDto>> GetEventOfTheDay()
        {
            // TODO: get info from somewhere else
            throw new NotImplementedException();

            // Until I figure that out, get a random element.
            var numEvents = await dbContext.Events.CountAsync();
            var random = new Random();
            var randomIndex = random.Next(numEvents);
            var randomEvent = await dbContext.Events
                .Skip(randomIndex)
                .Include(x => x.Summary)
                .Include(x => x.TimeRange)
                .Include(x => x.Region)
                .Include(x => x.Region.Locations)
                .FirstOrDefaultAsync();

            //randomEvent = null;
            if (randomEvent == null)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Failed to retrieve any random event.");
            }

            var randomEventDto = new HistoricalEventDto(randomEvent);
            return Ok(randomEventDto);
        }

        // TODO: CreateNew
        // TODO: CreateNewWithPredecessor/{eventId}
        // TODO: CreateNewRevision/{eventId}
        //https://stackoverflow.com/questions/39121358/route-with-multiple-ids-laravel

        [Route("Create")]
        [HttpPost]
        public async Task<ActionResult<HistoricalEventDto>> Create(HistoricalEventDto eventDto)
        {
            if (string.IsNullOrEmpty(eventDto.Title))
            {
                return UnprocessableEntity("Title cannot be empty");
            }
            else if (string.IsNullOrEmpty(eventDto.Summary))
            {
                return UnprocessableEntity("Summary cannot be empty");
            }
            else if (!eventDto.Region.Locations.Any())
            {
                return UnprocessableEntity("Must specify where (or approximately where)");
            }

            // Take the new entry as-is.
            // Note: After much thought, I am not comfortable with trying to find duplicate
            // entries. It is extremely unlikely that two different people are going to choose
            // the exact same title for the exact same event.
            // TODO: Similarity search. ??maybe a machine learning search engine for similarity?? Suggest existing items and pop them up in a modal for preview prior to the user getting all the way through their creation.
            var newEvent = new HistoricalEvent(eventDto);
            dbContext.Events.Add(newEvent);
            await dbContext.SaveChangesAsync();
            return Ok(newEvent);
        }

        [Route("Update")]
        [HttpPost]
        public async Task<ActionResult<HistoricalEventDto>> Update(HistoricalEventDto eventDto)
        {
            var existingEvent = await dbContext.Events
                .Where(x => x.RevisionId == eventDto.RevisionId)
                .Include(x => x.Summary)
                .Include(x => x.TimeRange)
                .Include(x => x.Region)
                .Include(x => x.Region.Locations)
                .FirstOrDefaultAsync();
            if (existingEvent == null)
            {
                return NotFound($"Cannot update unknown event: '{eventDto.Title} ({eventDto.RevisionId})'");
            }

            var newEventRevision = existingEvent.CreateUpdatedFromDto(eventDto);
            dbContext.Events.Add(newEventRevision);
            await dbContext.SaveChangesAsync();
            return Ok(eventDto);
        }

        [Route("Delete/{revisionId}")]
        [HttpDelete]
        public async Task<ActionResult> Delete(Guid revisionId)
        {
            // Note: Don't need to load the related models just to verify that it exists. The
            // cascade delete will get them anyway.
            var existingEvent = await dbContext.Events
                .Where(x => x.RevisionId == revisionId)
                .FirstOrDefaultAsync();
            if (existingEvent == null)
            {
                return NotFound($"Unknown event ID: '{revisionId}'");
            }

            // Check if anyone _else_ is using the image.
            var eventsUsingImage = await dbContext.Events
                .Where(x => x.RevisionId != existingEvent.RevisionId)
                .Where(x => x.ImageFilePath == existingEvent.ImageFilePath)
                .FirstOrDefaultAsync();
            if (eventsUsingImage == null)
            {
                // No one else using it. Remove the associated image.
                System.IO.File.Delete(existingEvent.ImageFilePath);
            }

            dbContext.Events.Remove(existingEvent);
            await dbContext.SaveChangesAsync();
            return Ok("Delete successful");
        }

        [Route("SaveImage")]
        [HttpPost]
        public async Task<ActionResult<string>> SaveImage(IFormFile formFile)
        {
            try
            {
                //throw new Exception("oh no the bads!");


                var newFilePath = Path.Combine(webHostEnvironment.ContentRootPath, "Photos", formFile.FileName);
                Console.WriteLine($"newFilePath: '{newFilePath}'");
                using (var stream = new FileStream(newFilePath, FileMode.Create))
                {
                    await formFile.CopyToAsync(stream);
                }

                // Delete any previously-existing image so that we don't end up with a pile of unused images.
                if (!string.IsNullOrEmpty(uploadedFilePath))
                {
                    System.IO.File.Delete(uploadedFilePath);
                }

                uploadedFilePath = newFilePath;

                // Return the filename only, not the full path. The client-side API is configured
                // to know that "/Photos/<filename>" is enough to retrieve the image. It doesn't
                // need to know anything about the rest of the server's file structure.
                return new JsonResult(formFile.FileName);
            }
            catch (Exception ex)
            {
                return ex.ToString();
            }
        }
    }
}
