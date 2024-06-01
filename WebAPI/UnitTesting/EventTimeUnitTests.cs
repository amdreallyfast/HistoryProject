using WebAPI.Models;

namespace EventTimeUnitTesting
{
    //[TestClass]
    //public class Constructor
    //{
    //    [TestMethod]
    //    public void HasDefaultConstructor()
    //    {
    //        var obj = new EventTime();
    //        Assert.IsNotNull(obj);
    //    }

    //    [TestMethod]
    //    public void DefaultValues()
    //    {
    //        var obj = new EventTime();
    //        Assert.IsNotNull(obj.Year);
    //        Assert.IsNull(obj.Month);
    //        Assert.IsNull(obj.Day);
    //        Assert.IsNull(obj.Hour);
    //        Assert.IsNull(obj.Min);
    //    }

    //    [TestMethod]
    //    public void CopyConstructor()
    //    {
    //        var obj = new EventTime { Year = 5, Month = 4, Day = 3, Hour = 2, Min = 1 };
    //        var copy = new EventTime(obj);
    //        Assert.AreEqual(obj, copy);
    //    }
    //}

    //[TestClass]
    //public class Equals
    //{
    //    [TestMethod]
    //    public void SameRef()
    //    {
    //        var time= new EventTime { Year = 5, Month = 4, Day = 3, Hour = 2, Min = 1 };
    //        var ref1 = time;
    //        var ref2 = time;
    //        Assert.IsTrue(ref1.Equals(ref2));
    //        Assert.IsTrue(ref1 == ref2);
    //        Assert.IsFalse(ref1 != ref2);
    //        Assert.IsTrue(ref1.GetHashCode() == ref2.GetHashCode());
    //    }

    //    [TestMethod]
    //    public void DiffRefSameValues()
    //    {
    //        var t1 = new EventTime { Year = 5, Month = 4, Day = 3, Hour = 2, Min = 1 };
    //        var t2 = new EventTime { Year = 5, Month = 4, Day = 3, Hour = 2, Min = 1 };
    //        Assert.IsTrue(t1.Equals(t2));
    //        Assert.IsTrue(t1 == t2);
    //        Assert.IsFalse(t1 != t2);
    //        Assert.IsTrue(t1.GetHashCode() == t2.GetHashCode());
    //    }

    //    [TestMethod]
    //    public void YearChange()
    //    {
    //        var t1 = new EventTime { Year = 5, Month = 4, Day = 3, Hour = 2, Min = 1 };
    //        var t2 = new EventTime { Year = 99, Month = 4, Day = 3, Hour = 2, Min = 1 };
    //        Assert.IsFalse(t1.Equals(t2));
    //        Assert.IsFalse(t1 == t2);
    //        Assert.IsTrue(t1 != t2);
    //        Assert.IsFalse(t1.GetHashCode() == t2.GetHashCode());
    //    }

    //    [TestMethod]
    //    public void MonthChange()
    //    {
    //        var t1 = new EventTime { Year = 5, Month = 4, Day = 3, Hour = 2, Min = 1 };
    //        var t2 = new EventTime { Year = 5, Month = 99, Day = 3, Hour = 2, Min = 1 };
    //        Assert.IsFalse(t1.Equals(t2));
    //        Assert.IsFalse(t1 == t2);
    //        Assert.IsTrue(t1 != t2);
    //        Assert.IsFalse(t1.GetHashCode() == t2.GetHashCode());
    //    }

    //    [TestMethod]
    //    public void DayChange()
    //    {
    //        var t1 = new EventTime { Year = 5, Month = 4, Day = 3, Hour = 2, Min = 1 };
    //        var t2 = new EventTime { Year = 5, Month = 4, Day = 99, Hour = 2, Min = 1 };
    //        Assert.IsFalse(t1.Equals(t2));
    //        Assert.IsFalse(t1 == t2);
    //        Assert.IsTrue(t1 != t2);
    //        Assert.IsFalse(t1.GetHashCode() == t2.GetHashCode());
    //    }

    //    [TestMethod]
    //    public void HourChange()
    //    {
    //        var t1 = new EventTime { Year = 5, Month = 4, Day = 3, Hour = 2, Min = 1 };
    //        var t2 = new EventTime { Year = 5, Month = 4, Day = 3, Hour = 99, Min = 1 };
    //        Assert.IsFalse(t1.Equals(t2));
    //        Assert.IsFalse(t1 == t2);
    //        Assert.IsTrue(t1 != t2);
    //        Assert.IsFalse(t1.GetHashCode() == t2.GetHashCode());
    //    }

    //    [TestMethod]
    //    public void MinuteChange()
    //    {
    //        var t1 = new EventTime { Year = 5, Month = 4, Day = 3, Hour = 2, Min = 1 };
    //        var t2 = new EventTime { Year = 5, Month = 4, Day = 3, Hour = 2, Min = 99 };
    //        Assert.IsFalse(t1.Equals(t2));
    //        Assert.IsFalse(t1 == t2);
    //        Assert.IsTrue(t1 != t2);
    //        Assert.IsFalse(t1.GetHashCode() == t2.GetHashCode());
    //    }
    //}
}