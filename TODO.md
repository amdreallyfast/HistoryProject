# TODO

Work items for the HistoryProject. Organized by priority — start from the top.

**Instructions for Claude:** Work through items top-to-bottom.
- `[simple]` — Just do it.
- `[plan first]` — Create a plan document, get user approval, then create a git branch and implement step-by-step with testing between steps.
- `[discussion]` — Present options and wait for the user to decide before doing anything.

For any item that would alter the program's design: highlight the change, summarize the impact, and get permission before continuing. If approved, also update DESIGN.md.

After completing any item, commit the changes, and ask the user the test. 
- If the test is successful, then mark the TODO item as complete, and commit. 
- If not, then attempt to diagnose the problem, and engage the user for missing info or unclear intent, and when it is working as the using expects, then mark the TODO item as complete, and commit the changes.

---

## Top Priority

---

## Bug Fixes

- [ ] `[plan first]` **Address GitHub Dependabot package vulnerabilities in npmfrontend (121 reported).** GitHub reports 121 vulnerabilities (4 critical, 59 high, 46 moderate, 12 low). Backend (.NET 10) packages appear current. Frontend npm packages are the source. Each step is its own implementation and verification cycle — commit and confirm the app works before proceeding to the next. Do not combine steps; interacting breaking changes from multiple major-version bumps are difficult to diagnose.

  1. **Remove accidental `save` package.** `save` is listed as a runtime dependency but is almost certainly an accidental `npm install save` — it is not used by this project. Removing it will likely eliminate a significant portion of transitive vulnerabilities. Verify it is not imported anywhere before removing. Run `npm audit` after; confirm app still works.
  2. **Apply non-breaking updates.** Run `npm audit fix` (no `--force`) to apply patch/minor fixes automatically. Run `npm audit` after; confirm app still works.
  3. **Upgrade `@reduxjs/toolkit` v1 → v2 (and `react-redux` v8 → v9).** These two are coupled — upgrade together since RTK v2 requires react-redux v9. Review migration guide, apply changes, run app end-to-end. Run `npm audit` after.
  4. **Upgrade `@tanstack/react-query` v4 → v5.** Breaking API changes (e.g., `cacheTime` → `gcTime`, `useQuery` result shape). Review migration guide, apply changes, run app end-to-end. Run `npm audit` after.
  5. **Upgrade `three` r156 → latest.** Three.js has breaking changes across minor versions. Review changelog, apply changes, test globe rendering. Run `npm audit` after.
  6. **For any vulnerability that still cannot be resolved** after the above steps, open a discussion item with specifics — what the package is, what the vulnerability is, and what alternatives exist.

  Goal: reach zero critical and high severity issues; accept low/moderate only if there is no available fix.

## Refactors

- [ ] `[plan first]` **End-to-end event workflow: seed test data, edit/submit, search refresh, globe update, revision browsing.** *Prerequisite: complete "Refactor EditEvent submit to be minimal" below first — that reactive architecture is what makes steps 3–5 here work automatically.* The two test events in `npmfrontend/dist/events.json` need to be in the localDB so the full workflow can be exercised. Once that's done, the following needs to work end-to-end:
  1. **Seed test data:** Import the two events from `events.json` into the local SQL Server DB so the backend returns real data.
  2. **Edit and submit as new revision:** Editing an event and submitting must write a new revision to the DB (not overwrite) and return it to the frontend.
  3. **Search refresh:** After submit, the search must re-run and return the latest revision for each eventId.
  4. **Globe and details update:** The globe and details section must reflect the newly submitted revision immediately after submit.
  5. **Exit to display mode:** After submit, the UI must switch from edit mode to display mode showing the updated event.
  6. **Revision browsing in details:** The details section should display revisions as a stack of cards — the latest revision is shown by default, but the user can click back through older revisions and see both the details and the globe update to reflect whichever revision is selected. When search runs, it always finds the latest revision; the stack makes the existence of prior revisions visible.

  This is the minimum viable feature set needed before the UI work can go much further.

- [x] `[plan first]` **Refactor EditEvent submit to be minimal; make display updates reactive.** EditEvent's submit handler currently does too much (builds sphere points, dispatches to multiple slices, manages selection). Refactor so submit only appends the new revision to allEvents and ends edit mode. Move the reactive behavior into useEffects:
  1. In SearchSectionMain, extract the search result list building into a useEffect that watches allEvents so results auto-rebuild when events change (showing latest revisions with updated titles).
  2. Add a useEffect (in SearchSectionMain or DetailsMain) that watches allEvents and selectedEvent — when allEvents changes and there's a selected event, look up the latest revision for that eventId and re-dispatch it to `selectedEventStateActions.load` with proper sphere points.
  3. Simplify EditEvent's `onSubmitClick` to just: append new event to allEvents, end edit mode. Remove all the sphere-point creation and selectedEvent dispatching from submit.
  4. This way submit is only responsible for saving, and display updates are reactive.

