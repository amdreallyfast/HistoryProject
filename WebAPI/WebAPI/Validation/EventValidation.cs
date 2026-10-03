using WebAPI.Models;

namespace WebAPI.Validation
{
    // Server-side validation of an incoming Event payload.
    //
    // WHY THIS EXISTS: the frontend is user-loaded JS/HTML. A user can open devtools, strip every
    // client-side guardrail, and POST whatever they like at Create. So nothing arriving from the
    // client is trusted, and every rule the UI enforces is re-enforced here.
    //
    // WHAT THIS IS NOT: access control. There is no authentication on this API yet (see the
    // account-system TODO), so an attacker does not need to forge anything — they can POST
    // unlimited well-formed garbage. This is damage limitation and data integrity. The account
    // system is the prerequisite for the stronger claim.
    //
    // CONVENTION: every check returns an error string, or null when valid. Callers turn a non-null
    // result into a 422 with that string as the body, so the message is user-visible — write them
    // to say what was wrong, not just that something was.
    public static class EventValidation
    {
        // Keep in sync with MAX_IMAGE_BYTES in npmfrontend/src/api/imageDataUrl.js.
        // Guarded by npmfrontend/src/api/imageValidation.contract.test.js, which reads BOTH source
        // files and fails if they drift — so this constant must stay greppable as a simple
        // `MaxImageBytes = <int expression>;`.
        public const int MaxImageBytes = 5 * 1024 * 1024;

        private static readonly byte[] PngSignature = { 0x89, 0x50, 0x4e, 0x47 };
        private static readonly byte[] JpegSignature = { 0xff, 0xd8, 0xff };

        // Single entry point. Ordered cheapest-first, and "most likely to be the user's actual
        // mistake" before "only reachable by a tampered client", so a legitimate user gets the
        // message that helps them.
        public static string? Validate(Event e)
        {
            if (e is null)
            {
                return "No event supplied.";
            }

            if (string.IsNullOrEmpty(e.Title))
            {
                return "Title cannot be empty";
            }
            if (string.IsNullOrEmpty(e.Summary))
            {
                return "Summary cannot be empty";
            }
            if (e.SpecificLocation is null && (e.Region is null || !e.Region.Any()))
            {
                return "Must specify location and/or region";
            }

            return ValidateImage(e.EventImage?.ImageBinary);
        }

        // Returns an error message if the image bytes are invalid, or null when valid.
        // Empty/null bytes mean "no image" and are allowed.
        public static string? ValidateImage(byte[]? imageBinary)
        {
            if (imageBinary is null || imageBinary.Length == 0)
            {
                return null;
            }
            if (imageBinary.Length > MaxImageBytes)
            {
                return $"Image exceeds {MaxImageBytes / (1024 * 1024)}MB limit.";
            }
            if (!StartsWith(imageBinary, PngSignature) && !StartsWith(imageBinary, JpegSignature))
            {
                return "Only PNG or JPEG images are allowed.";
            }
            return null;
        }

        private static bool StartsWith(byte[] bytes, byte[] signature)
        {
            if (bytes.Length < signature.Length) return false;
            for (int i = 0; i < signature.Length; i++)
            {
                if (bytes[i] != signature[i]) return false;
            }
            return true;
        }
    }
}
