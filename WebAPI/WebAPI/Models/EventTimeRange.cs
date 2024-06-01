using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    //public class EventTimeRange : IEquatable<EventTimeRange>
    //{
    //    [Key]
    //    public Guid Id { get; set; }

    //    [Required]
    //    public EventTime LowerBound { get; set; } = new EventTime();

    //    [Required]
    //    public EventTime UpperBound { get; set; } = new EventTime();        

    //    public EventTimeRange() 
    //    {
    //    }

    //    public EventTimeRange(EventTimeRange other)
    //    {
    //        LowerBound = other.LowerBound;
    //        UpperBound = other.UpperBound;
    //    }

    //    public bool Equals(EventTimeRange? other)
    //    {
    //        if (ReferenceEquals(this, other)) return true;
    //        if (other is null) return false;
    //        return Same(other);
    //    }

    //    public override bool Equals(object? other)
    //    {
    //        if (ReferenceEquals(this, other)) return true;
    //        if (other is null) return false;
    //        if (this.GetType() != other.GetType()) return false;
    //        return Same((other as EventTimeRange)!);    // use "!" to tell compiler, "I guarantee that this will not be null"
    //    }

    //    public static bool operator ==(EventTimeRange? left, EventTimeRange? right)
    //    {
    //        if (ReferenceEquals(left, right)) return true;
    //        if (left is null) return false;
    //        if (right is null) return false;
    //        return left.Same(right);
    //    }

    //    public static bool operator !=(EventTimeRange? left, EventTimeRange? right)
    //    {
    //        if (ReferenceEquals(left, right)) return false;
    //        if (left is null) return false;
    //        if (right is null) return false;
    //        return !left.Same(right);
    //    }

    //    private bool Same(EventTimeRange other)
    //    {
    //        bool same = true;

    //        same &= LowerBound == other.LowerBound;
    //        same &= UpperBound == other.UpperBound;

    //        return same;
    //    }

    //    public override int GetHashCode()
    //    {
    //        var hash = new HashCode();
    //        hash.Add(LowerBound.GetHashCode());
    //        hash.Add(UpperBound.GetHashCode());
    //        return hash.ToHashCode();
    //    }
    //}
}
