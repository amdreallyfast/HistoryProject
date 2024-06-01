using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebAPI.Models;

namespace EventImageUnitTesting
{
    [TestClass]
    public class Constructor
    {
        [TestMethod]
        public void HasDefaultConstructor()
        {
            var obj = new EventImage();
            Assert.IsNotNull(obj);
        }

        [TestMethod]
        public void DefaultValues()
        {
            var obj = new EventImage();
            Assert.IsTrue(obj.Value == string.Empty);
        }

        [TestMethod]
        public void CopyConstructor()
        {
            var obj = new EventImage { }
            var copy = new Tag(obj);
            Assert.AreEqual(obj, copy);
        }
    }

    [TestClass]
    public class Equals
    {

    }

    class TestValues
    {
        public static EventImage Create()
        {
            return new EventImage
            {
                Id = Guid.NewGuid(),
                ImageBinary = new byte[] { 0x00, 0x01, 0x02 }
            };
        }
    }
}
