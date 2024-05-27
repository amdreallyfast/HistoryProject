using Microsoft.AspNetCore.Http;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebAPI.Models;

namespace EventUnitTesting
{
    [TestClass]
    public class Constructor
    {
        [TestMethod]
        public void HasDefaultConstructor()
        {
            var obj = new Event();
            Assert.IsNotNull(obj);
        }

        [TestMethod]
        public void DefaultValues()
        {
            var obj = new Event();
            Assert.IsNotNull(obj.Id);
            Assert.IsNotNull(obj.EventId);
            Assert.IsNotNull(obj.Revision);
            Assert.IsNotNull(obj.RevisionDateTime);
            Assert.IsNotNull(obj.RevisionAuthor);
            Assert.Equals(obj.Tags, new List<Tag>());
            Assert.Equals(obj.Title, string.Empty);
            Assert.Equals(obj.ImageFilePath, string.Empty);
            Assert.Equals(obj.Summary, string.Empty);
            
            Assert.IsNotNull(obj.TimeRange);
            Assert.Equals(obj.TimeRange.LowerBound, new EventTime());
            Assert.Equals(obj.TimeRange.UpperBound, new EventTime());

            Assert.IsNull(obj.SpecificLocation);
            Assert.IsNull(obj.Region);
            Assert.IsNotNull(obj.Sources);
            Assert.Equals(obj.Sources, new List<EventSource>());
/*
Id
EventId
Revision
RevisionDateTime
RevisionAuthor
Tags
Title
ImageFilePath
Summary
TimeRange
SpecificLocation
Region
Sources
*/
        }

        [TestMethod]
        public void CopyConstructor()
        {
            var testEvent = TestValues.CreateEvent();
            var copy = new Event(testEvent);
            Assert.Equals(testEvent, copy);
        }
    }

    [TestClass]
    public class Equals
    {
        [TestMethod]
        public void SameRef()
        {
            var testEvent = TestValues.CreateEvent();
            var ref1 = testEvent;
            var ref2 = testEvent;
            Assert.IsTrue(ref1.Equals(ref2));
            Assert.IsTrue(ref1 == ref2);
            Assert.IsFalse(ref1 != ref2);
            Assert.IsTrue(ref1.GetHashCode() == ref2.GetHashCode());
        }

        [TestMethod]
        public void DiffRefSameValues()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = TestValues.CreateEvent();
            Assert.IsTrue(testEvent1.Equals(testEvent2));
            Assert.IsTrue(testEvent1 == testEvent2);
            Assert.IsFalse(testEvent1 != testEvent2);
            Assert.IsTrue(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void IdChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = TestValues.CreateEvent();
            testEvent2.Id = Guid.NewGuid();
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void EventIdChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = TestValues.CreateEvent();
            testEvent2.EventId = Guid.NewGuid();
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void RevisionChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = TestValues.CreateEvent();
            testEvent2.Revision = 99;
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void RevisionDateTimeChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = TestValues.CreateEvent();
            testEvent2.RevisionDateTime = DateTime.Now.AddMinutes(1);
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void RevisionAuthorChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = TestValues.CreateEvent();
            testEvent2.RevisionAuthor = "It's A Me!";
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void TagsChangedNotEqual()
        {
            // ??skip testing lists because they are not equivalent without reference equals??
        }

        [TestMethod]
        public void TitleChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = TestValues.CreateEvent();
            testEvent2.Title = "Another Title";
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void ImageFilePathChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = TestValues.CreateEvent();
            testEvent2.ImageFilePath = "Another Path";
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void SummaryChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = TestValues.CreateEvent();
            testEvent2.Summary = "Another Summary";
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void TimeRangeLowerBoundChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = TestValues.CreateEvent();
            testEvent2.TimeRange.LowerBound.Year = 99;
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void TimeRangeUpperBoundChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = TestValues.CreateEvent();
            testEvent2.TimeRange.UpperBound.Year = 99;
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void SpecificLocationChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = TestValues.CreateEvent();
            testEvent2.SpecificLocation = new EventLocation { Latitude = -4.9f, Longitude = +67.2 };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void RegionChangedNotEqual()
        {
            // ??skip testing lists because they are not equivalent without reference equals??
        }

        [TestMethod]
        public void SourcesChangedNotEqual()
        {
            // ??skip testing lists because they are not equivalent without reference equals??
        }
    }

    class TestValues
    {
        public static Event CreateEvent()
        {
            /*
             Id
            EventId
            Revision
            RevisionDateTime
            RevisionAuthor
            Tags
            Title
            ImageFilePath
            Summary
            TimeRange
            SpecificLocation
            Region
            Sources
             */
            var testEvent = new Event {
                Id = Guid.NewGuid(),
                Revision = 5,
                RevisionDateTime = DateTime.Now,
                RevisionAuthor = "Diligent Manners",
                Tags = new List<Tag> 
                { 
                    new() { Value="TestString1"}, 
                    new() { Value="TestString2"} 
                },
                Title = "TestTitle",
                ImageFilePath = "The file path to an image but really should be in a database somewhere",
                Summary = "This is the summary for the test event",
                TimeRange = new EventTimeRange
                {
                    LowerBound = new EventTime { Year = 5, Month = 4, Day = 3, Hour = 2, Min = 1 },
                    UpperBound = new EventTime { Year = 10, Month = 4, Day = 3, Hour = 2, Min = 1 }
                },
                SpecificLocation = new EventLocation {  Latitude = 1.2f, Longitude = -79.4},
                Region = new List<EventLocation>
                {
                    new() { Latitude = 1.2f, Longitude = -79.4},
                    new() { Latitude = 27.2f, Longitude = -42.3},
                    new() { Latitude = 90.0f, Longitude = -159.0}
                },
                Sources = new List<EventSource>
                {
                    new() { Value = "Event source 1"},
                    new() { Value = "Event source 2"},
                }
            };

            return testEvent;
        }
    }
}
