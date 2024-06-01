using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebAPI.Models;

namespace EventSourceAuthorUnitTesting
{
    [TestClass]
    public class Constructor
    {
        [TestMethod]
        public void HasDefaultConstructor()
        {
            var obj = new EventSourceAuthor();
            Assert.IsNotNull(obj);
        }

        [TestMethod]
        public void DefaultValues()
        {
            var obj = new EventSourceAuthor();
            Assert.AreEqual(obj.Id, Guid.Empty);
            Assert.IsNull(obj.Name);
        }

        [TestMethod]
        public void CopyConstructor()
        {
            var obj = TestValues.Create();
            var copy = new EventSourceAuthor(obj);
            Assert.AreEqual(obj.Id, Guid.Empty);
            Assert.IsNull(obj.Name);
        }
    }

    [TestClass]
    public class Equals
    {
        [TestMethod]
        public void SameRefEqual()
        {
            var EventSourceAuthor = TestValues.Create();
            var ref1 = EventSourceAuthor;
            var ref2 = EventSourceAuthor;
            Assert.IsTrue(ref1.Equals(ref2));
            Assert.IsTrue(ref1 == ref2);
            Assert.IsFalse(ref1 != ref2);
            Assert.IsTrue(ref1.GetHashCode() == ref2.GetHashCode());
        }

        [TestMethod]
        public void DiffReferenceSameValuesEqual()
        {
            var ref1 = TestValues.Create();
            var ref2 = new EventSourceAuthor(ref1);
            Assert.IsTrue(ref1.Equals(ref2));
            Assert.IsTrue(ref1 == ref2);
            Assert.IsFalse(ref1 != ref2);
            Assert.IsTrue(ref1.GetHashCode() == ref2.GetHashCode());
        }

        [TestMethod]
        public void IdChangedNotEqual()
        {
            var eventSourceAuthor1 = TestValues.Create();
            var eventSourceAuthor2 = new EventSourceAuthor(eventSourceAuthor1)
            {
                Id = Guid.NewGuid()
            };
            Assert.IsFalse(eventSourceAuthor1.Equals(eventSourceAuthor2));
            Assert.IsFalse(eventSourceAuthor1 == eventSourceAuthor2);
            Assert.IsTrue(eventSourceAuthor1 != eventSourceAuthor2);
            Assert.IsFalse(eventSourceAuthor1.GetHashCode() == eventSourceAuthor2.GetHashCode());
        }

        [TestMethod]
        public void NameChangedNotEqual()
        {
            var eventSourceAuthor1 = TestValues.Create();
            var eventSourceAuthor2 = new EventSourceAuthor(eventSourceAuthor1)
            {
                Name = "James the Burgundy"
            };
            Assert.IsFalse(eventSourceAuthor1.Equals(eventSourceAuthor2));
            Assert.IsFalse(eventSourceAuthor1 == eventSourceAuthor2);
            Assert.IsTrue(eventSourceAuthor1 != eventSourceAuthor2);
            Assert.IsFalse(eventSourceAuthor1.GetHashCode() == eventSourceAuthor2.GetHashCode());
        }
    }

    class TestValues
    {
        public static EventSourceAuthor Create()
        {
            return new EventSourceAuthor
            {
                Id = Guid.NewGuid(),
                Name = "Steve the Wanderer"
            };
        }
    }
}
