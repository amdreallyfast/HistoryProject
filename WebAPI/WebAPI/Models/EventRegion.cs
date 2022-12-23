using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class EventRegion : IEquatable<EventRegion>
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public List<EventLocation> Locations { get; set; } = new List<EventLocation>();

        public EventRegion()
        {
        }

        public EventRegion(EventRegion other)
        {
            foreach (var location in other.Locations)
            {
                Locations.Add(new EventLocation
                {
                    Latitude = location.Latitude,
                    Longitude = location.Longitude,
                });
            }
        }

        public static EventRegion FromListOfTuples(List<Tuple<double,double>> tuples)
        {
            var newRegion = new EventRegion();
            foreach (var tuple in tuples)
            {
                newRegion.Locations.Add(new EventLocation
                {
                    Latitude = tuple.Item1,
                    Longitude = tuple.Item2,
                });
            }
            return newRegion;
        }

        public bool Equals(EventRegion? other)
        {
            if (ReferenceEquals(this, other)) return true;
            if (other is null) return false;
            return Same(other);
        }

        public override bool Equals(object? other)
        {
            if (ReferenceEquals(this, other)) return true;
            if (ReferenceEquals(null, other)) return false;
            if (this.GetType() != other.GetType()) return false;

            // Note: If the object type is the same, then it can be guaranteed cast to this object
            // without risk of null.
            return Same((other as EventRegion)!);
        }

        public static bool operator ==(EventRegion? left, EventRegion? right)
        {
            if (ReferenceEquals(left, right)) return true;
            if (left is null) return false;
            if (right is null) return false;
            return left.Same(right);
        }

        public static bool operator !=(EventRegion? left, EventRegion? right)
        {
            if (ReferenceEquals(left, right)) return false;
            if (left is null) return false;
            if (right is null) return false;
            return !left.Same(right);
        }

        private bool Same(EventRegion other)
        {
            if (Locations.Count != other.Locations.Count) return false;

            bool same = true;
            //same &= Id == other.Id;
            for (int i = 0; i < Locations.Count; i++)
            {
                same &= Locations[i] == other.Locations[i];
            }

            return same;
        }

        public override int GetHashCode()
        {
            HashCode hash = new HashCode();
            foreach (var location in Locations)
            {
                hash.Add(location);
            }
            return hash.ToHashCode();
        }
    }

    // Testing
    //var region1 = new EventRegion
    //{
    //    Locations = new List<EventLocation>
    //    {
    //        new EventLocation { Latitude = 1.11, Longitude = 9.99 },
    //        new EventLocation { Latitude = 2.22, Longitude = 8.88 },
    //        new EventLocation { Latitude = 3.33, Longitude = 7.77 }
    //    }
    //};

    //var region2 = new EventRegion
    //{
    //    Id = region1.Id,
    //    Locations = new List<EventLocation>
    //    {
    //        new EventLocation { Latitude = 1.11, Longitude = 9.99 },
    //        new EventLocation { Latitude = 2.22, Longitude = 8.88 },
    //        new EventLocation { Latitude = 3.33, Longitude = 7.77 }
    //    }
    //};

    //Console.WriteLine("Location test:");
    //var r1 = region1;
    //var r2 = region1;
    //Console.WriteLine($"    same reference:");
    //Console.WriteLine($"        r1.Equals(r2): '${r1.Equals(r2)}'");
    //Console.WriteLine($"        r1 == r2: '${r1 == r2}'");
    //Console.WriteLine($"        r1.GetHashCode() == r2.GetHashCode(): '${r1.GetHashCode() == r2.GetHashCode()}'");

    //r2 = region2;
    //Console.WriteLine($"    different reference, same values:");
    //Console.WriteLine($"        r1.Equals(r2): '${r1.Equals(r2)}'");
    //Console.WriteLine($"        r1 == r2: '${r1 == r2}'");
    //Console.WriteLine($"        r1.GetHashCode() == r2.GetHashCode(): '${r1.GetHashCode() == r2.GetHashCode()}'");

    //r2.Locations[2].Longitude = 10;
    //Console.WriteLine($"    different reference, different values:");
    //Console.WriteLine($"        r1.Equals(r2): '${r1.Equals(r2)}'");
    //Console.WriteLine($"        r1 == r2: '${r1 == r2}'");
    //Console.WriteLine($"        r1.GetHashCode() == r2.GetHashCode(): '${r1.GetHashCode() == r2.GetHashCode()}'");
    //Console.WriteLine("");
}
