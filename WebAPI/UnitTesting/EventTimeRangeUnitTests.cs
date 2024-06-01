using WebAPI.Models;

namespace EventTimeRangeUnitTesting
{
    //[TestClass]
    //public class Constructor
    //{
    //    [TestMethod]
    //    public void HasDefaultConstructor()
    //    {
    //        var obj = new EventTimeRange();
    //        Assert.IsNotNull(obj);
    //    }

    //    [TestMethod]
    //    public void DefaultValues()
    //    {
    //        var obj = new EventTimeRange();
    //        Assert.IsNotNull(obj.LowerBound);
    //        Assert.IsNotNull(obj.UpperBound);
    //    }

    //    [TestMethod]
    //    public void CopyConstructor()
    //    {
    //        var obj = TestValues.CreateDefault();
    //        var copy = new EventTimeRange(obj);
    //        Assert.AreEqual(obj, copy);
    //    }
    //}

    //[TestClass]
    //public class Equals
    //{
    //    [TestMethod]
    //    public void SameRef()
    //    {
    //        var timeRange = TestValues.CreateDefault();
    //        var tr1 = timeRange;
    //        var tr2 = timeRange;
    //        Assert.IsTrue(tr1.Equals(tr2));
    //        Assert.IsTrue(tr1 == tr2);
    //        Assert.IsFalse(tr1 != tr2);
    //        Assert.IsTrue(tr1.GetHashCode() == tr2.GetHashCode());
    //    }

    //    [TestMethod]
    //    public void DiffRefSameValues()
    //    {
    //        var tr1 = TestValues.CreateDefault();
    //        var tr2 = TestValues.CreateDefault();
    //        Assert.IsTrue(tr1.Equals(tr2));
    //        Assert.IsTrue(tr1 == tr2);
    //        Assert.IsFalse(tr1 != tr2);
    //        Assert.IsTrue(tr1.GetHashCode() == tr2.GetHashCode());
    //    }

    //    [TestMethod]
    //    public void LowerBoundChanges()
    //    {
    //        var tr1 = TestValues.CreateDefault();
    //        var tr2 = TestValues.CreateDefault();
    //        tr2.LowerBound.Year = 99;
    //        Assert.IsFalse(tr1.Equals(tr2));
    //        Assert.IsFalse(tr1 == tr2);
    //        Assert.IsTrue(tr1 != tr2);
    //        Assert.IsFalse(tr1.GetHashCode() == tr2.GetHashCode());
    //    }

    //    [TestMethod]
    //    public void UpperBoundChanges()
    //    {
    //        var tr1 = TestValues.CreateDefault();
    //        var tr2 = TestValues.CreateDefault();
    //        tr2.UpperBound.Year = 99;
    //        Assert.IsFalse(tr1.Equals(tr2));
    //        Assert.IsFalse(tr1 == tr2);
    //        Assert.IsTrue(tr1 != tr2);
    //        Assert.IsFalse(tr1.GetHashCode() == tr2.GetHashCode());
    //    }
    //}

    //class TestValues
    //{
    //    public static EventTimeRange CreateDefault()
    //    {
    //        var lb = new EventTime { Year = 5, Month = 4, Day = 3, Hour = 2, Min = 1 };
    //        var up = new EventTime { Year = 10, Month = 4, Day = 3, Hour = 2, Min = 1 };
    //        var obj = new EventTimeRange
    //        {
    //            LowerBound = lb,
    //            UpperBound = up,
    //        };

    //        return obj;
    //    }
    //}
}