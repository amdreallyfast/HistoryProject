using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebAPI.Models;

namespace UnitTesting
{
    // ImageMD5Hash is how Create recognizes an unchanged image so a new revision can share the
    // existing row. It must be deterministic: it previously used a randomly keyed HMACMD5, so the
    // same bytes hashed differently every time and no duplicate could ever be detected.
    [TestClass]
    public class ImageHashTests
    {
        [TestMethod]
        public void SameBytesGiveSameHash()
        {
            var bytes = new byte[] { 0xff, 0xd8, 0xff, 0xe0, 1, 2, 3 };
            var a = new EventImage { ImageBinary = bytes };
            var b = new EventImage { ImageBinary = (byte[])bytes.Clone() };
            Assert.AreEqual(a.ImageMD5Hash, b.ImageMD5Hash);
        }

        [TestMethod]
        public void DifferentBytesGiveDifferentHash()
        {
            var a = new EventImage { ImageBinary = new byte[] { 0xff, 0xd8, 0xff, 0xe0, 1 } };
            var b = new EventImage { ImageBinary = new byte[] { 0xff, 0xd8, 0xff, 0xe0, 2 } };
            Assert.AreNotEqual(a.ImageMD5Hash, b.ImageMD5Hash);
        }

        // Known MD5 values, in the exact format the FixImageMD5Hash migration's SQL produces
        // (LOWER(CONVERT(varchar(32), HASHBYTES('MD5', ...), 2))): 32 lowercase hex chars, no prefix.
        [TestMethod]
        public void MatchesStandardMD5Format()
        {
            Assert.AreEqual("900150983cd24fb0d6963f7d28e17f72", new EventImage { ImageBinary = "abc"u8.ToArray() }.ImageMD5Hash);
            Assert.AreEqual("d41d8cd98f00b204e9800998ecf8427e", new EventImage { ImageBinary = System.Array.Empty<byte>() }.ImageMD5Hash);
        }
    }
}
