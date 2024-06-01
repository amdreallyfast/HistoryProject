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
            Assert.AreEqual(obj.Id, Guid.Empty);
            Assert.AreEqual(obj.EventId, Guid.Empty);
            Assert.AreEqual(obj.Revision, 1);
            
            // It'll take a number of milliseconds to run the test, so we can't compare against DateTime.Now
            Assert.IsTrue(obj.RevisionDateTime > DateTime.Now.AddSeconds(-1) );
            
            Assert.IsNull(obj.RevisionAuthor);
            Assert.IsNull(obj.Tags);
            Assert.IsNull(obj.Title);
            Assert.IsNull(obj.EventImage);
            Assert.IsNull(obj.Summary);

            Assert.AreEqual(obj.LBYear, -99999);
            Assert.IsNull(obj.LBMonth);
            Assert.IsNull(obj.LBDay);
            Assert.IsNull(obj.LBHour);
            Assert.IsNull(obj.LBMin);
            Assert.AreEqual(obj.UBYear, +99999);
            Assert.IsNull(obj.UBMonth);
            Assert.IsNull(obj.UBDay);
            Assert.IsNull(obj.UBHour);
            Assert.IsNull(obj.UBMin);

            Assert.IsNull(obj.SpecificLocation);
            Assert.IsNull(obj.Region);
            Assert.IsNull(obj.Sources);
        }

        [TestMethod]
        public void CopyConstructor()
        {
            var testEvent = TestValues.CreateEvent();
            var copy = new Event(testEvent);
            Assert.AreEqual(testEvent, copy);
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
        public void IdChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                Id = Guid.NewGuid(),
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void EventIdChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                EventId= Guid.NewGuid(),
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void RevisionChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                Revision = 99
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void RevisionDateTimeChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                RevisionDateTime = DateTime.Now.AddMinutes(1)
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void RevisionAuthorChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                RevisionAuthor = "It's A Me!"
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void TagsChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1);
            testEvent2.Tags = new List<Tag>(testEvent1.Tags);
            testEvent2.Tags.Add(new Tag { Value = "New Tag"});
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void TitleChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                Title = "Another Title"
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void EventImageChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                EventImage = new EventImage { Id = Guid.NewGuid() }
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void SummaryChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                Summary = "Another summary"
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void LBYearChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                LBYear = 1
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void LBMonthChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                LBMonth = 1
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void LBDayChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                LBDay = 1
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void LBHourChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                LBHour = 1
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void LBMinChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                LBMin = 1
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void UBYearChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                UBYear = 1
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void UBMonthChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                UBMonth = 1
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void UBDayChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                UBDay = 1
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void UBHourChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                UBHour = 1
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void UBMinChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                UBMonth = 1
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void SpecificLocationChangedNotEqual()
        {
            var testEvent1 = TestValues.CreateEvent();
            var testEvent2 = new Event(testEvent1)
            {
                SpecificLocation = new EventLocation { Latitude = -4.9f, Longitude = +67.2 }
            };
            Assert.IsFalse(testEvent1.Equals(testEvent2));
            Assert.IsFalse(testEvent1 == testEvent2);
            Assert.IsTrue(testEvent1 != testEvent2);
            Assert.IsFalse(testEvent1.GetHashCode() == testEvent2.GetHashCode());
        }

        [TestMethod]
        public void RegionChangedNotEqual()
        {
            // ??skip testing lists because they are not equivalent without reference equals??
            throw new NotImplementedException();
        }

        [TestMethod]
        public void SourcesChangedNotEqual()
        {
            // ??skip testing lists because they are not equivalent without reference equals??
            //??deep comparison necessary? Only check for Id comparison
            throw new NotImplementedException();
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
                EventImage = new EventImage { 
                    Id = Guid.NewGuid(),
                    ImageBinary = new byte[] {  0x00, 0x01, 0x02 }
                },
                Summary = "This is the summary for the test event",
                LBYear  = 6,
                LBMonth = 7,
                LBDay   = 8,
                LBHour  = 9,
                LBMin   = 10,
                UBYear = 10,
                UBMonth = 9,
                UBDay = 8,
                UBHour = 7,
                UBMin = 6,

                //TimeRange = new EventTimeRange
                //{
                //    LowerBound = new EventTime { Year = 5, Month = 4, Day = 3, Hour = 2, Min = 1 },
                //    UpperBound = new EventTime { Year = 10, Month = 4, Day = 3, Hour = 2, Min = 1 }
                //},
                SpecificLocation = new EventLocation {
                    Latitude = 1.2f, 
                    Longitude = -79.4
                },
                Region = new List<EventLocation>
                {
                    new() { Latitude = 1.2f, Longitude = -79.4},
                    new() { Latitude = 27.2f, Longitude = -42.3},
                    new() { Latitude = 90.0f, Longitude = -159.0}
                },
                Sources = new List<EventSource>
                {
                    new() { 
                        ISBN = "12345",
                        Title = "Source title 1",
                        Where = "Chapter 2, paragraph 3",
                        Authors = new List<EventSourceAuthor>
                        {
                            new() { Author = "Steve"}
                        },
                        PublicationLBYear = 607,
                        PublicationUBYear = 613
                    },
                    new() {
                        ISBN = "6789",
                        Title = "Source title 2",
                        Where = "Section 5",
                        Authors = new List<EventSourceAuthor>
                        {
                            new() { Author = "Golly Gee Whilikers"}
                        },
                        PublicationLBYear = 1967,
                        PublicationUBYear = 1968
                    },
                }
            };

            return testEvent;
        }
    }
}
