# TODO

Work items for the HistoryProject repository. Organized by priority — start from the top.

**Instructions for Claude:** Work through items top-to-bottom.
- `[simple]` — Just do it.
- `[plan first]` — Create a plan document, get user approval, then create a git branch and implement step-by-step with testing between steps.
- `[discussion]` — Present options and wait for the user to decide before doing anything.

Guidance:
1. During planning, for any item that would alter the program's design, do the following:
  1. highlight the change
  2. summarize the impact
  3. get permission before continuing
  4. when finished, update DESIGN.md
2. After completing any item:
  1. commit to test branch and push
  2. ask the user to test:
    1. If the test is successful, then mark the TODO item as complete, and commit and push the TODO file
    2. If not, then attempt to diagnose the problem, and engage the user for missing info or unclear intent, and when it is working as the using expects, then mark the TODO item as complete, and commit the changes.
3. When making commits:
  1. The first line of the commit should briefly describe both the TODO item and the step:
    * Many TODO items end up with multiple fixes, and it will be useful to see that multiple commits in a row are part of the same routine.
    * Ex: For the the large TODO item **Address GitHub Dependabot package vulnerabilities in npmfrontend (121 reported)**, step 2, the first line could be something like: "Package vulnerabilities: 2. Apply non-breaking updates".
  2. Add an `Authorized-By: <git config --local user.name>` trailer alongside the standard `Co-Authored-By` trailer.
    * Note: If user.name is null, then git will throw an error when trying to commit. If that happens, show the user the error and inform that that git was the source and that git requires them to run `git config --local user.name <name>`. This will make it clear that git is asking for the info, not you the model.
    * Example: 
      ```
      Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
      Authorized-By: amdreallyfast
      ```
4. Perform no more than one TODO item (or for larger items, a single TODO step) per commit.

---

## Testing

- [ ] `[discussion]` **Full-stack (true end-to-end) testing against a real backend.** The current Playwright suite is *frontend* E2E with the API mocked via `page.route` — deterministic and Azure-independent, but it deliberately does **not** verify the frontend↔backend contract. A backend field/casing change could break prod while the mocked tests stay green (the class of bug that bit the PascalCase fixture). Add a thin layer of true full-stack tests. Considerations:
  - **Fetching first.** Highest-value check is that `GetFirst100` (and the other read endpoints) actually return the shape `eventMapper.backendToFrontend` expects. Could be a tiny real-backend smoke test against the test App Service, or a contract check that validates `tests/fixtures/events.json` against the live `GetFirst100` schema so the fixture can't silently drift from reality.
  - **Backend cold-start flakiness** (documented 504s/TdsParser on the test App Service without Always-On) means real-backend tests would be flaky if run on every push — scope them as nightly/manual or gate on a warmed instance.
  - **No data-seeding strategy yet** — true E2E needs known DB state. Decide: read-only against existing data, or seed/teardown.
  - **Write paths are sensitive.** Create/Update are append-only (new revision) and safe-ish to test. A future **event delete** needs extra care given the project's history-tracking intent — approach cautiously; may warrant soft-delete semantics before it's testable.
  - Layering goal: keep mocked UI E2E as the bulk; add a small, well-isolated full-stack smoke layer on top.

- [ ] `[plan first]` **Automated backend tests for `Create` image validation.** The image-upload work added server-side re-validation in `HistoricalEventController.Create` (rejects non-PNG/JPEG signatures and oversized bytes with 422). The frontend cases (valid PNG/JPEG accept, SVG/disguised/oversized reject) are covered by Vitest + Playwright, but the **backend** 422 path has no automated test — there is no backend test project yet. Stand up a minimal test project (xUnit + `WebApplicationFactory` or a controller unit test) asserting `Create` returns 200 for a valid small PNG and 422 for (a) oversized bytes and (b) non-image bytes disguised as an image. Overlaps the `[discussion]` "Full-stack testing" item above — decide whether this lives in its own unit-test project or folds into that effort.

---

## Bug Fixes

