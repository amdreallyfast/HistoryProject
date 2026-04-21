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

- [x] `[plan first]` **Set up local SQL Server database for backend development.** The Azure deployment uses Managed Identity to connect to Azure SQL, but local development needs a real SQL Server connection. `Program.cs` now reads `ConnectionStrings:LocalDb` from `appsettings.Development.json` (gitignored) when running in Development mode. This file does not yet exist — local backend development is blocked until a local SQL Server instance is set up and the file is created. Plan needed: install SQL Server locally (or use Docker), create the database, run EF migrations, and create `appsettings.Development.json`.

- [ ] `[discussion]` **Host application in Azure (main + test environments with CI from GitHub).** Currently running on a small VM requiring manual `npm run dev`. Goal: browser-accessible URL for both main and test environments, auto-updated on push to the respective GitHub branch. Evaluate and decide:

  1. **Hosting option for the React frontend:**
     - Azure Static Web Apps (free tier) — purpose-built for SPAs, built-in GitHub Actions CI/CD, custom domains, free SSL. Likely the best fit and cheapest option.
     - Azure App Service (Basic B1 ~$13/mo) — more general, supports both frontend and backend on one plan, but overkill for a static frontend.

  2. **Hosting option for the ASP.NET Core backend:**
     - Azure App Service Free (F1) — limited (60 CPU-min/day, no custom domain, no always-on), but $0.
     - Azure App Service Basic (B1, ~$13/mo) — always-on, custom domain, SSL, reasonable for light use.
     - Azure Functions (Consumption plan) — pay-per-execution (~$0 at low traffic). The backend is a standard REST controller — it would need to be refactored into Azure Functions or wrapped with a Function proxy. Adds complexity.
     - Recommendation to evaluate: App Service Free tier for now (cheap/free), upgrade to B1 when always-on matters. Functions are cheaper at scale but require refactor.

  3. **Database:** Azure SQL is expensive (~$5–15/mo minimum). Evaluate:
     - Azure SQL Database (serverless, auto-pause) — cheapest SQL Server option, pauses when idle.
     - Keep existing SQL Server on the VM for now and only migrate the app hosting.

  4. **CI/CD via GitHub Actions:**
     - Azure Static Web Apps has first-class GitHub Actions integration (auto-generates workflow on creation).
     - Azure App Service supports GitHub Actions deployment via publish profile secrets.
     - Branching strategy: `main` branch → production slot; `test` branch → staging slot or separate App Service instance.
     - Azure deployment slots (requires Standard tier ~$70/mo) vs. two separate free/basic instances.

  5. **Recommended path to evaluate (least expensive):**
     - Frontend: Azure Static Web Apps (Free tier) with built-in CI for main + test.
     - Backend: Azure App Service Free (F1) × 2 (one per environment), or a single Basic B1 with deployment slots.
     - Database: Stay on VM DB for now OR migrate to Azure SQL Serverless.
     - Walk through setup step by step once option is chosen.

---

## Bug Fixes

- [x] `[simple]` **Display region pins don't update after edit submit.** After editing an event's region boundaries and submitting, the DisplayRegion mesh moves correctly, but the region boundary pins stay in their original positions.

- [x] `[simple]` **Clean up stale TODO comments.** Some comments in EditEvent.jsx reference RevisionAuthor, Sources, Summary, and "Edit button in show mode" as TODOs, but these are already implemented. Find and remove all outdated TODO comments across the codebase.

## Refactors

- [x] `[simple]` **Update project to .NET 10.** The machine only has the .NET 10 SDK installed. After local dev and test database environments are working, retarget `WebAPI.csproj` from `net8.0` to `net10.0` and verify the backend builds and runs.

These two refactors address the same root cause (imperative DOM manipulation + stale closures) and should be done together.

- [x] `[plan first]` **Refactor SearchSectionMain to be fully reactive.** The current SearchSectionMain stores pre-built `<p>` React elements in useState. This means click handler closures capture stale Redux state (allEvents, selectedEvent), requiring refs as workarounds. Similarly, selection highlighting uses `document.getElementById` to imperatively set classNames instead of letting React re-render. Refactor to:
  1. Store only data in state (e.g., a list of eventIds or a search query), not JSX elements. Render the search results directly from allEvents (filtered to latest revisions) during each render cycle.
  2. Remove all `document.getElementById` / imperative className manipulation. Use React's rendering — compare `eventId === selectedEvent?.eventId` inline to pick the right CSS class.
  3. This eliminates the stale closure problem entirely (no stored JSX = no frozen closures) and removes the need for `allEventsRef`.
  4. Apply the same principle to EditEventRegion, which also uses `document.getElementById` to highlight lat/long text — it should derive highlight state from Redux during render instead.
  5. Review other components for the same anti-pattern: storing JSX in useState or using `document.getElementById` to update styling.
  6. The goal is: components read from Redux and render. No imperative DOM manipulation, no JSX in useState, no refs to work around stale closures.

- [ ] `[plan first]` **Refactor EditEvent submit to be minimal; make display updates reactive.** EditEvent's submit handler currently does too much (builds sphere points, dispatches to multiple slices, manages selection). Refactor so submit only appends the new revision to allEvents and ends edit mode. Move the reactive behavior into useEffects:
  1. In SearchSectionMain, extract the search result list building into a useEffect that watches allEvents so results auto-rebuild when events change (showing latest revisions with updated titles).
  2. Add a useEffect (in SearchSectionMain or DetailsMain) that watches allEvents and selectedEvent — when allEvents changes and there's a selected event, look up the latest revision for that eventId and re-dispatch it to `selectedEventStateActions.load` with proper sphere points.
  3. Simplify EditEvent's `onSubmitClick` to just: append new event to allEvents, end edit mode. Remove all the sphere-point creation and selectedEvent dispatching from submit.
  4. This way submit is only responsible for saving, and display updates are reactive.

- [ ] `[simple]` **Implement `GetEventOfTheDay` endpoint.** Currently throws `NotImplementedException`. Implement the logic to select and return a daily event.

## Globe Interaction

- [ ] `[plan first]` **Make DisplayRegion selectable via mouse.** The DisplayRegion needs to be detectable by the mouse handler. When the mouse hovers over it, the region, region boundary pins, and primary pin should all adopt a "hover" color. When clicked, it should become the selected event. This used to partially work before the Display regions were overhauled. Relevant code is scattered across `GlobeSection/Scene.jsx`, `GlobeSection/MouseHandler.jsx`, `stateSliceMouseInfo.jsx`, and various mesh files. Currently, EditPinMesh uses a visible bounding box for selection that integrates with clickAndDrag, but that's for edit mode. Display mode just needs hover detection and click-to-select. Key details:
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

- [ ] `[discussion]` **Three.js skill/plugin for Claude.** Is there a skill or plugin for using Three.js with Claude Code? If not, what are the options? The Three.js API is central to this project (globe, meshes, raycasting, shaders), and having focused context would help. Options to explore: existing MCP servers, creating a custom skill from the Three.js docs, or downloading API reference for local use.

## Design Discussions (after features stabilize)

These are bigger architectural questions. Present options with pros/cons before doing anything.

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
