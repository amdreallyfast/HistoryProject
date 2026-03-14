# Plan: Integrate Edit & Display Modes with Revision Tracking

## Current State

**What works:**
- Search button loads `events.json` and displays results in SearchSection
- Clicking a search result selects the event, highlights it, and shows pins/regions on globe
- `DetailsMain.jsx` switches between `DisplayEvent` (show mode) and `EditEvent` (edit mode) based on `editModeOn` in Redux
- Display components render read-only event data from `selectedEventReducer`
- Edit components render editable fields from `editEventReducer`
- `stateSliceEditEvent` has `loadEvent` action that copies event data into edit state
- `stateSliceEditEvent` has `startEditMode` / `endEditMode` actions

**What's missing / broken:**
1. No "Edit" button in DisplayEvent to enter edit mode
2. No "Cancel" button in EditEvent
3. Submit button exists but points at a backend API — needs to work with in-memory state
4. No revision tracking in `events.json` (no `revision` field)
5. No change detection (Submit should be disabled when nothing changed)
6. No confirmation dialog when selecting a different event while editing

## Data Model Change

Add `revision` and `revisionAuthor` fields to each event object in `events.json`:

```json
{
  "eventId": 1,
  "revision": 1,
  "revisionAuthor": "amdreallyfast",
  "title": "Test Title Event 1",
  ...
}
```

When submitting an edit, a new object is appended to the array with the same `eventId` but `revision` incremented by 1 and `revisionAuthor` set to `"amdreallyfast"`.

### On revision tracking systems

For a frontend-only JSON file, the simplest approach is the "full snapshot per revision" model. When the backend is ready:

- **Temporal tables** (SQL Server built-in): Automatically track row history with zero app code. Easiest backend solution.
- **Simple revision table**: What the backend data model already has (Event has `Revision` field). Full snapshots. Simple and works.
- **Event sourcing**: Powerful but adds complexity. Not recommended unless needed.

**Recommendation:** Full snapshots in `events.json` with `revision` field for now. Backend can use temporal tables or the existing revision model later.

## Implementation Steps

After each step, stop and let the user test. If it works, commit. If not, commit the attempt, debug, fix, commit fix, then proceed.

### Step 1: Add `revision` and `revisionAuthor` to `events.json`

- Add `"revision": 1` and `"revisionAuthor": "amdreallyfast"` to both existing events

### Step 2: Add "Edit" button to DisplayEvent

- Add an "Edit" button at the bottom-right of `DisplayEvent.jsx`
- On click: dispatch `editEventStateActions.loadEvent(currentSelectedEvent)` to copy selected event data into edit state (sets `editModeOn: true`)

### Step 3: Wire up Cancel button in EditEvent

- Add a "Cancel" button next to Submit
- On click: dispatch `editEventStateActions.endEditMode()` — resets edit state and returns to display mode
- No data changes occur

### Step 4: Implement Submit with revision tracking

- Replace `axios.post` in `onSubmitClick` with logic that:
  1. Reads `allEvents` from `eventReducer`
  2. Finds max revision for current `eventId`
  3. Constructs new event object from edit state with `revision: maxRevision + 1` and `revisionAuthor: "amdreallyfast"`
  4. Appends to allEvents array
  5. Dispatches updated allEvents to Redux
  6. Dispatches new revision to `selectedEventStateActions.load`
  7. Dispatches `editEventStateActions.endEditMode()`
- **Note:** Writing to `events.json` on disk isn't possible from the browser. New revisions live in Redux for the session. Backend will handle persistence later.

### Step 5: Change detection — disable Submit when no changes

- Store the original event snapshot in edit slice (`originalEvent` field, populated by `loadEvent`)
- Deep-compare edit state against original
- Disable Submit button when no changes detected

### Step 6: Confirmation dialog when selecting a different event during edit

- In `SearchSectionMain.jsx` and globe selection handlers: check `editModeOn` before dispatching new selection
- If editing, show `window.confirm()`: "You have unsaved changes. Discard and load the new event?"
  - Continue: `endEditMode()`, then select new event
  - Cancel: do nothing

### Step 7: Search results show latest revision only

- After fetching `events.json`, group by `eventId` and display only the highest `revision` per event

## File Change Summary

| File | Change |
|------|--------|
| `public/events.json` | Add `revision` and `revisionAuthor` to both events |
| `DetailsSection/Display/DisplayEvent.jsx` | Add "Edit" button |
| `DetailsSection/Edit/EditEvent.jsx` | Add Cancel button, rewrite Submit logic, add change detection |
| `AppState/stateSliceEditEvent.jsx` | Add `originalEvent` field, populate in `loadEvent` |
| `SearchSection/SearchSectionMain.jsx` | Add edit-mode guard, filter to latest revisions |
| `GlobeSection/Scene.jsx` (or selection handler) | Add edit-mode guard |

## Order of Implementation

1 → 2 → 3 → 4 → 5 → 6 → 7

Each step stops for user testing and a commit before proceeding.
