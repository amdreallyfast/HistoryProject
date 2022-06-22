namespace WebAPI.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;

        public ICollection<Character> Characters { get; set; }
    }
}