- [ ] `[simple]` **Implement `GetEventOfTheDay` endpoint.** Currently throws `NotImplementedException`. Implement the logic to select and return a daily event.

## Globe Interaction

- [x] `[plan first]` **Make DisplayRegion selectable via mouse.** The DisplayRegion needs to be detectable by the mouse handler. When the mouse hovers over it, the region, region boundary pins, and primary pin should all adopt a "hover" color. When clicked, it should become the selected event. This used to partially work before the Display regions were overhauled. Relevant code is scattered across `GlobeSection/Scene.jsx`, `GlobeSection/MouseHandler.jsx`, `stateSliceMouseInfo.jsx`, and various mesh files. Currently, EditPinMesh uses a visible bounding box for selection that integrates with clickAndDrag, but that's for edit mode. Display mode just needs hover detection and click-to-select. Key details:
  - The ThreeJS raycaster in Scene.jsx (`state.raycaster.intersectObjects(meshes)`) provides all meshes under the cursor, but only if the mesh is in the `meshes` collection.
  - The mouse handler's left-click handler needs the eventId in the mesh's userData to select the event.
  - Must select the top-most intersected mesh since the raycaster goes through everything and there could be other events in the path of the ray from camera to cursor that are behind the top-most region.
  - Mesh names are compared against const values to sort out what's being detected.
  - If this code can be cleaned up during implementation, propose improvements.

- [ ] `[simple]` **Add edit-mode guard to globe selection.** Once DisplayRegion is selectable from the globe, add the same confirmation dialog as SearchSectionMain: "You have unsaved changes. Discard and load the new event?"

- [ ] `[simple]` **When entering edit mode, hide display meshes.** The display meshes should stop rendering so they don't interfere with selecting edit region/pin meshes.

- [ ] `[simple]` **Rename DisplayOnlyRegion to DisplayRegion.** No need for "Only" in the name.

- [ ] `[simple]` **Deselect selected region.** When a selected search result or a selected region in the globe is selected again, deselect it. The selected event should become null.

## Code Quality

- [ ] `[simple]` **Review and clean up lint errors.** `npm run lint` currently reports 292 problems across the codebase. Review each category (unused vars, missing prop-types, no-empty-pattern, react/no-unknown-property, react-hooks/exhaustive-deps) and fix or suppress with justification.

- [ ] `[simple]` **Standardize debug console.log messages.** Use this format throughout:
  ```js
  console.log({ "ClassName.functionName": argumentValue })
  console.log({ "ClassName.useEffect[dependency]": dependencyValue })
  ```

- [ ] `[plan first]` **Add "X" button to top-right of details section for clean exit.** Three problems with the current exit UX: (1) the unsaved-changes warning is a browser `confirm()` popup, which looks out of place; (2) the cancel button does not warn about unsaved changes; (3) the only visible exit control is a button at the bottom of the details panel, requiring the user to scroll. Fix: add a visible "X" button anchored to the top-right corner of the details section. Behavior:
  - **Display mode:** clicking "X" deselects the current event and returns the details section to the empty "no event selected" state.
  - **Edit mode (no unsaved changes):** clicking "X" exits edit mode immediately.
  - **Edit mode (unsaved changes):** clicking "X" shows an in-page confirmation message (styled to match the app, not a browser popup) asking the user to confirm discarding changes. Replace the existing `window.confirm()` calls in `SearchSectionMain` with the same in-page prompt so the UX is consistent.

- [ ] `[discussion]` **Three.js skill/plugin for Claude.** Is there a skill or plugin for using Three.js with Claude Code? If not, what are the options? The Three.js API is central to this project (globe, meshes, raycasting, shaders), and having focused context would help. Options to explore: existing MCP servers, creating a custom skill from the Three.js docs, or downloading API reference for local use.

## Design Discussions (after features stabilize)

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

- [ ] **"No event selected" state with "Create New Event" button.** When no event is selected, the Display section should show "No event selected" and a "Create New Event" button. Clicking it should allow globe-click to create a new event in edit mode. (From searchDisplayEditOverhaulPlan.md)

- [ ] **Deselect event process.** Clicking empty space in the search section or on the globe (not on another event) should deselect the current event, returning Display to its empty state. An event in edit mode cannot be deselected. (From searchDisplayEditOverhaulPlan.md)
