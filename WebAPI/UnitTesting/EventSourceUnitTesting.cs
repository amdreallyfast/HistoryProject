using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebAPI.Models;

namespace EventSourceUnitTesting
{
    [TestClass]
    public class Constructor
    {
        [TestMethod]
        public void DefaultValues()
        {
            var obj = new EventSource();
            Assert.AreEqual(obj.Id, Guid.Empty);
            Assert.IsNull(obj.ISBN);
            Assert.IsNull(obj.Title);
            Assert.IsNull(obj.Where);
            Assert.IsNull(obj.Authors);
            Assert.AreEqual(obj.PublicationLBYear, -99999);
            Assert.IsNull(obj.PublicationLBMonth);
            Assert.IsNull(obj.PublicationLBDay);
            Assert.AreEqual(obj.PublicationUBYear, +999999);
            Assert.IsNull(obj.PublicationUBMonth);
            Assert.IsNull(obj.PublicationUBDay);
        }

        [TestMethod]
        public void CopyConstructor()
        {
            var obj = TestValues.Create();
            var copy = new EventSource(obj);
            Assert.AreEqual(obj.Id, copy.Id);
            Assert.AreEqual(obj.ISBN, copy.ISBN);
            Assert.AreEqual(obj.Title, copy.Title);
            Assert.AreEqual(obj.Where, copy.Where);
            Assert.AreEqual(obj.Authors, copy.Authors);
            Assert.AreEqual(obj.PublicationLBYear, copy.PublicationLBYear);
            Assert.AreEqual(obj.PublicationLBMonth, copy.PublicationLBMonth);
            Assert.AreEqual(obj.PublicationLBDay, copy.PublicationLBDay);
            Assert.AreEqual(obj.PublicationUBYear, copy.PublicationUBYear);
            Assert.AreEqual(obj.PublicationUBMonth, copy.PublicationUBMonth);
            Assert.AreEqual(obj.PublicationUBDay, copy.PublicationUBDay);
        }
    }

    [TestClass]
    public class Equals
    {
        [TestMethod]
        public void SameRefEqual()
        {
            var EventSource = TestValues.Create();
            var ref1 = EventSource;
            var ref2 = EventSource;
            Assert.IsTrue(ref1.Equals(ref2));
            Assert.IsTrue(ref1 == ref2);
            Assert.IsFalse(ref1 != ref2);
            Assert.IsTrue(ref1.GetHashCode() == ref2.GetHashCode());
        }

        [TestMethod]
        public void DiffReferenceSameValuesEqual()
        {
            var ref1 = TestValues.Create();
            var ref2 = new EventSource(ref1);
            Assert.IsTrue(ref1.Equals(ref2));
            Assert.IsTrue(ref1 == ref2);
            Assert.IsFalse(ref1 != ref2);
            Assert.IsTrue(ref1.GetHashCode() == ref2.GetHashCode());
        }

        [TestMethod]
        public void IdChangedNotEqual()
        {
            var eventSource1 = TestValues.Create();
            var eventSource2 = new EventSource(eventSource1)
            {
                Id = Guid.NewGuid()
            };
            Assert.IsFalse(eventSource1.Equals(eventSource2));
            Assert.IsFalse(eventSource1 == eventSource2);
            Assert.IsTrue(eventSource1 != eventSource2);
            Assert.IsFalse(eventSource1.GetHashCode() == eventSource2.GetHashCode());
        }

        [TestMethod]
        public void ISBNChangedNotEqual()
        {
            var eventSource1 = TestValues.Create();
            var eventSource2 = new EventSource(eventSource1)
            {
                ISBN = "another ISBN number"
            };
            Assert.IsFalse(eventSource1.Equals(eventSource2));
            Assert.IsFalse(eventSource1 == eventSource2);
            Assert.IsTrue(eventSource1 != eventSource2);
            Assert.IsFalse(eventSource1.GetHashCode() == eventSource2.GetHashCode());
        }

        [TestMethod]
        public void TitleChangedNotEqual()
        {
            var eventSource1 = TestValues.Create();
            var eventSource2 = new EventSource(eventSource1)
            {
                Title = "Another Title"
            };
            Assert.IsFalse(eventSource1.Equals(eventSource2));
            Assert.IsFalse(eventSource1 == eventSource2);
            Assert.IsTrue(eventSource1 != eventSource2);
            Assert.IsFalse(eventSource1.GetHashCode() == eventSource2.GetHashCode());
        }

        [TestMethod]
        public void WhereChangedNotEqual()
        {
            var eventSource1 = TestValues.Create();
            var eventSource2 = new EventSource(eventSource1)
            {
                Where = "Section IX"
            };
            Assert.IsFalse(eventSource1.Equals(eventSource2));
            Assert.IsFalse(eventSource1 == eventSource2);
            Assert.IsTrue(eventSource1 != eventSource2);
            Assert.IsFalse(eventSource1.GetHashCode() == eventSource2.GetHashCode());
        }

