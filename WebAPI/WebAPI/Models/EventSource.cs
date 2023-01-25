using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class EventSource : IEquatable<EventSource>
    {
        [Key]
        public Guid Id { get; set; }

        [Required, MaxLength(256)]
        public string Value { get; set; } = string.Empty;

        public bool Equals(EventSource? other)
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
            return Same((other as EventSource)!);
        }

        public static bool operator ==(EventSource? left, EventSource? right)
        {
            if (ReferenceEquals(left, right)) return true;
            if (left is null) return false;
            if (right is null) return false;
            return left.Same(right);
        }

        public static bool operator !=(EventSource? left, EventSource? right)
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
            hash.Add(Value);
            return hash.ToHashCode();
        }

        private bool Same(EventSource other)
        {
            bool same = true;
            same &= Id == other.Id;
            same &= Value == other.Value;
            return same;
        }
    }

}
