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

        // Keep in sync with regionInfo.maxBoundaryPoints in npmfrontend/src/GlobeSection/constValues.jsx.
        // Also guarded by the contract test above.
        //
        // The UI cap exists for drag performance (EditRegionMesh re-triangulates per frame); this
        // one exists because a tampered client is not bound by the UI at all, and the display path
        // has fixed MAX_VERTICES/MAX_INDICES buffers that silently refuse to render an
        // over-capacity region — a stored event that no viewer can draw.
        public const int MaxRegionPoints = 128;

        // Not mirrored on the frontend, which has no UI limit on these. Chosen as "far more than
        // any real event needs, far less than enough to be used as storage".
        public const int MaxTags = 64;
        public const int MaxSources = 64;
        public const int MaxAuthorsPerSource = 32;

        // Guarded by the contract test against the same bounds used in
        // npmfrontend/src/GlobeSection/convertLatLongXYZ.jsx.
        public const double MinLatitude = -90.0;
        public const double MaxLatitude = 90.0;
        public const double MinLongitude = -180.0;
        public const double MaxLongitude = 180.0;

        // Keep in sync with REGION_WINDING_EPSILON in
        // npmfrontend/src/GlobeSection/Region/regionMeshGeometry.js.
        //
        // Below this the ring encloses no meaningful area and has no correct orientation —
        // collinear points, duplicates, or a zero-area shape. Sits far above the numerical noise
        // floor (~1e-14 sr accumulated over a 128-point ring) and far below any region a person
        // could draw (the default 8° region covers ~0.061 sr), so it never adjudicates a real case.
        public const double RegionWindingEpsilon = 1e-12;

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

            // Note: string LENGTH limits are not checked here. [MaxLength] on Title/Summary/
            // RevisionAuthor makes [ApiController] reject an over-long value with a 400 before
            // this action runs, so re-checking would be dead code.

            return ValidateListSizes(e)
                ?? ValidateCoordinates(e)
                ?? ValidateRegionWinding(e)
                ?? ValidateImage(e.EventImage?.ImageBinary);
        }

        private static string? ValidateListSizes(Event e)
        {
            if (e.Region is not null && e.Region.Count > MaxRegionPoints)
            {
                return $"Region cannot exceed {MaxRegionPoints} boundary points (received {e.Region.Count}).";
            }
            if (e.Tags is not null && e.Tags.Count > MaxTags)
            {
                return $"Cannot exceed {MaxTags} tags (received {e.Tags.Count}).";
            }
            if (e.Sources is not null)
            {
                if (e.Sources.Count > MaxSources)
                {
                    return $"Cannot exceed {MaxSources} sources (received {e.Sources.Count}).";
                }
                foreach (var source in e.Sources)
                {
                    if (source.Authors is not null && source.Authors.Count > MaxAuthorsPerSource)
                    {
                        return $"A source cannot exceed {MaxAuthorsPerSource} authors (received {source.Authors.Count}).";
                    }
                }
            }
            return null;
        }

        private static string? ValidateCoordinates(Event e)
        {
            if (e.SpecificLocation is not null)
            {
                var error = ValidateLocation(e.SpecificLocation, "Primary location");
                if (error is not null) return error;
            }

            if (e.Region is not null)
            {
                for (int i = 0; i < e.Region.Count; i++)
                {
                    var error = ValidateLocation(e.Region[i], $"Region boundary point {i + 1}");
                    if (error is not null) return error;
                }
            }

            return null;
        }

        // `label` names the offending point in the message, because "a coordinate is out of range"
        // is useless when a region has 128 of them.
        private static string? ValidateLocation(EventLocation location, string label)
        {
            // Non-finite first. JSON has no NaN literal, but a value can still arrive that
            // overflows a double, and a non-finite coordinate is worse than an out-of-range one:
            // it propagates into the frontend's geometry buffers, makes the mesh's bounding sphere
            // NaN, and every frustum test then fails — so the region silently vanishes with
            // nothing logged, looking like a rendering bug rather than bad data.
            if (!double.IsFinite(location.Latitude) || !double.IsFinite(location.Longitude))
            {
                return $"{label} has a non-finite coordinate.";
            }
            if (location.Latitude < MinLatitude || location.Latitude > MaxLatitude)
            {
                return $"{label} latitude must be between {MinLatitude} and {MaxLatitude} (received {location.Latitude}).";
            }
            if (location.Longitude < MinLongitude || location.Longitude > MaxLongitude)
            {
                return $"{label} longitude must be between {MinLongitude} and {MaxLongitude} (received {location.Longitude}).";
            }
            return null;
        }

        // Region orientation. EarClipping on the frontend requires a counterclockwise ring
        // (viewed from outside the globe) and throws otherwise — so a clockwise ring that reaches
        // the database is a region no viewer can draw.
        //
        // ASYMMETRY WITH THE FRONTEND, DELIBERATE: the frontend NORMALIZES a clockwise ring to
        // counterclockwise on submit (see eventMapper.frontendToBackend). The backend REJECTS it.
        // A bad winding arriving here means the frontend was bypassed or has regressed, and
        // quietly repairing it would hide that.
        //
        // KNOWN LIMIT: this detects orientation, not simplicity. A ring that is mostly
        // counterclockwise with a small self-crossing loop still totals positive — the loop's
        // negative area is swamped — so it is accepted here while EarClipping would still throw.
        // Accepted because DisplayRegion/EditableRegion wrap the mesh in an ErrorBoundary: such a
        // region fails to draw rather than taking the page down. Closing the gap entirely means
        // porting EarClipping itself.
        private static string? ValidateRegionWinding(Event e)
        {
            if (e.Region is null || e.Region.Count < 3)
            {
                // No region, or too few points to enclose anything. Not an error — an event may
                // legitimately have only a specific location.
                return null;
            }

            var area = RegionSignedArea(e.Region);

            if (!double.IsFinite(area) || Math.Abs(area) <= RegionWindingEpsilon)
            {
                return "Region boundary is degenerate: the points enclose no area "
                     + "(collinear, duplicated, or all on one great circle).";
            }
            if (area < 0)
            {
                return "Region boundary is wound clockwise; it must be counterclockwise "
                     + "when viewed from outside the globe.";
            }
            return null;
        }

        // Signed area (equivalently, signed solid angle at the globe's centre) that the boundary
        // ring covers on the unit sphere. Positive = counterclockwise viewed from outside, which
        // is the orientation EarClipping requires.
        //
        // Must agree with regionSignedArea in
        // npmfrontend/src/GlobeSection/Region/regionMeshGeometry.js. Guarded by
        // npmfrontend/src/api/validationConstants.contract.test.js, which runs both
        // implementations over the same fixtures and compares the classification.
        //
        // Method: fan-triangulate from the first vertex and sum each spherical triangle's signed
        // solid angle via Van Oosterom–Strackee:
        //
        //   Ω = 2 * atan2( a · (b × c),  1 + a·b + b·c + c·a )      (a, b, c unit vectors)
        //
        // The numerator is the scalar triple product, so its sign IS that triangle's orientation;
        // on a concave or star-shaped ring the fan triangles outside the real region come back
        // negative and cancel the excess exactly. atan2 rather than atan(num/den) because the
        // denominator legitimately passes through zero for a degenerate half-great-circle
        // triangle. Deliberately NOT spherical excess (Σ interior angles − (n−2)π), which
        // subtracts two large nearly-equal quantities for small regions.
        public static double RegionSignedArea(IEnumerable<EventLocation> region)
        {
            // ORDER MATTERS AND IS NOT THE LIST ORDER. EF returns related rows unordered, and the
            // frontend sorts by OrderIndex on read (eventMapper.backendToFrontend), so OrderIndex
            // — not list position — is the stored ring order. Validating the unsorted list would
            // check the winding of a ring nobody will ever reconstruct.
            var ordered = region.OrderBy(p => p.OrderIndex).ToList();
            if (ordered.Count < 3)
            {
                return 0;
            }

            var unit = new List<double[]>(ordered.Count);
            foreach (var point in ordered)
            {
                if (!double.IsFinite(point.Latitude) || !double.IsFinite(point.Longitude))
                {
                    return 0;
                }
                unit.Add(ToUnitVector(point.Latitude, point.Longitude));
            }

            static double Dot(double[] p, double[] q) => (p[0] * q[0]) + (p[1] * q[1]) + (p[2] * q[2]);

            var a = unit[0];
            double total = 0;
            for (int i = 1; i < unit.Count - 1; i++)
            {
                var b = unit[i];
                var c = unit[i + 1];

                double crossX = (b[1] * c[2]) - (b[2] * c[1]);
                double crossY = (b[2] * c[0]) - (b[0] * c[2]);
                double crossZ = (b[0] * c[1]) - (b[1] * c[0]);

                double numerator = (a[0] * crossX) + (a[1] * crossY) + (a[2] * crossZ);
                double denominator = 1 + Dot(a, b) + Dot(b, c) + Dot(c, a);

                total += 2 * Math.Atan2(numerator, denominator);
            }

            return total;
        }

        // Same axis convention as ConvertLatLongToXYZ in
        // npmfrontend/src/GlobeSection/convertLatLongXYZ.jsx: Y is the polar axis, and increasing
        // longitude rotates from +Z toward +X. The sign of the signed area depends on this
        // handedness, so it must match the frontend exactly or every verdict inverts.
        private static double[] ToUnitVector(double latitudeDegrees, double longitudeDegrees)
        {
            double lat = latitudeDegrees / 180.0 * Math.PI;
            double lon = longitudeDegrees / 180.0 * Math.PI;
            double cosLat = Math.Cos(lat);
            return new[]
            {
                Math.Sin(lon) * cosLat,
                Math.Sin(lat),
                Math.Cos(lon) * cosLat,
            };
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
