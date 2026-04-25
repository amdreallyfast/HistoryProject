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

## Top Priority

---

## Bug Fixes

- [ ] `[simple]` **THREE.Clock deprecation warning still present after fiber v9 upgrade.** **Ignore for now (Friday, 2026/04/25).** After upgrading to `@react-three/fiber` v9.6.0, the console still shows: `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` The source is `node_modules/@react-three/fiber/dist/events-760a1017.esm.js:985` — not project code. The wheel-event violation warning is gone; only the Clock warning remains. Revisit when a newer fiber stable release migrates its internal clock to `THREE.Timer`.

- [x] `[simple]` **Bug: Earliest event/source date can be set later than the latest date.** When entering event time or a source publication time, there is no validation preventing the user from entering an earliest date that is chronologically later than the latest date. Add a cross-field validation rule to `EditEventTime.jsx` and `EditSourcePublicationTimeRange.jsx` that flags this as an error (red border, error message) and blocks submit.

- [ ] `[simple]` **Bug: Adding a source does not create a new revision.** When the user adds a source to an event and submits, the `hasChanges` check in `EditEvent.jsx` compares `editSourceKeys.length !== orig.sources.length` — but `orig.sources` comes from `editState.originalEvent.sources`, which is populated when edit mode begins. Verify whether the source count comparison is actually firing and, if not, trace why the submit path treats an added source as "no change". Adding a source should count as a revision.

## Refactors

- [ ] `[plan first]` **Wire image upload to backend.** Currently `EventImage.ImageBinary` is always sent as empty bytes. The frontend has an `imageDataUrl` field (base64 data URL). Need to: (1) convert the data URL to a byte array in `frontendToBackend` mapper, (2) store and retrieve binary image data via the backend API, (3) render it in `DisplayEventImage`. `eventIsCreationOfSource` is also missing from the backend `Event` model and must be added (with a migration) as part of this work.

- [ ] `[simple]` **Implement `GetEventOfTheDay` endpoint.** Currently throws `NotImplementedException`. Implement the logic to select and return a daily event.

- [ ] `[discussion]` **Redesign revision browsing as a visual stack of cards.** Revision browsing currently works as a clickable table of entries. The intended design is a stack of cards: the latest revision is shown as the top card; earlier revisions stack behind it visually, with the user able to click back through them. Discuss: exact visual design (card layout, depth cues, navigation controls), interaction model (swipe? buttons? collapse?), and whether the stack should be part of the details panel or a separate overlay. Prerequisite: revision browsing table must already work (it does).

- [ ] `[simple]` **Show revision author as a read-only label during event editing.** The revision author field is currently an input. Change it to a read-only label that displays what will be stored on submit. Hard-code the value to `"amdreallyfast"` (current GitHub account name) for now — a future account system will supply this automatically. See also: the account system discussion TODO in Design Discussions below.

- [ ] `[simple]` **Clarify source publication date label to "Estimated date of writing".** Many historical sources were written before any formalized publication system existed, so "publication date" is a misnomer. Rename the label in `EditSourcePublicationTimeRange.jsx` and its display counterpart to **"Estimated date of writing"** and add a sub-label note: *"Publication date is close enough, if available."*

## Globe Interaction

- [ ] `[plan first]` **Create new event workflow.** Implement the full workflow for creating a new event from scratch. *Prerequisite: submitting an event to the backend must work first (see "End-to-end event workflow" refactor above).* Consolidates and supersedes two items in "Is this still needed?" below ("No event selected state with Create New Event button" and "Deselect event process") — remove those when implementing this.

  **Deselection (implement first — prerequisite for the new-event button):**
  1. Clicking empty globe space (no mesh hit other than the globe itself) while an event is selected should deselect it and return the details section to "No event selected". Add to `MouseHandler.jsx`: detect a click where no display mesh and no pin is hit, and dispatch `setSelectedEvent(null)` plus clear `selectedEventReducer`. Must not fire during edit mode or during the "awaiting placement" pre-edit state (see below).
  2. Clicking the same search result again already deselects — keep that behavior.
  3. An event in edit mode cannot be deselected via globe or search-result click. Leave deselection from edit mode to the cancel process.

  **"Create New Event" button — Stage 1 (idle):**
  4. When no event is selected, `DetailsMain.jsx` shows "No event selected" and a "Create New Event" button.

  **Awaiting globe placement — Stage 2 (pre-edit waiting state):**
  5. Clicking "Create New Event" does NOT enter edit mode immediately. Instead, it sets a new flag `newEventAwaitingPlacement: true` in `stateSliceEditEvent` via a new action (e.g., `prepareNewEvent()`). Edit mode is NOT yet active.
  6. While `newEventAwaitingPlacement` is true, the details section shows: the button text changed to "Click on globe" (disabled/unclickable) and a "Cancel" button below it. No edit form fields yet.
  7. Clicking Cancel clears `newEventAwaitingPlacement` and returns to Stage 1.

  **Globe click → edit mode — Stage 3:**
  8. `MouseHandler.jsx` detects `editState.newEventAwaitingPlacement && clickedGlobe`. Dispatches a new combined action `startNewEvent(spherePoint)` that atomically sets `editModeOn: true`, `primaryLoc: spherePoint`, and clears `newEventAwaitingPlacement`. Single dispatch = single render; avoids an intermediate state where edit mode is on but no location exists.
  9. `EditableRegion` sees the new `primaryLoc` and auto-creates 8 default boundary pins in the correct order for ear-clipping triangulation — this is the existing behavior and should not change.
  10. No `DisplayRegion` appears during editing — display regions come from `allEvents`, and the new event is not in `allEvents` until submitted. Full edit form is now shown.

  **Cancel and submit:**
  11. Cancel in edit mode exits via `editEventStateActions.endEditMode()`. The new event is discarded — it was never in `allEvents`.
  12. Submit follows the existing path — appends to `allEvents` and persists to the backend.

  **Files to modify:**
  - `stateSliceEditEvent.jsx`: Add `newEventAwaitingPlacement: false` to `initialState`; add `prepareNewEvent()` action; add `startNewEvent(spherePoint)` combined action; ensure `endEditMode()` clears the flag.
  - `DetailsMain.jsx`: Stage 1 "Create New Event" button and Stage 2 waiting-state UI.
  - `MouseHandler.jsx`: Detect `newEventAwaitingPlacement` + globe click → `startNewEvent()`; detect globe-empty-space click → deselect (blocked during edit and awaiting states).
  - `stateSliceSelectedEvent.jsx`: Verify/add a `clear` action for deselection.
  - No changes needed to `EditableRegion.jsx` or the existing `createNewRegion()` logic.

