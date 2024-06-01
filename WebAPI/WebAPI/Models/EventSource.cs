using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;

namespace WebAPI.Models
{
    public class EventSource : IEquatable<EventSource>
    {
        [Key]
        public Guid Id { get; set; }

        [AllowNull, MaxLength(32)]
        public string ISBN { get; set; }    // Not all sources are officially registered
        
        [Required, MaxLength(256)]
        public string Title { get; set; } = default!;

        [Required, MaxLength(128)]
        public string Where { get; set; } = default!;

        [Required]
        public List<EventSourceAuthor> Authors { get; set; } = default!;

        [Required]
        public int PublicationLBYear { get; set; } = -99999;

        [AllowNull]
        public int? PublicationLBMonth { get; set; }

        [AllowNull]
        public int? PublicationLBDay { get; set; }

        [Required]
        public int PublicationUBYear { get; set; } = +99990;

        [AllowNull]
        public int? PublicationUBMonth { get; set; }

        [AllowNull]
        public int? PublicationUBDay { get; set; }

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
            hash.Add(ISBN);
            hash.Add(Title);
            hash.Add(Where);
            hash.Add(Authors);
            hash.Add(PublicationUBYear);
            hash.Add(PublicationUBMonth);
            hash.Add(PublicationUBDay);
            hash.Add(PublicationLBYear);
            hash.Add(PublicationLBMonth);
            hash.Add(PublicationLBDay);
            return hash.ToHashCode();
        }

        private bool Same(EventSource other)
        {
            bool same = true;
            same &= Id == other.Id;
            same &= ISBN == other.ISBN;
            same &= Title == other.Title;
            same &= Where == other.Where;
            same &= Authors == other.Authors;
            same &= PublicationUBYear == other.PublicationUBYear;
            same &= PublicationUBMonth == other.PublicationUBMonth;
            same &= PublicationUBDay == other.PublicationUBDay;
            same &= PublicationLBYear == other.PublicationLBYear;
            same &= PublicationLBMonth == other.PublicationLBMonth;
            same &= PublicationLBDay == other.PublicationLBDay;
            return same;
        }
    }

}
