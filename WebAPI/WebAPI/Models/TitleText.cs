using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class TitleText
    {
        [Key]
        public Guid Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public Guid? Previous { get; set; }
    }
}
