using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using WebAPI.Models;

namespace WebAPI.Tests
{
    // The controller is [ApiController], so ASP.NET Core rejects a request with 400 when model
    // validation fails, BEFORE the action runs. The controller tests call actions directly and
    // skip that step, so they can't see it. This runs the same MVC validator (DataAnnotations
    // plus the implicit [Required] that MVC adds to non-nullable reference properties) on a
    // payload, which is what decides 400 vs reaching Create.
    [TestClass]
    public class ModelValidationTests
    {
        private static ModelStateDictionary Validate(Event e)
        {
            var services = new ServiceCollection();
            services.AddLogging();
            services.AddMvcCore().AddDataAnnotations();
            var provider = services.BuildServiceProvider();

            var actionContext = new ActionContext(
                new DefaultHttpContext { RequestServices = provider },
                new RouteData(),
                new ActionDescriptor());
            provider.GetRequiredService<IObjectModelValidator>()
                .Validate(actionContext, validationState: null, prefix: string.Empty, model: e);
            return actionContext.ModelState;
        }

        // What the frontend sends for an event with no image: no EventImage at all.
        private static Event ImagelessPayload()
        {
            var e = TestSupport.ValidEvent(image: null);
            e.Tags = new List<Tag>();
            e.Sources = new List<EventSource>();
            return e;
        }

        [TestMethod]
        public void NoEventImage_PassesModelValidation()
        {
            var state = Validate(ImagelessPayload());
            Assert.IsTrue(state.IsValid,
                "an event without an EventImage must reach Create, not be rejected with 400: "
                + string.Join("; ", state.Where(x => x.Value!.Errors.Any()).Select(x => x.Key)));
        }

        [TestMethod]
        public void EmptyTagsAndSources_PassModelValidation()
        {
            // With an image, so this checks only the lists.
            var e = ImagelessPayload();
            e.EventImage = new EventImage { Id = Guid.NewGuid(), ImageBinary = TestSupport.PngBytes() };
            Assert.IsTrue(Validate(e).IsValid);
        }

        // Tags and Sources stay required as lists: a client sends [] for "none", not null.
        [TestMethod]
        public void NullTags_FailsModelValidation()
        {
            var e = ImagelessPayload();
            e.Tags = null!;
            Assert.IsFalse(Validate(e).IsValid);
        }

        [TestMethod]
        public void NullSources_FailsModelValidation()
        {
            var e = ImagelessPayload();
            e.Sources = null!;
            Assert.IsFalse(Validate(e).IsValid);
        }
    }
}
