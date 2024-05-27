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
            Assert.IsTrue(obj.Value == string.Empty);
        }

        [TestMethod]
        public void CopyConstructor()
        {
            var obj = new Tag { Value = "thingsAndSuch" };
            var copy = new Tag(obj);
            Assert.Equals(obj, copy);
        }
    }

    [TestClass]
    public class Equals
    {
        [TestMethod]
        public void SameRef()
        {
            var tags = new Tag { Value = "thingsAndSuch" };
            var ref1 = tags;
            var ref2 = tags;
            Assert.IsTrue(ref1.Equals(ref2));
            Assert.IsTrue(ref1 == ref2);
            Assert.IsFalse(ref1 != ref2);
            Assert.IsTrue(ref1.GetHashCode() == ref2.GetHashCode());
        }

        [TestMethod]
        public void DiffRefSameValues()
        {
            var tags1 = new Tag { Value = "thingsAndSuch" };
            var tags2 = new Tag { Value = "thingsAndSuch" };
            Assert.IsTrue(tags1.Equals(tags2));
            Assert.IsTrue(tags1 == tags2);
            Assert.IsFalse(tags1 != tags2);
            Assert.IsTrue(tags1.GetHashCode() == tags2.GetHashCode());
        }

        [TestMethod]
        public void ValueChanged()
        {
            var tags1 = new Tag { Value = "thingsAndSuch" };
            var tags2 = new Tag { Value = "otherSuchThings" };
            Assert.IsFalse(tags1.Equals(tags2));
            Assert.IsFalse(tags1 == tags2);
            Assert.IsTrue(tags1 != tags2);
            Assert.IsFalse(tags1.GetHashCode() == tags2.GetHashCode());
        }
    }
}
