﻿using Microsoft.AspNetCore.Http;
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
        private string uploadedFilePath = string.Empty;

        public EventController(HistoryProjectDbContext dbContext, IWebHostEnvironment webHostEnvironment)
        {
            this.dbContext = dbContext;
            this.webHostEnvironment = webHostEnvironment;
        }

        [Route("Get/{revisionId}")]
        [HttpGet]
        public async Task<ActionResult<EventDto>> Get(Guid revisionId)
        {
            var existingEvent = await dbContext.Events
                .Where(x => x.RevisionId == revisionId)
                .Include(x => x.Summary)
                .Include(x => x.LowerTimeBoundary)
                .Include(x => x.UpperTimeBoundary)
                .Include(x => x.Region)
                .FirstOrDefaultAsync();
            if (existingEvent == null)
            {
                return NotFound($"Unknown event RevisionId: '{revisionId}'");
            }

            var eventDto = new EventDto(existingEvent);
            return Ok(eventDto);
        }

        [Route("GetAll")]
        [HttpGet]
        public async Task<ActionResult<List<EventDto>>> GetAll()
        {
            var existingEvents = await dbContext.Events
                .Include(x => x.Summary)
                .Include(x => x.LowerTimeBoundary)
                .Include(x => x.UpperTimeBoundary)
                .Include(x => x.Region)
                .ToListAsync();

            var existingEventDtos = new List<EventDto>();
            foreach (Event existingEvent in existingEvents)
            {
                existingEventDtos.Add(new EventDto(existingEvent));
            }
            return Ok(existingEventDtos);
        }

        [Route("Create")]
        [HttpPost]
        public async Task<ActionResult<EventDto>> Create(EventDto eventDto)
        {
            if (string.IsNullOrEmpty(eventDto.Title))
            {
                return UnprocessableEntity("Title cannot be empty");
            }
            else if (string.IsNullOrEmpty(eventDto.Summary))
            {
                return UnprocessableEntity("Summary cannot be empty");
            }
            else if (!eventDto.Region.Any())
            {
                return UnprocessableEntity("Must specify where (or approximately where)");
            }

            // Take the new entry as-is.
            // Note: After much thought, I am not comfortable with trying to find duplicate
            // entries. It is extremely unlikely that two different people are going to choose
            // the exact same title for the exact same event.
            // TODO: Similarity search. ??maybe a machine learning search engine for similarity?? Suggest existing items and pop them up in a modal for preview prior to the user getting all the way through their creation.
            var newEvent = new Event(eventDto);
            dbContext.Events.Add(newEvent);
            await dbContext.SaveChangesAsync();
            return Ok(newEvent);
        }

        [Route("Update")]
        [HttpPut]
        public async Task<ActionResult<EventDto>> Update(EventDto eventDto)
        {
            var existingEvent = await dbContext.Events
                .Where(x => x.RevisionId == eventDto.RevisionId)
                .Include(x => x.Summary)
                .Include(x => x.LowerTimeBoundary)
                .Include(x => x.UpperTimeBoundary)
                .Include(x => x.Region)
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
            var existingEvent = await dbContext.Events
                .Where(x => x.RevisionId == revisionId)
                .Include(x => x.Summary)
                .Include(x => x.LowerTimeBoundary)
                .Include(x => x.UpperTimeBoundary)
                .Include(x => x.Region)
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
