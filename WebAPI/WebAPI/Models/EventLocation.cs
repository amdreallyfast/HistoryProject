using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class EventLocation //: IEquatable<EventLocation>
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public double Latitude { get; set; }

        [Required]
        public double Longitude { get; set; }

        //public bool Equals(EventLocation? other)
        //{
        //    if (ReferenceEquals(this, other)) return true;
        //    if (other is null) return false;
        //    return Same(other);
        //}

        //public override bool Equals(object? other)
        //{
        //    if (ReferenceEquals(this, other)) return true;
        //    if (other is null) return false;
        //    if (this.GetType() != other.GetType()) return false;

        //    // Note: If the object type is the same, then it can be guaranteed cast to this object
        //    // without risk of null.
        //    return Same((other as EventLocation)!);
        //}

        //public static bool operator ==(EventLocation? left, EventLocation? right)
        //{
        //    if (ReferenceEquals(left, right)) return true;
        //    if (left is null) return false;
        //    if (right is null) return false;
        //    return left.Same(right);
        //}

        //public static bool operator !=(EventLocation? left, EventLocation? right)
        //{
        //    if (ReferenceEquals(left, right)) return false;
        //    if (left is null) return false;
        //    if (right is null) return false;
        //    return !left.Same(right);
        //}

        //private bool Same(EventLocation other)
        //{
        //    bool same = true;
        //    //same &= Id == other.Id;
        //    same &= Latitude == other.Latitude;
        //    same &= Longitude == other.Longitude;

        //    return same;
        //}

        //public override int GetHashCode()
        //{
        //    return HashCode.Combine(Id, Latitude, Longitude);
        //}
    }

    // Testing
    //var location1 = new Location
    //{
    //    Latitude = 1.2345,
    //    Longitude = 6.78901,
    //};

    //var location2 = new Location
    //{
    //    Latitude = 1.2345,
    //    Longitude = 6.78901,
    //};

    //Console.WriteLine("Location test:");
    //var l1 = location1;
    //var l2 = location1;
    //Console.WriteLine($"    same reference:");
    //Console.WriteLine($"        l1.Equals(l2): '${l1.Equals(l2)}'");
    //Console.WriteLine($"        l1 == l2: '${l1 == l2}'");
    //Console.WriteLine($"        l1.GetHashCode() == l2.GetHashCode(): '${l1.GetHashCode() == l2.GetHashCode()}'");

    //l2 = location2;
    //Console.WriteLine($"    different reference, same values:");
    //Console.WriteLine($"        l1.Equals(l2): '${l1.Equals(l2)}'");
    //Console.WriteLine($"        l1 == l2: '${l1 == l2}'");
    //Console.WriteLine($"        l1.GetHashCode() == l2.GetHashCode(): '${l1.GetHashCode() == l2.GetHashCode()}'");

    //l2.Longitude = 3.14159;
    //Console.WriteLine($"    different reference, different values:");
    //Console.WriteLine($"        l1.Equals(l2): '${l1.Equals(l2)}'");
    //Console.WriteLine($"        l1 == l2: '${l1 == l2}'");
    //Console.WriteLine($"        l1.GetHashCode() == l2.GetHashCode(): '${l1.GetHashCode() == l2.GetHashCode()}'");
    //Console.WriteLine("");
}