        [TestMethod]
        public void AuthorsChangedNotEqual()
        {
            var eventSource1 = TestValues.Create();
            var eventSource2 = new EventSource(eventSource1);
            eventSource2.Authors = new List<EventSourceAuthor>(eventSource1.Authors);   // copy to make new reference
            eventSource2.Authors.Add(new EventSourceAuthor { Name = "Hypatia of Alexandria" });
            Assert.IsFalse(eventSource1.Equals(eventSource2));
            Assert.IsFalse(eventSource1 == eventSource2);
            Assert.IsTrue(eventSource1 != eventSource2);
            Assert.IsFalse(eventSource1.GetHashCode() == eventSource2.GetHashCode());
        }

        [TestMethod]
        public void PublicationLBYearChangedNotEqual()
        {
            var eventSource1 = TestValues.Create();
            var eventSource2 = new EventSource(eventSource1)
            {
                PublicationLBYear = eventSource1.PublicationLBYear + 1
            };
            Assert.IsFalse(eventSource1.Equals(eventSource2));
            Assert.IsFalse(eventSource1 == eventSource2);
            Assert.IsTrue(eventSource1 != eventSource2);
            Assert.IsFalse(eventSource1.GetHashCode() == eventSource2.GetHashCode());
        }

        [TestMethod]
        public void PublicationLBMonthChangedNotEqual()
        {
            var eventSource1 = TestValues.Create();
            var eventSource2 = new EventSource(eventSource1)
            {
                PublicationLBMonth = eventSource1.PublicationLBMonth + 1
            };
            Assert.IsFalse(eventSource1.Equals(eventSource2));
            Assert.IsFalse(eventSource1 == eventSource2);
            Assert.IsTrue(eventSource1 != eventSource2);
            Assert.IsFalse(eventSource1.GetHashCode() == eventSource2.GetHashCode());
        }

        [TestMethod]
        public void PublicationLBDayChangedNotEqual()
        {
            var eventSource1 = TestValues.Create();
            var eventSource2 = new EventSource(eventSource1)
            {
                PublicationLBDay = eventSource1.PublicationLBDay + 1
            };
            Assert.IsFalse(eventSource1.Equals(eventSource2));
            Assert.IsFalse(eventSource1 == eventSource2);
            Assert.IsTrue(eventSource1 != eventSource2);
            Assert.IsFalse(eventSource1.GetHashCode() == eventSource2.GetHashCode());

        }

        [TestMethod]
        public void PublicationUBYearChangedNotEqual()
        {
            var eventSource1 = TestValues.Create();
            var eventSource2 = new EventSource(eventSource1)
            {
                PublicationUBYear = eventSource1.PublicationUBYear + 1
            };
            Assert.IsFalse(eventSource1.Equals(eventSource2));
            Assert.IsFalse(eventSource1 == eventSource2);
            Assert.IsTrue(eventSource1 != eventSource2);
            Assert.IsFalse(eventSource1.GetHashCode() == eventSource2.GetHashCode());

        }

        [TestMethod]
        public void PublicationUBMonthChangedNotEqual()
        {
            var eventSource1 = TestValues.Create();
            var eventSource2 = new EventSource(eventSource1)
            {
                PublicationUBMonth = eventSource1.PublicationUBMonth + 1
            };
            Assert.IsFalse(eventSource1.Equals(eventSource2));
            Assert.IsFalse(eventSource1 == eventSource2);
            Assert.IsTrue(eventSource1 != eventSource2);
            Assert.IsFalse(eventSource1.GetHashCode() == eventSource2.GetHashCode());

        }

        [TestMethod]
        public void PublicationUBDayChangedNotEqual()
        {
            var eventSource1 = TestValues.Create();
            var eventSource2 = new EventSource(eventSource1)
            {
                PublicationUBDay = eventSource1.PublicationUBDay + 1
            };
            Assert.IsFalse(eventSource1.Equals(eventSource2));
            Assert.IsFalse(eventSource1 == eventSource2);
            Assert.IsTrue(eventSource1 != eventSource2);
            Assert.IsFalse(eventSource1.GetHashCode() == eventSource2.GetHashCode());

        }
    }

    class TestValues
    {
        public static EventSource Create()
        {
            return new EventSource
            {
                Id = Guid.NewGuid(),
                ISBN = "12345-6789",
                Title = "Test Source",
                Where = "Chapter 2, paragraph 3",
                Authors = new List<EventSourceAuthor> {
                    new() { Name = "Steve" },
                    new() { Name = "Jacob" }
                },
                PublicationLBYear = 2022,
                PublicationLBMonth = 5,
                PublicationLBDay = 16,
                PublicationUBYear = 2022,
                PublicationUBMonth = 5,
                PublicationUBDay = 17
            };
        }
    }
}

