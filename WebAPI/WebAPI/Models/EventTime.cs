using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class EventTime : IEquatable<EventTime>
    {
        [Key]
        public Guid Id { get; set; }

        // Track time elements separately.
        //  DateTime does not accept null or negative values, but we don't always know the exact
        //  date and time of an event, and sometimes we can only approximate a year range. Rather
        //  than attempt an interpretation of specific values of DateTime meaning "unknown", just
        //  track the items separately. It'll be annoyingly verbose, but doable.
        // Note: Leave the "BC/BCE" and "AD/CE" debate for the UI and only represent the year in
        // the DB as "+/-".
        [Required]
        public int Year { get; set; } = -99999; // default value ridiculous
        public int? Month { get; set; }
        public int? Day { get; set; }
        public int? Hour { get; set; }
        public int? Min { get; set; }

        public EventTime()
        {
        }

        public EventTime(EventTime other)
        {
            Year = other.Year;
            Month = other.Month;
            Day = other.Day;
            Hour = other.Hour;
            Min = other.Min;
        }

        public bool Equals(EventTime? other)
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

            // Note: If the object type is the same, then it can be guaranteed cast to this object
            // without risk of null.
            return Same((other as EventTime)!);
        }

        public static bool operator ==(EventTime? left, EventTime? right)
        {
            if (ReferenceEquals(left, right)) return true;
            if (left is null) return false;
            if (right is null) return false;
            return left.Same(right);
        }

        public static bool operator !=(EventTime? left, EventTime? right)
        {
            if (ReferenceEquals(left, right)) return false;
            if (left is null) return false;
            if (right is null) return false;
            return !left.Same(right);
        }

        private bool Same(EventTime other)
        {
            bool same = true;
            //same &= Id == other.Id;

            same &= Year == other.Year;
            same &= Month == other.Month;
            same &= Day == other.Day;
            same &= Hour == other.Hour;
            same &= Min == other.Min;

            return same;
        }

        public override int GetHashCode()
        {
            var hash = new HashCode();
            hash.Add(Id);
            hash.Add(Year);
            hash.Add(Month);
            hash.Add(Day);
            hash.Add(Hour);
            hash.Add(Min);
            return hash.ToHashCode();
        }
    }
}
