namespace WebAPI.Validation
{
    // Comparing partial dates (year required; month and day optional; negative years are BC).
    //
    // A bound with a missing month or day is a span, not a point. To compare bounds, each is
    // expanded to the widest point it could be:
    //   - an EARLIEST bound -> the start of its period (missing month -> 1, missing day -> 1)
    //   - a LATEST bound    -> the end of its period   (missing month -> 12, missing day -> 31)
    // so a comparison only reports a problem when every reading of the dates is impossible.
    // Day 31 for every month is deliberately simple; real month lengths and leap years belong to
    // the JulianCalendar TODO item, which can swap them in here without changing callers.
    //
    // Mirrors npmfrontend/src/dates/partialDate.js. Both are checked against the same cases in
    // npmfrontend/tests/fixtures/partialDateContract.json (PartialDateContractTests.cs and
    // partialDate.contract.test.js), so keep them in step. See claudePlans/10.
    public static class PartialDate
    {
        // month*100 + day stays below 10000, so year*10000 orders correctly for BC years too.
        public static long EarliestKey(int year, int? month, int? day)
            => year * 10000L + (month ?? 1) * 100 + (day ?? 1);

        public static long LatestKey(int year, int? month, int? day)
            => year * 10000L + (month ?? 12) * 100 + (day ?? 31);

        public static bool IsRangeInverted(int earliestYear, int? earliestMonth, int? earliestDay,
            int latestYear, int? latestMonth, int? latestDay)
            => EarliestKey(earliestYear, earliestMonth, earliestDay) > LatestKey(latestYear, latestMonth, latestDay);

        // True when the source was written entirely before the event could have happened: the
        // source's latest date is before the event's earliest date. Overlap and "event before
        // source" are both allowed.
        public static bool IsSourceBeforeEvent(int eventEarliestYear, int? eventEarliestMonth, int? eventEarliestDay,
            int sourceLatestYear, int? sourceLatestMonth, int? sourceLatestDay)
            => LatestKey(sourceLatestYear, sourceLatestMonth, sourceLatestDay)
                < EarliestKey(eventEarliestYear, eventEarliestMonth, eventEarliestDay);

        // For messages: "1066", "1066-10" or "1066-10-14" (BC as a negative year, as entered).
        public static string Format(int year, int? month, int? day)
            => month is null ? $"{year}" : day is null ? $"{year}-{month:00}" : $"{year}-{month:00}-{day:00}";
    }
}
