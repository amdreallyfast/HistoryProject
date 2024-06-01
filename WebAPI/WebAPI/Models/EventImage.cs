using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    // Separated off into its own table so that it can be assigned in a different filegroup that operates like a filesystem.
    //??how do I get a default image into the database??
    // TODO:
    //  1. store images in a table that is created in a separate file group
    //      https://stackoverflow.com/questions/5613898/storing-images-in-sql-server
    //      https://stackoverflow.com/questions/69084661/create-a-table-in-different-file-group-with-ef-core-code-first
    //      https://stackoverflow.com/questions/4653095/how-to-store-images-using-entity-framework-code-first-ctp-5
    //  2. ??Use a default image or force the use of an image, even if it's just an image of the source??
    public class EventImage : IEquatable<EventImage>
    {
        [Key]
        public Guid Id { get; set; }

        public byte[] ImageBinary { get; set; } = Array.Empty<byte>();

        public EventImage()
        {
        }

        public EventImage(EventImage other)
        {
            Id = other.Id;
            ImageBinary = other.ImageBinary;
        }

        public bool Equals(EventImage? other)
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
            return Same((other as EventImage)!);
        }

        public static bool operator ==(EventImage? left, EventImage? right)
        {
            if (ReferenceEquals(left, right)) return true;
            if (left is null) return false;
            if (right is null) return false;
            return left.Same(right);
        }

        public static bool operator !=(EventImage? left, EventImage? right)
        {
            if (ReferenceEquals(left, right)) return false;
            if (left is null) return false;
            if (right is null) return false;
            return !left.Same(right);
        }

        public override int GetHashCode()
        {
            // Ignore array of binary. Extremely unlikely that anyone is going to change a single
            // byte in the array. Id is enough.
            HashCode hash = new();
            hash.Add(Id);
            return hash.ToHashCode();
        }

        private bool Same(EventImage other)
        {
            // Ignore array of binary. Extremely unlikely that anyone is going to change a single
            // byte in the array. Id is enough.
            bool same = true;
            same &= Id == other.Id;
            return same;
        }
    }
}
