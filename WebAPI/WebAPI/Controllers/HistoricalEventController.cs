using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using WebAPI;
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

        // Keep in sync with MAX_IMAGE_BYTES in npmfrontend/src/api/imageDataUrl.js.
        private const int MaxImageBytes = 5 * 1024 * 1024;
        private static readonly byte[] PngSignature = { 0x89, 0x50, 0x4e, 0x47 };
        private static readonly byte[] JpegSignature = { 0xff, 0xd8, 0xff };

        // Returns an error message if the image bytes are invalid, or null when valid.
        // Empty/null bytes mean "no image" and are allowed.
        private static string? ValidateImage(byte[]? imageBinary)
        {
            if (imageBinary is null || imageBinary.Length == 0)
            {
                return null;
            }
            if (imageBinary.Length > MaxImageBytes)
            {
                return $"Image exceeds {MaxImageBytes / (1024 * 1024)}MB limit.";
            }
            if (!StartsWith(imageBinary, PngSignature) && !StartsWith(imageBinary, JpegSignature))
            {
                return "Only PNG or JPEG images are allowed.";
            }
            return null;
        }

        private static bool StartsWith(byte[] bytes, byte[] signature)
        {
            if (bytes.Length < signature.Length) return false;
            for (int i = 0; i < signature.Length; i++)
            {
                if (bytes[i] != signature[i]) return false;
            }
            return true;
        }

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
                .Where(x => x.EventId == eventId)
                .OrderByDescending(x => x.Revision)
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
                .Where(x => x.EventId == eventId)
                .OrderByDescending(x => x.Revision)   // biggest revision number first
                .Include(x => x.Tags)
                .Include(x => x.EventImage)
                .Include(x => x.SpecificLocation)
                .Include(x => x.Region)
                .Include(x => x.Sources)
                    .ThenInclude(source => source.Authors)
                .ToListAsync();
            if (!eventRevisions.Any())
            {
                return NotFound($"Unknown HistoricalEvent EventId: '{eventId}'");
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
            // Return only the latest revision per EventId. The NOT EXISTS subquery
            // filters out any row where a newer revision of the same EventId exists.
            var latestRevisions = await dbContext.Events
                .Where(e => !dbContext.Events.Any(e2 =>
                    e2.EventId == e.EventId &&
                    e2.Revision > e.Revision))
                .Take(100)
                .Include(x => x.Tags)
                .Include(x => x.EventImage)
                .Include(x => x.SpecificLocation)
                .Include(x => x.Region)
                .Include(x => x.Sources)
                    .ThenInclude(source => source.Authors)
                .ToListAsync();
            return Ok(latestRevisions);
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

        [Route("Create2")]
        [HttpPost]
        public async Task<ActionResult<string>> Create(IDictionary<string, string> d)
        {
            return Ok("things");
        }


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

            // Re-validate the image server-side. The frontend already checks, but the client
            // is untrusted: reject anything that isn't a PNG/JPEG within the size cap so we
            // never persist arbitrary bytes. An empty image means "no image" and is allowed.
            var imageError = ValidateImage(e.EventImage?.ImageBinary);
            if (imageError is not null)
            {
                return UnprocessableEntity(imageError);
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

            // Same image guard as Create — Update is a write path too, so it must not become
            // a hole for arbitrary bytes once it is implemented.
            var imageError = ValidateImage(e.EventImage?.ImageBinary);
            if (imageError is not null)
            {
                return UnprocessableEntity(imageError);
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
            // There is no user-facing delete: the app is append-only (editing always creates a
            // new revision), so this endpoint exists purely for test/admin cleanup. Until a real
            // account/permission system exists, gate it to dev/test environments so prod events
            // cannot be destroyed through the public API. (TODO: replace with admin permission.)
            if (!webHostEnvironment.IsDevelopment() && !webHostEnvironment.IsTesting())
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    "Delete is only available in the development/test environment.");
            }

            // Hard-delete the ENTIRE event: every revision of this EventId plus its owned
            // children. Load the full graph so the owned rows are tracked and removed explicitly —
            // the Region locations and Sources hold NO ACTION FKs to the Event, so removing the
            // Event alone would fail the constraint (the historical cause of the 500 here).
            var revisions = await dbContext.Events
                .Where(x => x.EventId == eventId)
                .Include(x => x.Tags)
                .Include(x => x.EventImage)
                .Include(x => x.SpecificLocation)
                .Include(x => x.Region)
                .Include(x => x.Sources)
                    .ThenInclude(source => source.Authors)
                .ToListAsync();
            if (revisions.Count == 0)
            {
                return NotFound($"Unknown event ID: '{eventId}'");
            }

            foreach (var rev in revisions)
            {
                if (rev.Region is not null) dbContext.Locations.RemoveRange(rev.Region);
                if (rev.SpecificLocation is not null) dbContext.Locations.Remove(rev.SpecificLocation);
                if (rev.EventImage is not null) dbContext.Images.Remove(rev.EventImage);
                if (rev.Sources is not null)
                {
                    foreach (var source in rev.Sources)
                    {
                        if (source.Authors is not null) dbContext.SourceAuthors.RemoveRange(source.Authors);
                    }
                    dbContext.Sources.RemoveRange(rev.Sources);
                }
                // Tags are shared via the EventTag many-to-many join: removing the Event drops the
                // join rows (DB cascade), but the Tag entities are left alone since other events
                // may reference them.
            }
            dbContext.Events.RemoveRange(revisions);
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
