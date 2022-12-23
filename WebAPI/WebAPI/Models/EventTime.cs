using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    // Used in place of DateTime so that it would be easier to pretty print historical dates and
    // only mention the dates and times when they are known.
    // Note: DateTime does not accept null or negative values for any part of it, but only 1s for
    // the minimum date and 0s for the minimum time. There may be edge case events that occur
    // around that time period, and I don't want to misrepresent the time.
    // Ex: Suppose an event occurred in ~1000BC. We don't know the month, much less the day and
    // the hour. The UI will need to parse this info and know to only print the year.
    // Ex: The Attack on Pearl Harbor occurred at a precisely recorded time. The UI will need to
    // be able to recognize this and print accordingly.
    public class EventTime : IEquatable<EventTime>
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        // Note: Leave the "BC/BCE" and "AD/CE" debate for the UI and only represent the year in
        // the DB as "+/-".
        [Required]
        public int LowerBoundYear { get; set; } = -1337;
        public int? LowerBoundMonth { get; set; }
        public int? LowerBoundDay { get; set; }
        public int? LowerBoundHour { get; set; }
        public int? LowerBoundMin { get; set; }

        [Required]
        public int UpperBoundYear { get; set; } = -1337;
        public int? UpperBoundMonth { get; set; }
        public int? UpperBoundDay { get; set; }
        public int? UpperBoundHour { get; set; }
        public int? UpperBoundMin { get; set; }

        public EventTime()
        {
        }

        public EventTime(EventTime other)
        {
            LowerBoundYear = other.LowerBoundYear;
            LowerBoundMonth = other.LowerBoundMonth;
            LowerBoundDay = other.LowerBoundDay;
            LowerBoundHour = other.LowerBoundHour;
            LowerBoundMin = other.LowerBoundMin;

            UpperBoundYear = other.UpperBoundYear;
            UpperBoundMonth = other.UpperBoundMonth;
            UpperBoundDay = other.UpperBoundDay;
            UpperBoundHour = other.UpperBoundHour;
            UpperBoundMin = other.UpperBoundMin;
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

            same &= LowerBoundYear == other.LowerBoundYear;
            same &= LowerBoundMonth == other.LowerBoundMonth;
            same &= LowerBoundDay == other.LowerBoundDay;
            same &= LowerBoundHour == other.LowerBoundHour;
            same &= LowerBoundMin == other.LowerBoundMin;

            same &= UpperBoundYear == other.UpperBoundYear;
            same &= UpperBoundMonth == other.UpperBoundMonth;
            same &= UpperBoundDay == other.UpperBoundDay;
            same &= UpperBoundHour == other.UpperBoundHour;
            same &= UpperBoundMin == other.UpperBoundMin;

            return same;
        }

        public override int GetHashCode()
        {
            var hash = new HashCode();
            hash.Add(Id);
            hash.Add(LowerBoundYear);
            hash.Add(LowerBoundMonth);
            hash.Add(LowerBoundDay);
            hash.Add(LowerBoundHour);
            hash.Add(LowerBoundMin);
            hash.Add(UpperBoundYear);
            hash.Add(UpperBoundMonth);
            hash.Add(UpperBoundDay);
            hash.Add(UpperBoundHour);
            hash.Add(UpperBoundMin);
            return hash.ToHashCode();
        }
    }

    // Testing:
    //var time1 = new time
    //{
    //    Year = 1,
    //    Month = 2,
    //    Day = 3,
    //    Hour = 4,
    //    Min = 5
    //};
    //var time2 = new time
    //{
    //    Year = 1,
    //    Month = 2,
    //    Day = 3,
    //    Hour = 4,
    //    Min = 5
    //};
    //Console.WriteLine("time test:");
    //var t1 = time1;
    //var t2 = time1;
    //Console.WriteLine($"    same reference:");
    //Console.WriteLine($"        t1.Equals(t2): '${t1.Equals(t2)}'");
    //Console.WriteLine($"        t1 == t2: '${t1 == t2}'");
    //Console.WriteLine($"        t1.GetHashCode() == t2.GetHashCode(): '${t1.GetHashCode() == t2.GetHashCode()}'");

    //t2 = time2;
    //Console.WriteLine($"    different reference, same values:");
    //Console.WriteLine($"        t1.Equals(t2): '${t1.Equals(t2)}'");
    //Console.WriteLine($"        t1 == t2: '${t1 == t2}'");
    //Console.WriteLine($"        t1.GetHashCode() == t2.GetHashCode(): '${t1.GetHashCode() == t2.GetHashCode()}'");

    //t2.Year = 5;
    //Console.WriteLine($"    different reference, different values:");
    //Console.WriteLine($"        t1.Equals(t2): '${t1.Equals(t2)}'");
    //Console.WriteLine($"        t1 == t2: '${t1 == t2}'");
    //Console.WriteLine($"        t1.GetHashCode() == t2.GetHashCode(): '${t1.GetHashCode() == t2.GetHashCode()}'");
    //Console.WriteLine("");
}
