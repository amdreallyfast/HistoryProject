using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAPI.ModelDTOs;
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
        public async Task<ActionResult<Event>> GetLatestRevision(Guid eventId)
        {
            var latestEvent = await dbContext.Events
                .Where(x => x.Id == eventId)
                .OrderByDescending(x => x.Revision)
                .Take(1)    // Take latest revision
                .Include(x => x.Tags)
                .Include(x => x.EventImage)
                .Include(x => x.SpecificLocation)
                .Include(x => x.Region)
                .Include(x => x.Sources)
                    .ThenInclude(source => source.Authors)
                .FirstOrDefaultAsync();
            if (latestEvent == null)
            {
                return NotFound($"Unknown HistoricalEvent Id: '{eventId}'");
            }

            //var dto = latestEvent.ToDto();
            return Ok(latestEvent);
        }

        [Route("GetAllRevisions/{eventId}")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Event>>> GetAllRevisions(Guid eventId)
        {
            var eventRevisions = await dbContext.Events
                .Where(x => x.Id == eventId)
                .OrderByDescending(x => x.Revision)   // biggest revision number first
                .Include(x => x.Tags)
                .Include(x => x.EventImage)
                .Include(x => x.SpecificLocation)
                .Include(x => x.Region)
                .Include(x => x.Sources)
                    .ThenInclude(source => source.Authors)
                .ToListAsync();
            if (eventRevisions == null)
            {
                return NotFound($"Unknown HistoricalEvent Id: '{eventId}'");
            }

            //List<EventDto> dtos = eventRevisions.Select(x => x.ToDto()).ToList();
            return Ok(eventRevisions);
        }

        [Route("GetSpecificRevision/{eventId}/{revision}")]
        [HttpGet]
        public async Task<ActionResult<Event>> GetSpecificRevision(Guid eventId, int revision)
        {
            var specificRevision = await dbContext.Events
                .Where(x => x.Id == eventId)
                .Where(x => x.Revision == revision)
                .Include(x => x.Tags)
                .Include(x => x.EventImage)
                .Include(x => x.SpecificLocation)
                .Include(x => x.Region)
                .Include(x => x.Sources)
                    .ThenInclude(source => source.Authors)
                .FirstOrDefaultAsync();
            if (specificRevision == null)
            {
                return NotFound($"Unknown HistoricalEvent Id and revision: eventID: '{eventId}', revision: '{revision}'");
            }

            //var dto = specificRevision.ToDto();
            return Ok(specificRevision);
        }

        [Route("GetFirst100")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Event>>> GetFirst100()
        {
            var things = await dbContext.Events.Take(1).ToListAsync();

            var first100Events = await dbContext.Events
                .Take(100)
                .Include(x => x.Tags)
                .Include(x => x.EventImage)
                .Include(x => x.SpecificLocation)
                .Include(x => x.Region)
                .Include(x => x.Sources)
                    .ThenInclude(source => source.Authors)
                .ToListAsync();

            //List<EventDto> dtos = first100Events.Select(x => x.ToDto()).ToList();
            return Ok(first100Events);
        }

        [Route("GetEventOfTheDay")]
        [HttpGet]
        public async Task<ActionResult<Event>> GetEventOfTheDay()
        {
            // TODO: get info from somewhere else
            throw new NotImplementedException();

            // Until I figure that out, get a random element.
            var numEvents = await dbContext.Events.CountAsync();
            var random = new Random();
            var randomIndex = random.Next(numEvents);
            var randomEvent = await dbContext.Events
                .Skip(randomIndex)
                .Include(x => x.Tags)
                .Include(x => x.EventImage)
                .Include(x => x.SpecificLocation)
                .Include(x => x.Region)
                .Include(x => x.Sources)
                    .ThenInclude(source => source.Authors)
                .FirstOrDefaultAsync();

            //randomEvent = null;
            if (randomEvent == null)
            {
                //??somehow include stack trace? log somewhere??
                return StatusCode(StatusCodes.Status500InternalServerError, "Failed to retrieve any random event.");
            }

            //var randomEventDto = new HistoricalEventDto(randomEvent);
            return Ok(randomEvent);
        }

        // TODO: CreateNew
        // TODO: CreateNewWithPredecessor/{eventId}
        // TODO: CreateNewRevision/{eventId}
        //https://stackoverflow.com/questions/39121358/route-with-multiple-ids-laravel

        [Route("Create")]
        [HttpPost]
        public async Task<ActionResult<Event>> Create(Event e)
        {
            if (string.IsNullOrEmpty(e.Title))
            {
                return UnprocessableEntity("Title cannot be empty");
            }
            else if (string.IsNullOrEmpty(e.Summary))
            {
                return UnprocessableEntity("Summary cannot be empty");
            }
            else if (e.SpecificLocation is null && (e.Region is null || !e.Region.Any()))
            {
                return UnprocessableEntity("Must specify location and/or region");
            }

            //try
            //{

            //}
            //catch (Exception e)
            //{
            //    return UnprocessableEntity(e.Message);
            //}
            //// Take the new entry as-is.
            //// Note: After much thought, I am not comfortable with trying to find duplicate
            //// entries. It is extremely unlikely that two different people are going to choose
            //// the exact same title for the exact same event.
            //// TODO: Similarity search. ??maybe a machine learning search engine for similarity?? Suggest existing items and pop them up in a modal for preview prior to the user getting all the way through their creation.
            //var newEvent = new HistoricalEvent(eventDto);
            //dbContext.Events.Add(newEvent);

            if (e.Id == Guid.Empty)
            {
                throw new NotImplementedException();
            }

            dbContext.Events.Add(e);
            await dbContext.SaveChangesAsync();
            return Ok(e);
        }

        [Route("Update")]
        [HttpPost]
        public async Task<ActionResult<Event>> Update(Event e)
        {
            var existingEvent = await dbContext.Events
                .Where(x => x.EventId == e.EventId)
                .FirstOrDefaultAsync();
            if (existingEvent == null)
            {
                return NotFound($"Cannot update unknown event: '{e.EventId} ({e.Title})'");
            }

            //var newEventRevision = existingEvent.CreateUpdatedFromDto(eventDto);
            //dbContext.Events.Add(newEventRevision);

            throw new NotImplementedException();
            //??create new Id??
            //??create new eventId??
            //??check for existing other tables by name or something, like tags and sources??

            dbContext.Events.Add(e);
            await dbContext.SaveChangesAsync();
            return Ok(e);
        }

        [Route("Delete/{eventId}")]
        [HttpDelete]
        public async Task<ActionResult> Delete(Guid eventId)
        {
            // Note: Don't need to load the related models just to verify that it exists. The
            // cascade delete will get them anyway.
            var existingEvent = await dbContext.Events
                .Where(x => x.EventId == eventId)
                .FirstOrDefaultAsync();
            if (existingEvent == null)
            {
                return NotFound($"Unknown event ID: '{eventId}'");
            }

            //// Check if anyone _else_ is using the image.
            //var eventsUsingImage = await dbContext.Events
            //    .Where(x => x.EventId != existingEvent.EventId)
            //    .Where(x => x.ImageFilePath == existingEvent.ImageFilePath)
            //    .FirstOrDefaultAsync();
            //if (eventsUsingImage == null)
            //{
            //    // No one else using it. Remove the associated image.
            //    System.IO.File.Delete(existingEvent.ImageFilePath);
            //}

            dbContext.Events.Remove(existingEvent);
            await dbContext.SaveChangesAsync();
            return Ok("Delete successful");
        }

        //[Route("SaveImage")]
        //[HttpPost]
        //public async Task<ActionResult<string>> SaveImage(IFormFile formFile)
        //{
        //    try
        //    {
        //        //throw new Exception("oh no the bads!");


        //        var newFilePath = Path.Combine(webHostEnvironment.ContentRootPath, "Photos", formFile.FileName);
        //        Console.WriteLine($"newFilePath: '{newFilePath}'");
        //        using (var stream = new FileStream(newFilePath, FileMode.Create))
        //        {
        //            await formFile.CopyToAsync(stream);
        //        }

        //        // Delete any previously-existing image so that we don't end up with a pile of unused images.
        //        if (!string.IsNullOrEmpty(uploadedFilePath))
        //        {
        //            System.IO.File.Delete(uploadedFilePath);
        //        }

        //        uploadedFilePath = newFilePath;

        //        // Return the filename only, not the full path. The client-side API is configured
        //        // to know that "/Photos/<filename>" is enough to retrieve the image. It doesn't
        //        // need to know anything about the rest of the server's file structure.
        //        return new JsonResult(formFile.FileName);
        //    }
        //    catch (Exception ex)
        //    {
        //        return ex.ToString();
        //    }
        //}
    }
}
