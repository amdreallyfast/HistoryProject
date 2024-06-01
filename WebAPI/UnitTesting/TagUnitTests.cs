using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebAPI.Models;

namespace TagUnitTesting
{
    [TestClass]
    public class Constructor
    {
        [TestMethod]
        public void HasDefaultConstructor()
        {
            var obj = new Tag();
            Assert.IsNotNull(obj);
        }

        [TestMethod]
        public void DefaultValues()
        {
            var obj = new Tag();
            Assert.IsNull(obj.Value);
        }

        [TestMethod]
        public void CopyConstructor()
        {
            var obj = new Tag { Value = "thingsAndSuch" };
            var copy = new Tag(obj);
            Assert.AreEqual(obj, copy);
        }
    }

    [TestClass]
    public class Equals
    {
        [TestMethod]
        public void SameRef()
        {
            var tag = TestValues.Create();
            var ref1 = tag;
            var ref2 = tag;
            Assert.IsTrue(ref1.Equals(ref2));
            Assert.IsTrue(ref1 == ref2);
            Assert.IsFalse(ref1 != ref2);
            Assert.IsTrue(ref1.GetHashCode() == ref2.GetHashCode());
        }

        [TestMethod]
        public void DiffReferenceSameValuesEqual()
        {
            throw new NotImplementedException();
        }

        [TestMethod]
        public void IdChangedNotEqual()
        {
            var tag1 = TestValues.Create();
            var tag2 = new Tag(tag1)
            {
                Id = Guid.NewGuid()
            };
            Assert.IsFalse(tag1.Equals(tag2));
            Assert.IsFalse(tag1 == tag2);
            Assert.IsTrue(tag1 != tag2);
            Assert.IsFalse(tag1.GetHashCode() == tag2.GetHashCode());
        }

        [TestMethod]
        public void ValueChangedNotEqual()
        {
            var tag1 = TestValues.Create();
            var tag2 = new Tag(tag1)
            {
                Value = "Another tag"
            };
            Assert.IsFalse(tag1.Equals(tag2));
            Assert.IsFalse(tag1 == tag2);
            Assert.IsTrue(tag1 != tag2);
            Assert.IsFalse(tag1.GetHashCode() == tag2.GetHashCode());
        }
    }

    class TestValues
    {
        public static Tag Create()
        {
            return new Tag
            {
                Id = Guid.NewGuid(),
                Value = "Test tag"
            };
        }
    }
}
