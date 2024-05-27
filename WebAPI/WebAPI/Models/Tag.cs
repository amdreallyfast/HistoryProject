using System;
using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class Tag : IEquatable<Tag>
    {
        [Key]
        public Guid Id { get; set; }

        [Required, MaxLength(64)]
        public string Value { get; set; } = string.Empty;

        public Tag()
        {
        }

        public Tag(Tag other)
        {
            Value = other.Value;
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
            if (ReferenceEquals(left, right)) return true;
            if (left is null) return false;
            if (right is null) return false;
            return left.Same(right);
        }

        private bool Same(Tag other)
        {
            bool same = true;
            same &= other.Value == Value;
            return same;
        }

        public override int GetHashCode()
        {
            var hash = new HashCode();
            hash.Add(Id);
            hash.Add(Value);
            return hash.ToHashCode();
        }
    }
}
