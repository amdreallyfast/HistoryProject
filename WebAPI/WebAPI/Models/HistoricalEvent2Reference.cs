using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    // A HistoricalEvent is the consequence of one (and often more than one) other event. Whether
    // a single event has multiple predecessor events, this table will track that.
    public class HistoricalEvent2Reference : IEquatable<HistoricalEvent2Reference>
    {
        // Explicitly label as the primary key because I'm paranoid that EF Core won't figure out
        // which of these two guids is the right Id.
        [Key]
        public Guid Id { get; set; }

        // Note: Due to the complexity of having potentially multiple revisions per
        // HistoricalEvent, and therefore needing each revision Id to be part of the primary key,
        // asking EF Core to handle the key syntax for accessing the relationship for me will be
        // too complicated to expect it to do a good job. Instead, just keep a Guid and do the
        // lookup yourself by matching Id, and then pick the latest revision.
        public Guid EventId { get; set; }

        public bool Equals(HistoricalEvent2Reference? other)
        {
            if (ReferenceEquals(this, other)) return true;
            else if (other is null) return false;
            else return Same(other);
        }

        public override bool Equals(object? other)
        {
            if (ReferenceEquals(this, other)) return true;
            else if (other is null) return false;
            else if (this.GetType() != other.GetType()) return false;
            else return Same((other as HistoricalEvent2Reference)!);
        }

        public static bool operator ==(HistoricalEvent2Reference? left, HistoricalEvent2Reference? right)
        {
            if (ReferenceEquals(left, right)) return false;
            else if (left is null) return false;
            else if (right is null) return false;
            else return left.Same(right);
        }

        public static bool operator !=(HistoricalEvent2Reference? left, HistoricalEvent2Reference? right)
        {
            if (ReferenceEquals(left, right)) return false;
            else if (left is null) return false;
            else if (right is null) return false;
            else return !left.Same(right);
        }

        public override int GetHashCode()
        {
            HashCode hash = new();
            hash.Add(Id);
            hash.Add(EventId);
            return hash.ToHashCode();
        }

        private bool Same(HistoricalEvent2Reference other)
        {
            bool same = true;
            same &= Id == other.Id;
            same &= EventId == other.EventId;
            return same;
        }
    }
}
