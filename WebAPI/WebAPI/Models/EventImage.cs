using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Runtime.CompilerServices;

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

        private byte[] imageBinary = Array.Empty<byte>();
        [Required]
        public byte[] ImageBinary { 
            get { return imageBinary; }
            set
            {
                imageBinary = value;
                const string formatAsHex = "x2";
                using (var md5 = new System.Security.Cryptography.HMACMD5())
                {
                    var md5ByteArr = md5.ComputeHash(imageBinary);
                    ImageMD5 = string.Concat(md5ByteArr.Select(x => x.ToString(formatAsHex)));
                }
            }
        }

        [Required]
        public string ImageMD5 { get; private set; } = string.Empty!;

        public EventImage()
        {
        }

        public EventImage(EventImage other)
        {
            Id = other.Id;
            other.ImageBinary.CopyTo(ImageBinary, 0);
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
            bool same = true;
            same &= Id == other.Id;

            // Only valid on same reference. Don't bother with a deep compare. Extremely
            // unlikely that anyone is going to change a single byte in the array.
            // Note: I'm considering the possibility that this class will be serialized to a JSON
            // string and then re-formed into the class, in which case it will be a different
            // array with the same values as the source, but I'll deal with that when I come to
            // it. I might be able to skirt that comparison.
            same &= ImageBinary == other.ImageBinary;
            return same;
        }
    }
}
