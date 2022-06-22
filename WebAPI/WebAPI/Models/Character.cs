using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebAPI.Models
{
    public class Character
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RpgClass { get; set; } = "Knight";

        [JsonIgnore]
        public User User { get; set; }
        public int UserId { get; set; }

        public Weapon? Weapon { get; set; }
    }

    // Necessary because the translation from the JSON in the POST request to the Character model _always fails_. So. We need a dummy middle-man object with the minimum fields necessary to create a new Character model.
    public class CreateCharacterDto
    {
        public string Name { get; set; } = string.Empty;
        public string RpgClass { get; set; } = "Knight";
        public int UserId { get; set; }
    }
}
