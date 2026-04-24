# TODO

Work items for the HistoryProject repository. Organized by priority — start from the top.

**Instructions for Claude:** Work through items top-to-bottom.
- `[simple]` — Just do it.
- `[plan first]` — Create a plan document, get user approval, then create a git branch and implement step-by-step with testing between steps.
- `[discussion]` — Present options and wait for the user to decide before doing anything.

Guidance:
1. For any item that would alter the program's design, do the following:
  1. highlight the change
  2. summarize the impact
  3. get permission before continuing
  4. when finished, update DESIGN.md
2. When making commits:
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
3. Perform no more than one TODO item (or for larger items, a single TODO step) per commit.
4. After completing any item:
  1. commit
  2. ask the user to test:
    1. If the test is successful, then mark the TODO item as complete, and commit. 
    2. If not, then attempt to diagnose the problem, and engage the user for missing info or unclear intent, and when it is working as the using expects, then mark the TODO item as complete, and commit the changes.

---

## Top Priority

---

## Bug Fixes

- [ ] `[plan first]` **Address GitHub Dependabot package vulnerabilities in npmfrontend (121 reported).** GitHub reports 121 vulnerabilities (4 critical, 59 high, 46 moderate, 12 low). Backend (.NET 10) packages appear current. Frontend npm packages are the source. Each step is its own implementation and verification cycle — commit and confirm the app works before proceeding to the next. Do not combine steps; interacting breaking changes from multiple major-version bumps are difficult to diagnose.

  1. **Remove accidental packages.** `save` and `@anthropic-ai/claude-code` are both listed as runtime dependencies but are almost certainly accidental installs — `save` from `npm install save` without `--save-dev`, and `@anthropic-ai/claude-code` (the Claude Code CLI tool) likely from early setup attempts to get Claude Code working. Neither is a runtime library used by this project. Verify neither is imported anywhere, then remove both. Removing them will likely eliminate a significant portion of transitive vulnerabilities. Run `npm audit` after; confirm app still works.
  2. **Apply non-breaking updates.** Run `npm audit fix` (no `--force`) to apply patch/minor fixes automatically. Run `npm audit` after; confirm app still works.
  3. **Upgrade `@reduxjs/toolkit` v1 → v2 (and `react-redux` v8 → v9).** These two are coupled — upgrade together since RTK v2 requires react-redux v9. Review migration guide, apply changes, run app end-to-end. Run `npm audit` after.
  4. **Upgrade `@tanstack/react-query` v4 → v5.** Breaking API changes (e.g., `cacheTime` → `gcTime`, `useQuery` result shape). Review migration guide, apply changes, run app end-to-end. Run `npm audit` after.
  5. **Upgrade `three` r156 → latest.** Three.js has breaking changes across minor versions. Review changelog, apply changes, test globe rendering. Run `npm audit` after.
  6. **For any vulnerability that still cannot be resolved** after the above steps, open a discussion item with specifics — what the package is, what the vulnerability is, and what alternatives exist.
  7. **Clean install verification.** Delete `npmfrontend/node_modules/` entirely, then run `npm install` from `npmfrontend/` to rebuild from the final `package.json`. Run `npm run dev` and confirm the app works end-to-end. This catches any implicit dependencies that were masked by leftover packages in node_modules.

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

- [x] `[simple]` **Dim other events' display regions in edit mode.** When edit mode is active, all other events' display regions and pins render in gray and are non-interactive (hover suppressed, clicks blocked). This replaced the earlier plan of hiding display meshes entirely and adding a globe-click confirmation dialog.

- [x] `[simple]` **Show edited event's display region as a blue ghost in edit mode.** The DisplayOnlyRegion for the event being edited renders in selected-blue (not dim gray) as a visual reference. EditRegionMesh raised to `sphereRadius + 0.1` so raycasting hits the edit mesh first. Fixed a stale-prop bug where `isBeingEdited` was computed in a useEffect without `editState` as a dependency — moved to a reactive `useSelector` inside `DisplayOnlyRegion`.

- [x] `[simple]` **Rename DisplayOnlyRegion to DisplayRegion.** No need for "Only" in the name.

- [x] `[simple]` **Deselect selected region.** When a selected search result or a selected region in the globe is selected again, deselect it. The selected event should become null.

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
  10. No `DisplayOnlyRegion` appears during editing — display regions come from `allEvents`, and the new event is not in `allEvents` until submitted. Full edit form is now shown.

  **Cancel and submit:**
  11. Cancel in edit mode exits via `editEventStateActions.endEditMode()`. The new event is discarded — it was never in `allEvents`.
  12. Submit follows the existing path — appends to `allEvents` and persists to the backend.

  **Files to modify:**
  - `stateSliceEditEvent.jsx`: Add `newEventAwaitingPlacement: false` to `initialState`; add `prepareNewEvent()` action; add `startNewEvent(spherePoint)` combined action; ensure `endEditMode()` clears the flag.
  - `DetailsMain.jsx`: Stage 1 "Create New Event" button and Stage 2 waiting-state UI.
  - `MouseHandler.jsx`: Detect `newEventAwaitingPlacement` + globe click → `startNewEvent()`; detect globe-empty-space click → deselect (blocked during edit and awaiting states).
  - `stateSliceSelectedEvent.jsx`: Verify/add a `clear` action for deselection.
  - No changes needed to `EditableRegion.jsx` or the existing `createNewRegion()` logic.

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
