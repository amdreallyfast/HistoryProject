using System;
using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class Tag : IEquatable<Tag>
    {
        [Key]
        public Guid Id { get; set; }

        [Required, MaxLength(128)]
        public string Value { get; set; } = string.Empty;

        [Required]
        public List<Event> Events { get; set; } = default!;

        public Tag()
        {
        }

        public Tag(Tag other)
        {
            Id = other.Id;
            Value = other.Value;
            Events = other.Events;
        }

        public bool Equals(Tag? other)
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
            return Same((other as Tag)!);
        }

        public static bool operator ==(Tag? left, Tag? right)
        {
            if (ReferenceEquals(left, right)) return true;
            if (left is null) return false;
            if (right is null) return false;
            return left.Same(right);
        }

        public static bool operator !=(Tag? left, Tag? right)
        {
            if (ReferenceEquals(left, right)) return false;
            if (left is null) return false;
            if (right is null) return false;
            return !left.Same(right);
        }

        private bool Same(Tag other)
        {
            bool same = true;
            same &= Id == other.Id;
            same &= Value == other.Value;
            same &= Events == other.Events; // only same on reference equals
            return same;
        }

        public override int GetHashCode()
        {
            var hash = new HashCode();
            hash.Add(Id);
            hash.Add(Value);
            if (Events != null) { hash.Add(Events.GetHashCode()); }
            return hash.ToHashCode();
        }
    }
}
