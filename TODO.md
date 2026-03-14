# TODO

Work items for the HistoryProject. Organized by priority — start from the top.

**Instructions for Claude:** Work through items top-to-bottom. For items marked `[simple]`, just do them. For items marked `[plan first]`, create a plan document, get user approval, then implement step-by-step with testing between steps. For items marked `[discussion]`, present options and wait for the user to decide before doing anything.

---

## Bug Fixes

- [ ] `[simple]` **Display region pins don't update after edit submit.** After editing an event's region boundaries and submitting, the DisplayRegion mesh moves correctly, but the region boundary pins stay in their original positions.

- [ ] `[simple]` **Clean up stale TODO comments.** Some comments in EditEvent.jsx reference RevisionAuthor, Sources, Summary, and "Edit button in show mode" as TODOs, but these are already implemented. Find and remove all outdated TODO comments across the codebase.

## Refactors

These two refactors address the same root cause (imperative DOM manipulation + stale closures) and should be done together.

- [ ] `[plan first]` **Refactor SearchSectionMain to be fully reactive.** The current SearchSectionMain stores pre-built `<p>` React elements in useState. This means click handler closures capture stale Redux state (allEvents, selectedEvent), requiring refs as workarounds. Similarly, selection highlighting uses `document.getElementById` to imperatively set classNames instead of letting React re-render. Refactor to:
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

## Code Quality

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