- [x] `[plan first]` **Globe region does not follow the selected revision.** When browsing revisions in `RevisionStack`, the details panel updates but the globe's region boundary mesh and pins stay on the *latest* revision's shape. `GlobeSection/Scene.jsx` builds display regions from `getLatestRevisions(allEvents)` (latest per event) and only toggles `isSelected`, so selecting an older revision re-colors but never re-shapes the selected event's region. Fix: for the selected event, source geometry from `eventState.selectedEvent` (the browsed revision) instead of its latest; others keep latest. (Planned 2026-06.)

- [ ] `[simple]` **THREE.Clock deprecation warning still present after fiber v9 upgrade.** **Ignore for now (Friday, 2026/04/25).** After upgrading to `@react-three/fiber` v9.6.0, the console still shows: `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` The source is `node_modules/@react-three/fiber/dist/events-760a1017.esm.js:985` — not project code. The wheel-event violation warning is gone; only the Clock warning remains. Revisit when a newer fiber stable release migrates its internal clock to `THREE.Timer`.

- [ ] `[plan first]` **Region validity gating bugs (surfaced by code review, 2026-06).** `EditRegionMesh.writeRegionMesh` and `regionMeshGeometry.regionWindingSign` decide whether the region is valid and whether Submit is enabled. Three related correctness issues:
  1. **Capacity guard publishes "valid" too early.** `writeRegionMesh` sets the valid color and `setRegionValid(true)` *before* the fixed-buffer capacity check (`MAX_VERTICES`/`MAX_INDICES`) returns. An over-capacity region (large/near-hemisphere, or future post-Subdivide) thus enables Submit and persists while the on-screen fill is stale or blank. Move the validity/color publish onto the successful-write path, after the capacity check.
  2. **Blank, not red, on first-load of an already-invalid stored region.** Entering edit mode on an event whose stored boundary is clockwise/untriangulatable takes the `geometry == null` branch and returns before any buffer was written, so recoloring an empty geometry shows *no* fill (not the intended red) while Submit is blocked — a confusing "nothing here but I can't submit" state.
  3. **`regionWindingSign` is a second source of truth that can falsely reject valid regions.** Its centroid-dot heuristic (un-normalized vertex sum) can flip sign for large/pole-spanning regions even when the boundary is CCW and `EarClipping` would triangulate fine, blocking Submit on a valid region. The triangulation try/catch is already authoritative; consider removing/replacing the parallel heuristic.

- [ ] `[plan first]` **Unify boundary-pin identity; harden single-pin live tracking (code review, 2026-06).** `EditRegionMesh` single-pin live polygon tracking requires `dragMesh.userData.locationId` to equal a `regionBoundaries[].id`, while `EditPinMesh` selects the dragged pin by `mesh.uuid` — two identity schemes. If `locationId` is ever unset/renamed/not propagated to a newly created pin (e.g. the planned Subdivide button), the guards silently no-op: the pin moves live but the polygon fill freezes at its drag-start shape, with no warning. Unify on one key. Related perf nit on the drag hot path: `writeRegionMesh` re-triangulates and runs `computeBoundingSphere` over the full 4096-vertex buffer every RAF with per-frame `Vector3` allocations — hoist scratch vectors, bound the bounding-sphere computation to the active vertex count, and skip the rebuild when the drag rotor is unchanged.

## Refactors