- [ ] `[plan first]` **Add "Subdivide" button for region boundaries in edit mode.** Adds a button in edit mode that doubles the number of boundary points, giving finer control over boundary shape. Each new point is inserted halfway between its two neighbors, preserving the counterclockwise order required by the ear-clipping algorithm (see `npmfrontend/src/GlobeSection/Region/regionMeshGeometry.js`, comment on class `EarClipping`). This change updates the event object and must cascade into boundary pin rendering; the new points must be immediately available for editing.

- [ ] `[discussion]` **Snap-click for boundary pins.** Add the ability to snap-click boundary pins (interaction model TBD).

- [ ] `[simple]` **Scale boundary pins with zoom level.** Add a scaling factor so boundary pins shrink as the user zooms in. Large pins and bounding boxes become obstacles when making detailed boundary edits at high zoom; smaller pins preserve usability.

- [ ] `[discussion]` **Add a text preview** (details TBD).

- [ ] `[plan first]` **Allow direct coordinate editing for boundary points.** Add a UI for editing boundary point coordinates as text. Must support all three common standards:
  1. **Decimal Degrees (DD):** Current default. Decimal value, positive/negative sign, no symbols. Positive = North/East, negative = South/West.
  2. **Degrees and Decimal Minutes (DDM):** Common for marine/GPS.
  3. **Degrees, Minutes, and Seconds (DMS):** Traditional map format.

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

- [ ] `[discussion]` **Three.js skill/plugin for Claude.** Is there a skill or plugin for using Three.js with Claude Code? If not, what are the options? The Three.js API is central to this project (globe, meshes, raycasting, shaders), and having focused context would help. Options to explore: existing MCP servers, creating a custom skill from the Three.js docs, or downloading API reference for local use.

## Design Discussions (after features stabilize)

- [ ] `[discussion]` **Test vs. production database strategy.** The Azure test environment (historyprojectswa-testing / historyprojectapi-testing) currently points to the same production SQL DB. This creates three distinct scenarios with no test isolation in the cloud:
  1. Local development: `npm run dev` + `dotnet run` (Development mode) → local SQL Express → seeded test data via `SeedLocalDbTestData`
  2. Cloud test: Azure SWA testing → historyprojectapi-testing → production SQL DB (shared with prod, no test isolation)
  3. Cloud production: Azure SWA → historyprojectapi → production SQL DB

  The app cannot distinguish scenarios 2 vs. 3 without compile-time constants (which we want to avoid). Decide: should the test App Service get its own SQL DB? If so, what's the promotion/migration strategy? Present options and trade-offs.

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

- [ ] `[discussion]` **Long-term data persistence and database choice.** The project's purpose is insight into historical events — seeing what events/characters were on the world stage at similar times and might have interacted. The current plan is SQL Server in Azure with REST API (axios), chosen from prior experience. But given the project's goals (multi-revision events, temporal queries, potential for discovering connections between events), there may be better options. Evaluate at least 5 options in a pros/cons table, then provide cost/benefit details on each:
  - Classic SQL (SQL Server, as currently planned)
  - Vector database (e.g., Qdrant — open source)
  - Event-sourced database
  - Document database (e.g., MongoDB, CosmosDB)
  - Graph database (e.g., Neo4j — for relationship discovery between events)
  - Any other options worth considering

- [ ] `[discussion]` **Account system: where does the revision author come from?** The revision author is currently hard-coded to `"amdreallyfast"`. Eventually, this should come from a logged-in user account. Questions to address: What account system to use (GitHub OAuth, Azure AD, custom)? How does the frontend pass identity to the backend? How does the backend validate it? What does the revision author field look like in the DB? Discuss options and trade-offs before implementing.

- [ ] `[discussion]` **Date storage in days relative to 0 AD with Julian calendar conversion.** Instead of storing year/month/day directly, consider storing dates as an integer count of days relative to January 1, 0 AD (proleptic Julian calendar). A conversion function to year/month/day (Julian calendar) would then open options for displaying dates in other calendar systems (Chinese calendar, AUC — years since the founding of Rome, etc.). Questions to address first: How do we define "day 0"? What calendar system is used for the reference point? How do we handle BCE dates (negative days)? Is there an established standard (e.g., Julian Day Number) we should adopt instead of inventing our own? This is a long-horizon architectural question — discuss before any storage changes.

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
