using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;

namespace WebAPI.Tests
{
    // The frontend mapper (npmfrontend/src/api/eventMapper.js) reads PascalCase JSON keys. That
    // casing comes from the Newtonsoft settings in Program.cs (ReferenceLoopHandling.Ignore +
    // DefaultContractResolver). If those settings drift (e.g. a camelCase resolver), the mocked
    // Playwright tests stay green but prod breaks. This test reproduces the exact settings and
    // asserts the key/shape contract, so drift fails here.
    [TestClass]
    public class JsonContractTests
    {
        private static JsonSerializerSettings ApiSerializerSettings() => new()
        {
            ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
            ContractResolver = new DefaultContractResolver(),
        };

        [TestMethod]
        public void Event_SerializesWithThePascalCaseKeysTheFrontendReads()
        {
            var evt = TestSupport.FullyPopulatedEvent(Guid.NewGuid(), 1, "Contract Title");
            var json = JsonConvert.SerializeObject(evt, ApiSerializerSettings());
            var jo = JObject.Parse(json);

            foreach (var key in new[]
            {
                "EventId", "Revision", "RevisionDateTime", "RevisionAuthor", "Title", "Summary",
                "EventIsCreationOfSource", "LBYear", "LBMonth", "LBDay", "UBYear", "UBMonth", "UBDay",
            })
            {
                Assert.IsTrue(jo.ContainsKey(key), $"missing top-level key: {key}");
            }

            Assert.IsNotNull(jo["EventImage"]?["ImageBinary"], "EventImage.ImageBinary");
            Assert.IsNotNull(jo["SpecificLocation"]?["Latitude"], "SpecificLocation.Latitude");
            Assert.IsNotNull(jo["SpecificLocation"]?["Longitude"], "SpecificLocation.Longitude");

            var region0 = jo["Region"]?[0];
            Assert.IsNotNull(region0?["Latitude"], "Region[].Latitude");
            Assert.IsNotNull(region0?["Longitude"], "Region[].Longitude");
            Assert.IsNotNull(region0?["OrderIndex"], "Region[].OrderIndex");

            Assert.IsNotNull(jo["Tags"]?[0]?["Value"], "Tags[].Value");

            var src0 = jo["Sources"]?[0];
            Assert.IsNotNull(src0?["Title"], "Sources[].Title");
            Assert.IsNotNull(src0?["PublicationLBYear"], "Sources[].PublicationLBYear");
            Assert.IsNotNull(src0?["PublicationUBYear"], "Sources[].PublicationUBYear");
            Assert.IsNotNull(src0?["Authors"]?[0]?["Name"], "Sources[].Authors[].Name");
        }
    }
}