- [ ] `[plan first]` **Reconsider `[Required]` on `Event.EventImage` (required wrapper with nullable contents).** The `Event` model marks `EventImage` (also `Tags`, `Sources`) `[Required]`, and with `[ApiController]` a null wrapper makes `Create` return **400** before the action runs. So a client must always send an `EventImage` *object* even when there is no image — `frontendToBackend` sends `{ Id, ImageBinary: "" }`. A required wrapper whose contents are null/empty smells wrong. (Sub-objects like `EventImage` were intentionally split into separate tables so revisions don't haul copies of large fields — that part is good; the always-send-empty-wrapper requirement is the issue.) Decide: make `EventImage` truly optional (drop `[Required]`, allow null) so a no-image event sends no wrapper, and have `frontendToBackend` omit it when empty (`backendToFrontend` already tolerates null). **Check EF impact:** `[Required]` on the navigation may affect FK nullability — verify whether a migration is needed. Reassess `Tags`/`Sources` the same way (null vs empty list). Surfaced 2026-06 while building the live E2E seed, which hit the 400.

- [x] `[plan first]` **Wire image upload to backend.** Currently `EventImage.ImageBinary` is always sent as empty bytes. The frontend has an `imageDataUrl` field (base64 data URL). Need to: (1) convert the data URL to a byte array in `frontendToBackend` mapper, (2) store and retrieve binary image data via the backend API, (3) render it in `DisplayEventImage`. `eventIsCreationOfSource` is also missing from the backend `Event` model and must be added (with a migration) as part of this work.

- [ ] `[plan first]` **Lazy-load event images on selection to slim the `GetFirst100` payload.** Now that images persist (raw bytes in `EventImage.ImageBinary`), `GetFirst100` eager-loads `.Include(x => x.EventImage)`, so the search-list response carries the full base64 image bytes (~33% inflated) for up to 100 events — potentially several MB on the initial search. Two coupled costs:
  - **Backend payload:** strip image bytes from the list payload (a projection/DTO that omits `ImageBinary`, or a separate lighter read path) and fetch the full event (with image) only when an event is selected.
  - **Frontend retention (code-review finding):** `eventMapper.backendToFrontend` currently calls `imageBinaryToDataUrl` for *every* event, eagerly concatenating each event's full base64 body into a `data:...;base64,<...>` string held in `allEvents` Redux state — hundreds of MB of strings retained for a list that displays one image at a time. Keep the raw base64 in state and build the data URL lazily in `DisplayEventImage` (and `EditEventImage`) only when an event is actually shown.

- [ ] `[simple]` **Implement `GetEventOfTheDay` endpoint.** Currently throws `NotImplementedException`. Implement the logic to select and return a daily event.

- [ ] `[discussion]` **Redesign revision browsing as a visual stack of cards.** Revision browsing currently works as a clickable table of entries. The intended design is a stack of cards: the latest revision is shown as the top card; earlier revisions stack behind it visually, with the user able to click back through them. Discuss: exact visual design (card layout, depth cues, navigation controls), interaction model (swipe? buttons? collapse?), and whether the stack should be part of the details panel or a separate overlay. Prerequisite: revision browsing table must already work (it does).

- [ ] `[simple]` **Show revision author as a read-only label during event editing.** The revision author field is currently an input. Change it to a read-only label that displays what will be stored on submit. Hard-code the value to `"amdreallyfast"` (current GitHub account name) for now — a future account system will supply this automatically. See also: the account system discussion TODO in Design Discussions below.

- [ ] `[simple]` **Clarify source publication date label to "Estimated date of writing".** Many historical sources were written before any formalized publication system existed, so "publication date" is a misnomer. Rename the label in `EditSourcePublicationTimeRange.jsx` and its display counterpart to **"Estimated date of writing"** and add a sub-label note: *"Publication date is close enough, if available."*

## Interface

- [ ] `[plan first]` **Globe: Add "Subdivide" button for region boundaries in edit mode.** Adds a button in edit mode that doubles the number of boundary points, giving finer control over boundary shape. Each new point is inserted halfway between its two neighbors, preserving the counterclockwise order required by the ear-clipping algorithm (see `npmfrontend/src/GlobeSection/Region/regionMeshGeometry.js`, comment on class `EarClipping`). This change updates the event object and must cascade into boundary pin rendering; the new points must be immediately available for editing.

- [ ] `[discussion]` **Globe: Snap-click for boundary pins.** Add the ability to snap-click boundary pins (interaction model TBD).

- [ ] `[simple]` **Globe: Scale boundary pins with zoom level.** Add a scaling factor so boundary pins shrink as the user zooms in. Large pins and bounding boxes become obstacles when making detailed boundary edits at high zoom; smaller pins preserve usability.

- [ ] `[discussion]` **Add a text preview** (details TBD).

- [ ] `[plan first]` **Globe: Allow direct coordinate editing for boundary points.** Add a UI for editing boundary point coordinates as text. Must support all three common standards:
  1. **Decimal Degrees (DD):** Current default. Decimal value, positive/negative sign, no symbols. Positive = North/East, negative = South/West.
  2. **Degrees and Decimal Minutes (DDM):** Common for marine/GPS.
  3. **Degrees, Minutes, and Seconds (DMS):** Traditional map format.

- [ ] `[plan first]` **Date validation under a `JulianCalendar` (or similar) module.** Add per-field range validation (month 1-12, day 1-31; eventually day-of-month + leap-year aware) for event time and source publication date inputs, but house the validation logic in a calendar abstraction module so both inputs share one implementation. Working name `JulianCalendar`. Once this module exists, alternate calendar views (Chinese calendar year, AUC, Hijri, etc.) can be added as separate future TODO items, each layered on top without touching the core validation. The basic month 1-12 / day 1-31 range validation already shipped (enough to prevent backend 400s). Cross-ref the `[discussion]` "Date storage in days relative to 0 AD with Julian calendar conversion" in Design Discussions, which decides the storage format this module will adopt. Observed empirical cases that currently pass validation but are invalid dates: Feb 30, Nov 31 (any day=31 in a 30-day month). These per-month invalid combinations still slip through the basic range check and should be caught here.

- [x] `[plan first]` **Edit page stays open until backend submit confirms.** Today `EditEvent.onSubmitClick` calls `appendEvent` and `endEditMode` synchronously and then awaits `createEvent` non-blocking — if the backend rejects, the UI has already returned to display mode and the optimistically-appended entry sticks around until the next page reload (real bug observed during new-event testing on 2026-05-23). Change to: on Submit, overlay the edit panel with a semi-transparent gray scrim, show "Submitting..." text with an animated comet circling it (CSS keyframes, no library needed), keep the edit panel open until `createEvent` resolves. On success, exit edit mode and append. On failure, remove the scrim, leave edit mode active, and show an inline error so the user can fix and retry. Also rolls back the optimistic-update inconsistency where a 400 leaves a phantom entry in `allEvents` until reload. **Newly reachable (2026-06):** the server-side image validation added with the image-upload feature can now return a 422 (oversized / non-PNG-JPEG), so the phantom-event path is no longer hypothetical — this raises the priority. The frontend already validates with the same limits (guarded by a JS↔C# contract test), so divergence is the main remaining trigger, but any backend rejection (500, network) still produces the phantom until this is fixed.

- [ ] `[simple]` **Tab/Enter in tag input adds the tag and keeps focus on the same input (when non-empty).** Currently typing a tag and pressing Tab adds the tag but advances focus to the next field (the "creation of source" checkbox). Change the keydown handler on the tag input so that when the input has text, **both Tab and Enter** commit the current text as a new tag and refocus the same tag input, allowing rapid sequential entry: type "tag1" → Tab → type "tag2" → Enter → ... When the input is **empty**, Tab should fall through to default behavior and advance focus to the next element as normal (don't trap focus). See `EditEventHeader.jsx` (or wherever the tag input lives) — likely `e.preventDefault()` plus an explicit refocus call in the non-empty branch, and no preventDefault when empty.

- [ ] `[plan first]` **Tag editing and click-and-hold-to-delete with animated red border.** During edit mode (new or existing event), each tag in the header shows a small "X" in its upper-right corner. Interactions:
  - **Short single-click on the tag body:** replace the tag rendering with a text input so the value can be edited.
  - **Click-and-hold on the X:** an animated red border begins replacing the gray border, starting from the top-right (adjacent to the X) and progressing clockwise around the tag over 1.5s. If held the full duration, the tag is removed from the event — animate the disappearance over ~0.25s as a fade + collapse toward the bottom edge of the event header container (similar feel to a window-minimize). Focus advances to the new-tag input. If released early, the border returns to its prior color and the tag stays selected with the X still visible.
  - Files likely involved: `EditEventHeader.jsx` and any per-tag sub-component.

- [x] `[simple]` **Highlight currently selected revision in event details.** When displaying (not editing) an event, the revision currently loaded in the details panel should be visually distinct in the revision list (bold / colored border / background — pick something simple and obvious; keep it flexible for later restyling once the card-stack redesign happens). Clicking a different revision in the list loads it into the details panel and shifts the highlight to that row. Default selection is the latest revision; deselecting the event and reselecting it resets to latest. See `RevisionStack` (referenced in the "Redesign revision browsing as a visual stack of cards" Refactors discussion) — that bigger redesign is `[discussion]` and not blocking this incremental UX win.

- [x] `[plan first]` **Edit details: "Exact date" mode for time ranges.** Add an "exact date" toggle (checkbox/text box) to the event time-range editor. When enabled it: hides the "begin"/"end" labels, hides the entire end time-range inputs, and accepts entries only in the beginning time-range inputs. On submit the exact date must be recorded persistently. **Proxy approach (preferred, from prior discussion):** rather than introduce a separate boolean column, store the exact date by duplicating the beginning time values into the end time fields (begin == end signals "exact"). Confirm during planning whether begin==end is a safe, unambiguous proxy (e.g., can a legitimate range ever have identical begin/end that should NOT be treated as exact?). Repeat the same change for the **source publication date range** editor. **Do not change which fields are required** — partial dates must still submit: e.g. an event in year 603 with unknown month/day is acceptable and must be submittable. Files likely involved: `EditEventTimeRange.jsx` / `EditSourcePublicationTimeRange.jsx` and their display counterparts; cross-ref the `JulianCalendar` date-validation item above.

- [x] `[plan first]` **Edit details: A newly submitted or edited event becomes the selected event.** After submitting a brand-new event, that event should become the selected event in the UI (details panel + globe focus). Same for an edited event after submit. **Edit appears to already do this** — but during testing a network disruption produced a bad state: the UI looked like it loaded the event, yet the edited region boundaries and image were missing; a page reload + Search showed it correctly with the image. So this item is primarily: (1) ensure new-event submit selects the new event, and (2) **investigate/double-check the post-submit selection path under network failure** — the optimistic-update path may select an event whose region/image data never came back from the server. Cross-ref the `[plan first]` "Edit page stays open until backend submit confirms" item, which addresses the optimistic-submit phantom/rollback problem this likely stems from.

- [x] `[simple]` **Show details: Revision history as a 2-column table.** In display mode, render the revision history as a 2-column table: left column shows the usual `rev <number> - <user>`, right column shows the submittal date of that revision. Pull the submittal date from the revision's stored timestamp. See the revision-list rendering in the display details components (cross-ref the revision-highlight and card-stack redesign items above).

## Code Quality

- [ ] `[simple]` **Review and clean up lint errors.** `npm run lint` currently reports 292 problems across the codebase. Review each category (unused vars, missing prop-types, no-empty-pattern, react/no-unknown-property, react-hooks/exhaustive-deps) and fix or suppress with justification.

- [ ] `[simple]` **Standardize debug console.log messages.** Use this format throughout:
  ```js
  console.log({ "ClassName.functionName": argumentValue })
  console.log({ "ClassName.useEffect[dependency]": dependencyValue })
  ```

- [ ] `[simple]` **Disable console.log for production; keep for test.** *Prerequisite: complete "Standardize debug console.log messages" above first.* After log messages are standardized, gate them so they are active in test but suppressed in production. Use Vite's `import.meta.env.MODE` or a custom env variable.

- [ ] `[plan first]` **Add "X" button to top-right of details section for clean exit.** Three problems with the current exit UX: (1) the unsaved-changes warning is a browser `confirm()` popup, which looks out of place; (2) the cancel button does not warn about unsaved changes; (3) the only visible exit control is a button at the bottom of the details panel, requiring the user to scroll. Fix: add a visible "X" button anchored to the top-right corner of the details section. Behavior:
  - **Display mode:** clicking "X" deselects the current event and returns the details section to the empty "no event selected" state.
  - **Edit mode (no unsaved changes):** clicking "X" exits edit mode immediately.
  - **Edit mode (unsaved changes):** clicking "X" shows an in-page confirmation message (styled to match the app, not a browser popup) asking the user to confirm discarding changes. Replace the existing `window.confirm()` calls in `SearchSectionMain` with the same in-page prompt so the UX is consistent.

- [ ] `[simple]` **Drop dormant `[historyprojectapi-testing]` user from the prod SQL DB.** Created when Phase 4a's SQL grants were applied to the prod DB by mistake. Now harmless because the test App Service's MI authenticates against `HistoryProjectDb-Test`, not prod — but it's clutter. Run on `HistoryProjectDb` (prod): `DROP USER [historyprojectapi-testing];`

- [ ] `[discussion]` **Three.js skill/plugin for Claude.** Is there a skill or plugin for using Three.js with Claude Code? If not, what are the options? The Three.js API is central to this project (globe, meshes, raycasting, shaders), and having focused context would help. Options to explore: existing MCP servers, creating a custom skill from the Three.js docs, or downloading API reference for local use.

## Design Discussions (after features stabilize)

- [ ] `[discussion]` **Always-On on the test App Service.** Prod has Always-On enabled; test does not. Cold starts on test produce 504s and TdsParser failures. Trade-off: enabling Always-On on test increases load on the shared B1 plan (which already hosts both apps). Decide: enable, or accept slow first-hits on test as the cost of the environment.

- [ ] `[discussion]` **DevOps routine: PR-based workflow, preview environments, and the role of the `test` branch.** Now that prod and test have separate Azure resources (SWA + App Service each), consider whether the development workflow should evolve:
  - **Work item tracking:** TODO.md is simple and works for solo development. GitHub Issues/Projects would add visibility and PR linkage but adds overhead. Is the switch worth it?
  - **PR-based changes:** Should all changes go through PRs instead of direct branch pushes? PRs enable preview environments (SWA auto-creates one per open PR) so changes can be reviewed live before merging to main.
  - **Preview environments:** Azure Static Web Apps already supports per-PR preview URLs. If PRs are adopted, each open PR gets its own frontend URL. The backend would still need a strategy (share the test App Service, or spin up per-PR?).
  - **Role of the `test` branch:** Currently a long-lived branch that mirrors prod infrastructure. Options: (a) keep as a persistent staging/scratchpad branch, (b) retire it in favor of short-lived PR branches + preview environments, (c) use it as a PR merge target before promoting to main.
  - Decide before investing further in the test branch setup.

These are bigger architectural questions. Present options with pros/cons before doing anything.

- [ ] `[discussion]` **Replace "Edit" button with a "ghost revision card" to clarify intent.** The current "Edit" button implies modifying the existing event, but the data model always creates a new revision — it never overwrites. Consider replacing the button with a ghost/placeholder card (styled like a revision card but with a "+" icon) appended to the revision stack in the details section. Clicking it would open the edit interface. This framing makes "add a revision" the visible action rather than "edit", and fits naturally into the revision-card stack UI. Discuss: visual design, interaction model, whether this replaces or supplements the current button, and what the ghost card should look like when the revision stack is empty (i.e., no event selected or a new event).

- [ ] `[discussion]` **Frontend state persistence strategy.** The app currently keeps everything in Redux (in-memory). This was chosen because it's simple and disappears on tab close (no cookies needed). But Redux state has grown complex with multiple slices tracking different parts of the program. Questions to address:
  - Is this complexity necessary, or is it over-engineered?
  - Should cookies or sessionStorage be used instead for some of this state?
  - Is there a simpler state management approach that would work?
  - Present options with pros/cons.

- [ ] `[discussion]` **Incremental TypeScript adoption for the frontend (typed data-model boundary first).** Spun out of the Playwright E2E setup (whose tests are TS). Should `npmfrontend/` adopt TypeScript? Recommended path if pursued: type the data-model boundary first (`api/eventMapper.js`, `api/historyEventApi.js`, Redux slice payloads) via `allowJs`, or a lighter JSDoc + `checkJs` trial. Key caveat — several pending architectural items ("Sources as a distinct object vs. events", "Date storage in days relative to 0 AD", "Wire image upload to backend", "Frontend state persistence strategy") would reshape the exact types TS would encode, so sequencing matters. Full analysis (pros/cons, why Playwright is TS, cross-dependencies) in `claudePlans/6.TypeScriptAdoptionDiscussion.md`.

- [ ] `[discussion]` **Long-term data persistence and database choice.** The project's purpose is insight into historical events — seeing what events/characters were on the world stage at similar times and might have interacted. The current plan is SQL Server in Azure with REST API (axios), chosen from prior experience. But given the project's goals (multi-revision events, temporal queries, potential for discovering connections between events), there may be better options. Evaluate at least 5 options in a pros/cons table, then provide cost/benefit details on each:
  - Classic SQL (SQL Server, as currently planned)
  - Vector database (e.g., Qdrant — open source)
  - Event-sourced database
  - Document database (e.g., MongoDB, CosmosDB)
  - Graph database (e.g., Neo4j — for relationship discovery between events)
  - Any other options worth considering

- [ ] `[discussion]` **Account system: where does the revision author come from?** The revision author is currently hard-coded to `"amdreallyfast"`. Eventually, this should come from a logged-in user account. Questions to address: What account system to use (GitHub OAuth, Azure AD, custom)? How does the frontend pass identity to the backend? How does the backend validate it? What does the revision author field look like in the DB? Discuss options and trade-offs before implementing.

- [ ] `[discussion]` **Date storage in days relative to 0 AD with Julian calendar conversion.** Instead of storing year/month/day directly, consider storing dates as an integer count of days relative to January 1, 0 AD (proleptic Julian calendar). A conversion function to year/month/day (Julian calendar) would then open options for displaying dates in other calendar systems (Chinese calendar, AUC — years since the founding of Rome, etc.). Questions to address first: How do we define "day 0"? What calendar system is used for the reference point? How do we handle BCE dates (negative days)? Is there an established standard (e.g., Julian Day Number) we should adopt instead of inventing our own? This is a long-horizon architectural question — discuss before any storage changes.

- [ ] `[discussion]` **Sources as a distinct object vs. events tagged "creation of source".** The data model currently treats `EventSource` as its own object, but `Event` already has an `eventIsCreationOfSource` flag — implying the act of creating a source is itself a historical event worth recording. Discuss: collapse `EventSource` into `Event` so the Sources section becomes a read-only event search filtered by the flag, and sources are no longer "magical" standalone entities. Before deciding, audit the code for everywhere `EventSource` is used or referenced (backend model and migrations, frontend Redux slices `stateSliceEditSources` and `stateSliceEditSourceAuthors`, `eventMapper.js`, `EditEventSources` component) and read any in-code comments about future plans for sources so earlier intent isn't lost. Implications if we proceed: schema change, EF migration, removal of EventSource-specific UI in favor of an event-search filter, update of `frontendToBackend`/`backendToFrontend` mappers. Caveats: Deleting an event should not take down the whole chain of source events with it.

---

## Is this still needed/relevant?

Items extracted from older plan and design documents. Review and either promote to a section above or delete.

- [ ] **Clickable line mesh object.** Create a reusable "clickable line mesh" for use in boundary lines and timeline rendering on the globe surface. (From designNotes.txt, idea ~2024)

- [ ] **Boundary line on region mesh.** Render a visible boundary line on top of the region mesh. When selected, the line can be moved (moves boundary pins on either side) or subdivided (creates a new boundary pin and splits into two line segments). Prerequisite: clickable line mesh. (From designNotes.txt, idea ~2024)

- [ ] **Timeline object on globe surface.** Render a timeline object on the globe surface. When clicked, selects a timeline in the backend. (From designNotes.txt, idea ~2024, noted as "later")

- [ ] **Command pattern for CTRL-Z undo.** Implement the Command pattern so users can undo the last edit action. (From designNotes.txt, idea ~2024)

- [ ] **Star field brightness variation.** Make each star vary brightness with a random delay so they don't all pulse simultaneously. (From designNotes.txt)

- [ ] **Bug: react-three-fiber "points" does not record "name" when provided.** Possible upstream bug to report. (From designNotes.txt)

- [ ] **Full RecordsCreated/EverythingElse event type workflow.** The checkbox exists (`EditEventType.jsx`), but the full workflow is not built: "EverythingElse" events should require at least one source, and if the source isn't recorded yet, a "Create source" button should open a nested event creation interface locked to type "RecordsCreated". (From designNotes.txt, idea 2025-09-01)

- [ ] **Auto-set revisionAuthor from current user.** `setRevisionAuthor(...)` currently defaults to a hardcoded value. Should be set automatically based on the logged-in user. (From designNotes.txt)
