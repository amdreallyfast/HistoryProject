using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class EventSummary : IEquatable<EventSummary>
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(2048)]
        public string Text { get; set; } = string.Empty;

        public bool Equals(EventSummary? other)
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
            return Same((other as EventSummary)!);
        }

        public static bool operator ==(EventSummary? left, EventSummary? right)
        {
            if (ReferenceEquals(left, right)) return true;
            if (left is null) return false;
            if (right is null) return false;
            return left.Same(right);
        }

        public static bool operator !=(EventSummary? left, EventSummary? right)
        {
            if (ReferenceEquals(left, right)) return false;
            if (left is null) return false;
            if (right is null) return false;
            return !left.Same(right);
        }

        private bool Same(EventSummary other)
        {
            bool same = true;
            //same &= Id == other.Id;
            same &= Text == other.Text;

            return same;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Id, Text);
        }
    }

    // Testing
    //var summary1 = new EventSummary
    //{
    //    Text = "and then there were three!"
    //};

    //var summary2 = new EventSummary
    //{
    //    Text = "and then there were three!"
    //};

    //Console.WriteLine("Summary test:");
    //var s1 = summary1;
    //var s2 = summary1;
    //Console.WriteLine($"    same reference:");
    //Console.WriteLine($"        s1.Equals(s2): '${s1.Equals(s2)}'");
    //Console.WriteLine($"        s1 == s2: '${s1 == s2}'");
    //Console.WriteLine($"        s1.GetHashCode() == s2.GetHashCode(): '${s1.GetHashCode() == s2.GetHashCode()}'");

    //s2 = summary2;
    //Console.WriteLine($"    different reference, same values:");
    //Console.WriteLine($"        s1.Equals(s2): '${s1.Equals(s2)}'");
    //Console.WriteLine($"        s1 == s2: '${s1 == s2}'");
    //Console.WriteLine($"        s1.GetHashCode() == s2.GetHashCode(): '${s1.GetHashCode() == s2.GetHashCode()}'");

    //s2.Text = "there are four lights!";
    //Console.WriteLine($"    different reference, different values:");
    //Console.WriteLine($"        s1.Equals(s2): '${s1.Equals(s2)}'");
    //Console.WriteLine($"        s1 == s2: '${s1 == s2}'");
    //Console.WriteLine($"        s1.GetHashCode() == s2.GetHashCode(): '${s1.GetHashCode() == s2.GetHashCode()}'");
    //Console.WriteLine("");
}
