Recommended workflow:
1. Run the helper query → find the test event EventId values.
2. Paste them into the deletion script's @EventIdsToDelete block.
3. Run with @DryRun = 1 first → review the preview rowcounts. They tell you exactly what would be touched (e.g. "2 Events, 2 Images, 1 SpecificLocation, 8 Region Locations, 1 Source, 2 SourceAuthors, 3 EventTag rows").
4. Test it on HistoryProjectDb-Test first by switching the query editor's database dropdown. Run with @DryRun = 0 there, refresh the frontend, confirm those events disappeared and unrelated events are unaffected.
5. Switch back to HistoryProjectDb (prod), set @DryRun = 0, run.

Notes:

- The script is idempotent against unrelated data — only rows reachable from the listed EventIds are touched.
- Tags themselves are intentionally preserved (they're shared). Orphaned Tag rows (no remaining EventTag reference) can be cleaned up separately if you want them gone; let me know.
- @DryRun toggles preview vs. commit. With XACT_ABORT ON, any error mid-script also rolls everything back.


-- Helper — find EventIds to delete:
-- Run this first against HistoryProjectDb to identify which logical events you want gone. Paste the EventId values into the script above.
SELECT
    EventId,
    Revision,
    Title,
    RevisionAuthor,
    RevisionDateTime
FROM Events
ORDER BY RevisionDateTime DESC;


-- Here's the script. Set @DryRun = 0 only when you're ready to commit (that is, SQL's "commit transaction", not git commit). Run against HistoryProjectDb. No trailing GO.
-- ============================================================================
-- Delete event(s) and all related rows from HistoryProjectDb
-- Deletes ALL revisions of the specified EventId(s). Honors FK order.
-- ============================================================================
SET XACT_ABORT ON;
SET NOCOUNT ON;

DECLARE @DryRun bit = 1;  -- 1 = preview + rollback, 0 = actually commit

-- 1. EventIds to delete (one per row). EventId is the logical id shared across
--    all revisions of an event (NOT the per-revision Events.Id primary key).
DECLARE @EventIdsToDelete TABLE (EventId uniqueidentifier);
INSERT INTO @EventIdsToDelete VALUES
    ('00000000-0000-0000-0000-000000000000')   -- REPLACE with a real EventId
--  ,('11111111-1111-1111-1111-111111111111')  -- add more as needed
;

BEGIN TRANSACTION;

-- 2. Capture all dependent row IDs before deleting anything.
DECLARE @EventRowIds          TABLE (Id uniqueidentifier);
DECLARE @ImageIds             TABLE (Id uniqueidentifier);
DECLARE @SpecificLocationIds  TABLE (Id uniqueidentifier);
DECLARE @SourceIds            TABLE (Id uniqueidentifier);

INSERT INTO @EventRowIds (Id)
SELECT Id FROM Events
WHERE EventId IN (SELECT EventId FROM @EventIdsToDelete);

INSERT INTO @ImageIds (Id)
SELECT DISTINCT EventImageId FROM Events
WHERE Id IN (SELECT Id FROM @EventRowIds);

INSERT INTO @SpecificLocationIds (Id)
SELECT DISTINCT SpecificLocationId FROM Events
WHERE Id IN (SELECT Id FROM @EventRowIds)
  AND SpecificLocationId IS NOT NULL;

INSERT INTO @SourceIds (Id)
SELECT Id FROM Sources
WHERE EventId IN (SELECT Id FROM @EventRowIds);

-- 3. Preview rowcounts for everything about to be touched.
SELECT 'Events (all revisions)'  AS [Target], COUNT(*) AS [RowCount] FROM @EventRowIds
UNION ALL SELECT 'Images',            COUNT(*) FROM @ImageIds
UNION ALL SELECT 'SpecificLocations', COUNT(*) FROM @SpecificLocationIds
UNION ALL SELECT 'Sources',           COUNT(*) FROM @SourceIds
UNION ALL SELECT 'SourceAuthors',     COUNT(*) FROM SourceAuthors WHERE EventSourceId IN (SELECT Id FROM @SourceIds)
UNION ALL SELECT 'Region Locations',  COUNT(*) FROM Locations WHERE EventId IN (SELECT Id FROM @EventRowIds)
UNION ALL SELECT 'EventTag junction', COUNT(*) FROM EventTag  WHERE EventsId IN (SELECT Id FROM @EventRowIds);

-- 4. Delete in dependency order (leaves first).

-- 4a. Source authors, then sources.
DELETE FROM SourceAuthors WHERE EventSourceId IN (SELECT Id FROM @SourceIds);
DELETE FROM Sources       WHERE Id            IN (SELECT Id FROM @SourceIds);

-- 4b. Region locations point AT the Event row. Must go before the Event.
DELETE FROM Locations WHERE EventId IN (SELECT Id FROM @EventRowIds);

-- 4c. EventTag junction. (Would cascade with the Events delete, but explicit
--     is clearer and matches the rowcount in the preview.) Tag rows themselves
--     are shared and left alone.
DELETE FROM EventTag WHERE EventsId IN (SELECT Id FROM @EventRowIds);

-- 4d. The Event rows. Safe now — nothing dependent references them.
DELETE FROM Events WHERE Id IN (SELECT Id FROM @EventRowIds);

-- 4e. SpecificLocation rows (Events.SpecificLocationId pointed at these).
DELETE FROM Locations WHERE Id IN (SELECT Id FROM @SpecificLocationIds);

-- 4f. Image rows. Defensive: only delete if no other Event still references
--     the same image row (1:1 in practice, but uniqueness isn't enforced).
DELETE FROM Images
WHERE Id IN (SELECT Id FROM @ImageIds)
  AND Id NOT IN (SELECT EventImageId FROM Events);

-- 5. Verification — these should all be 0.
SELECT 'Events remaining for these EventIds' AS Check_, COUNT(*) AS Count_
  FROM Events    WHERE EventId IN (SELECT EventId FROM @EventIdsToDelete)
UNION ALL SELECT 'Sources still referencing those Event rows',
        COUNT(*) FROM Sources   WHERE EventId IN (SELECT Id FROM @EventRowIds)
UNION ALL SELECT 'Region Locations still referencing those Event rows',
        COUNT(*) FROM Locations WHERE EventId IN (SELECT Id FROM @EventRowIds)
UNION ALL SELECT 'EventTag rows still referencing those Event rows',
        COUNT(*) FROM EventTag  WHERE EventsId IN (SELECT Id FROM @EventRowIds);

-- 6. Commit or roll back based on @DryRun.
IF @DryRun = 1
BEGIN
    PRINT 'DRY RUN — rolling back. Set @DryRun = 0 to actually delete.';
    ROLLBACK TRANSACTION;
END
ELSE
BEGIN
    COMMIT TRANSACTION;
    PRINT 'COMMITTED — events permanently deleted.';
END

