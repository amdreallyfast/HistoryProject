using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebAPI.Models;

namespace EventImageUnitTesting
{
    //[TestClass]
    //public class Constructor
    //{
    //    [TestMethod]
    //    public void HasDefaultConstructor()
    //    {
    //        var obj = new EventImage();
    //        Assert.IsNotNull(obj);
    //    }

    //    [TestMethod]
    //    public void DefaultValues()
    //    {
    //        var obj = new EventImage();
    //        Assert.AreEqual(obj.Id, Guid.Empty);
    //    }

    //    [TestMethod]
    //    public void CopyConstructor()
    //    {
    //        var obj = TestValues.Create();
    //        var copy = new EventImage(obj);
    //        Assert.AreEqual(obj, copy);
    //    }
    //}

    //[TestClass]
    //public class Equals
    //{
    //    [TestMethod]
    //    public void SameRef()
    //    {
    //        var eventImage = TestValues.Create();
    //        var ref1 = eventImage;
    //        var ref2 = eventImage;
    //        Assert.IsTrue(ref1.Equals(ref2));
    //        Assert.IsTrue(ref1 == ref2);
    //        Assert.IsFalse(ref1 != ref2);
    //        Assert.IsTrue(ref1.GetHashCode() == ref2.GetHashCode());
    //    }

    //    [TestMethod]
    //    public void DiffReferenceSameValuesEqual()
    //    {
    //        var ref1 = TestValues.Create();
    //        var ref2 = new EventImage(ref1);
    //        Assert.IsTrue(ref1.Equals(ref2));
    //        Assert.IsTrue(ref1 == ref2);
    //        Assert.IsFalse(ref1 != ref2);
    //        Assert.IsTrue(ref1.GetHashCode() == ref2.GetHashCode());
    //    }

    //    [TestMethod]
    //    public void IdChangedNotEqual()
    //    {
    //        var eventImage1 = TestValues.Create();
    //        var eventImage2 = new EventImage(eventImage1)
    //        {
    //            Id = Guid.NewGuid()
    //        };
    //        Assert.IsFalse(eventImage1.Equals(eventImage2));
    //        Assert.IsFalse(eventImage1 == eventImage2);
    //        Assert.IsTrue(eventImage1 != eventImage2);
    //        Assert.IsFalse(eventImage1.GetHashCode() == eventImage2.GetHashCode());
    //    }

    //    [TestMethod]
    //    public void ImageChangedNotEqual()
    //    {
    //        var eventImage1 = TestValues.Create();
    //        var eventImage2 = new EventImage(eventImage1)
    //        {
    //            // Should trigger the "not same" logic because we're only doing an array
    //            // reference comparison and not a deep compare.
    //            ImageBinary = new byte[] { 0x00, 0x01, 0x02 }
    //        };
    //        Assert.IsFalse(eventImage1.Equals(eventImage2));
    //        Assert.IsFalse(eventImage1 == eventImage2);
    //        Assert.IsTrue(eventImage1 != eventImage2);
    //        Assert.IsFalse(eventImage1.GetHashCode() == eventImage2.GetHashCode());
    //    }
    //}

    //class TestValues
    //{
    //    public static EventImage Create()
    //    {
    //        return new EventImage
    //        {
    //            Id = Guid.NewGuid(),
    //            ImageBinary = new byte[] { 0x00, 0x01, 0x02 }
    //        };
    //    }
    //}
}
