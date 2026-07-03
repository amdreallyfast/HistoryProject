using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace WebAPI.Tests
{
    // Server-side re-validation of event images in HistoricalEventController.Create. The
    // frontend validates too, but the client is untrusted: the backend must reject anything
    // that isn't a PNG/JPEG within the 5 MB cap (422) before persisting. These tests run the
    // real controller over an in-memory DB.
    [TestClass]
    public class CreateImageValidationTests
    {
        private const int MaxImageBytes = 5 * 1024 * 1024;

        [TestMethod]
        public async Task Create_ValidPng_ReturnsOk()
        {
            using var db = TestSupport.NewInMemoryContext();
            var controller = TestSupport.NewController(db);

            var result = await controller.Create(TestSupport.ValidEvent(TestSupport.PngBytes()));

            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        }

        [TestMethod]
        public async Task Create_ValidJpeg_ReturnsOk()
        {
            using var db = TestSupport.NewInMemoryContext();
            var controller = TestSupport.NewController(db);

            var result = await controller.Create(TestSupport.ValidEvent(TestSupport.JpegBytes()));

            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        }

        [TestMethod]
        public async Task Create_NoImage_ReturnsOk()
        {
            using var db = TestSupport.NewInMemoryContext();
            var controller = TestSupport.NewController(db);

            // An empty/absent image means "no image" and is allowed.
            var result = await controller.Create(TestSupport.ValidEvent(image: null));

            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        }

        [TestMethod]
        public async Task Create_OversizedImage_Returns422()
        {
            using var db = TestSupport.NewInMemoryContext();
            var controller = TestSupport.NewController(db);

            // Over the 5 MB cap (the size check runs before the signature check).
            var result = await controller.Create(TestSupport.ValidEvent(new byte[MaxImageBytes + 1]));

            Assert.IsInstanceOfType(result.Result, typeof(UnprocessableEntityObjectResult));
        }

        [TestMethod]
        public async Task Create_NonImageBytesDisguised_Returns422()
        {
            using var db = TestSupport.NewInMemoryContext();
            var controller = TestSupport.NewController(db);

            // Bytes that are neither PNG nor JPEG (HTML), even though a client might name the
            // file ".png" — the magic-byte check rejects them.
            var html = Encoding.ASCII.GetBytes("<!DOCTYPE html><script>alert(1)</script>");
            var result = await controller.Create(TestSupport.ValidEvent(html));

            Assert.IsInstanceOfType(result.Result, typeof(UnprocessableEntityObjectResult));
        }
    }
}
