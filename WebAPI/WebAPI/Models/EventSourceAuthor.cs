using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class EventSourceAuthor : IEquatable<EventSourceAuthor>
    {
        [Key]
        public Guid Id { get; set; }

        [Required, MaxLength(256)]
        public string Author { get; set; } = default!;

        public bool Equals(EventSourceAuthor? other)
        {
            if (ReferenceEquals(this, other)) return true;
            if (other is null) return false;
            return Same(other);
        }

        public override bool Equals(object? other)
        {
            if (ReferenceEquals(this, other)) return true;
            if (other is null) return false;
            if (this.GetType() != other.GetType()) return false;
            return Same((other as EventSourceAuthor)!);
        }

        public static bool operator ==(EventSourceAuthor? left, EventSourceAuthor? right)
        {
            if (ReferenceEquals(left, right)) return true;
            if (left is null) return false;
            if (right is null) return false;
            return left.Same(right);
        }

        public static bool operator !=(EventSourceAuthor? left, EventSourceAuthor? right)
        {
            if (ReferenceEquals(left, right)) return false;
            if (left is null) return false;
            if (right is null) return false;
            return !left.Same(right);
        }

        public override int GetHashCode()
        {
            HashCode hash = new();
            hash.Add(Id);
            hash.Add(Author);
            return hash.ToHashCode();
        }

        private bool Same(EventSourceAuthor other)
        {
            bool same = true;
            same &= Id == other.Id;
            same &= Author == other.Author;
            return same;
        }
    }
}
