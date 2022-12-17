﻿using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    // TODO: Split all fields into their own models, then make the SingleEvent a place of foreign keys
    public class SingleEvent
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public TitleText Title { get; set; } = new TitleText();
        //public string Title { get; set; } = string.Empty;

        public string ImageFilePath { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime LowerTimeBoundary { get; set; } = DateTime.Now;
        public DateTime UpperTimeBoundary { get; set; } = DateTime.MinValue;
    }

    public class SingleEventDto
    {
        public Guid? Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ImageFilePath { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime LowerTimeBoundary { get; set; } = DateTime.Now;
        public DateTime UpperTimeBoundary { get; set; } = DateTime.MinValue;

        public SingleEventDto()
        {
        }

        public SingleEventDto(SingleEvent singleEvent)
        {
            Id = singleEvent.Id;
            Title = singleEvent.Title.Text;
            ImageFilePath = singleEvent.ImageFilePath;
            Description = singleEvent.Description;
            LowerTimeBoundary = singleEvent.LowerTimeBoundary;
            UpperTimeBoundary = singleEvent.UpperTimeBoundary;
        }
    }
}
