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
        private string uploadedFilePath;

        public EventController(HistoryProjectDbContext dbContext, IWebHostEnvironment webHostEnvironment)
        {
            this.dbContext = dbContext;
            this.webHostEnvironment = webHostEnvironment;
        }

        [Route("Get/{revisionId}")]
        [HttpGet]
        public async Task<ActionResult<SingleEventDto>> Get(Guid revisionId)
        {
            var singleEvent = await dbContext.Events
                .Where(x => x.RevisionId == revisionId)
                .Include(x => x.LowerTimeBoundary)
                .Include(x => x.UpperTimeBoundary)
                .Include(x => x.Where)
                .FirstOrDefaultAsync();
            if (singleEvent == null)
            {
                return NotFound($"Unknown event RevisionId: '{revisionId}'");
            }

            var singleEventDto = new SingleEventDto
            {
                RevisionId = revisionId,
                Title = singleEvent.Title,
                ImageFilePath = singleEvent.ImageFilePath,
                Summary = singleEvent.Summary,
                LowerTimeBoundary = singleEvent.LowerTimeBoundary,
                UpperTimeBoundary = singleEvent.UpperTimeBoundary,
                Where = singleEvent.Where
            };
            return Ok(singleEventDto);
        }

        [Route("GetAll")]
        [HttpGet]
        public async Task<ActionResult<List<SingleEventDto>>> GetAll()
        {
            var singleEvents = await dbContext.Events
                .Include(x => x.LowerTimeBoundary)
                .Include(x => x.UpperTimeBoundary)
                .Include(x => x.Where)
                .ToListAsync();

            var singleEventDtos = new List<SingleEventDto>();
            foreach (SingleEvent singleEvent in singleEvents)
            {
                singleEventDtos.Add(new SingleEventDto
                {
                    RevisionId = singleEvent.RevisionId,
                    Title = singleEvent.Title,
                    ImageFilePath = singleEvent.ImageFilePath,
                    Summary = singleEvent.Summary,
                    LowerTimeBoundary = singleEvent.LowerTimeBoundary,
                    UpperTimeBoundary = singleEvent.UpperTimeBoundary,
                    Where = singleEvent.Where
                });
            }
            return Ok(singleEventDtos);
        }

        [Route("Create")]
        [HttpPost]
        public async Task<ActionResult<SingleEventDto>> Create(SingleEventDto singleEventDto)
        {
            if (string.IsNullOrEmpty(singleEventDto.Title))
            {
                return UnprocessableEntity("Title cannot be empty");
            }
            else if (string.IsNullOrEmpty(singleEventDto.Summary))
            {
                return UnprocessableEntity("Summary cannot be empty");
            }
            else if (!singleEventDto.Where.Locations.Any())
            {
                return UnprocessableEntity("Must specify where (or approximately where)");
            }

            // Take the new entry as-is.
            // Note: After much thought, I am not comfortable with trying to find duplicate
            // entries. It is extremely unlikely that two different people are going to choose
            // the exact same title for the exact same event.
            // TODO: Similarity search. ??maybe a machine learning search engine for similarity?? Suggest existing items and pop them up in a modal for preview prior to the user getting all the way through their creation.
            var newSingleEvent = new SingleEvent
            {
                Title = singleEventDto.Title,
                ImageFilePath = singleEventDto.ImageFilePath,
                Summary = singleEventDto.Summary,
                LowerTimeBoundary = singleEventDto.LowerTimeBoundary,
                UpperTimeBoundary = singleEventDto.UpperTimeBoundary,
                Where = singleEventDto.Where,
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
                .Where(x => x.RevisionId == singleEventDto.RevisionId)
                .Include(x => x.LowerTimeBoundary)
                .Include(x => x.UpperTimeBoundary)
                .Include(x => x.Where)
                .FirstOrDefaultAsync();
            if (existing == null)
            {
                return NotFound($"Cannot update unknown event: '{singleEventDto.Title} ({singleEventDto.RevisionId})'");
            }

            var newEventRevision = new SingleEvent
            {
                // Preserve the fact that this is the same event.
                EventId = existing.EventId,

                Title = singleEventDto.Title,
                ImageFilePath = singleEventDto.ImageFilePath,
                Summary = singleEventDto.Summary,
                LowerTimeBoundary = singleEventDto.LowerTimeBoundary,
                UpperTimeBoundary = singleEventDto.UpperTimeBoundary,
                Where = singleEventDto.Where,
            };

            dbContext.Events.Add(newEventRevision);
            await dbContext.SaveChangesAsync();
            return Ok(singleEventDto);
        }

        [Route("Delete/{revisionId}")]
        [HttpDelete]
        public async Task<ActionResult> Delete(Guid revisionId)
        {
            var existing = await dbContext.Events
                .Where(x => x.RevisionId == revisionId)
                .Include(x => x.LowerTimeBoundary)
                .Include(x => x.UpperTimeBoundary)
                .Include(x => x.Where)
                .FirstOrDefaultAsync();
            if (existing == null)
            {
                return NotFound($"Unknown event ID: '{revisionId}'");
            }

            // Check if anyone _else_ is using the image.
            var eventsUsingImage = await dbContext.Events
                .Where(x => x.RevisionId != existing.RevisionId)
                .Where(x => x.ImageFilePath == existing.ImageFilePath)
                .FirstOrDefaultAsync();
            if (eventsUsingImage == null)
            {
                // No one else using it. Remove the associated image.
                System.IO.File.Delete(existing.ImageFilePath);
            }

            dbContext.Events.Remove(existing);
            await dbContext.SaveChangesAsync();
            return Ok("Delete successful");
        }

        [Route("SaveFile")]
        [HttpPost]
        public async Task<ActionResult<string>> SaveFile(IFormFile formFile)
        {
            try
            {
                var newFilePath = Path.Combine(webHostEnvironment.ContentRootPath, "Photos", formFile.FileName);
                Console.WriteLine($"newFilePath: '{newFilePath}'");
                using (var stream = new FileStream(newFilePath, FileMode.Create))
                {
                    await formFile.CopyToAsync(stream);
                }

                // Delete the already-existing file so that we don't end up with a pile of unused files.
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
