# DESIGN.md — Living Design Document

This document captures the vision, architecture, and design decisions for the HistoryProject. It consolidates information from prior plan documents (now archived in `claudePlans/`), the codebase, and the project pitch. This is a living document — update it as the project evolves.

---

## Vision

History is all the events that have happened in the past. Many events happen at the same time but in different locations, and we often don't stop to think about it — in part because we may not be aware of many events beyond our own sphere, and partly because words alone can only describe one topic at a time, requiring significant effort to sort through historical writings just to get a simple summary.

This project combines **historical event summaries**, an **interactive 3D globe**, and an **explorable timeline** to help users visualize where and when events occurred. The goal is to give users a better understanding of events going on in the world and how close they were to each other in space and time, which could help us better understand how people lived and thought.

The same model could also be used for fictional worlds (D&D campaigns, Star Wars canon, etc.) — anywhere spatial and temporal relationships between events matter.

**UI Mockup:** See `HistoryProjectUIMockup.png` in the project root. The mockup shows:
- **Left panel:** Search with title input, date range (From/To), and a results list
- **Center:** 3D globe with event pins and labels
- **Right panel:** Event details (title, date range, description text, sources list, "New source" input, Save button)
- **Bottom:** Timeline bar showing events plotted by date, with labels and connecting dots

**Figma:** https://www.figma.com/file/CWC9qvbeZaZbEf8EZQ4b5Y/HistoryProject?node-id=0%3A1

---

## Architecture Overview

### Full-Stack Structure

```
HistoryProject/
  npmfrontend/     React + Vite frontend (Three.js, Redux Toolkit, TanStack React Query, Tailwind CSS)
  WebAPI/          ASP.NET Core (.NET 10) backend (Entity Framework Core, SQL Server, Azure Key Vault)
```

The frontend is the primary development focus. The backend exists but is not actively wired up — the frontend currently uses a local `events.json` file as a data source, with Redux holding session state.

### Frontend Layout (App.jsx)

Four main sections, matching the UI mockup:

| Section | Component | Purpose |
|---------|-----------|---------|
| Left | `SearchSection/SearchSectionMain` | Search interface, results list |
| Center | `GlobeSection/GlobeSectionMain` | 3D globe with pins, regions, raycasting |
| Right | `DetailsSection/DetailsMain` | Event details — switches between Display and Edit modes |
| Bottom | Timeline (placeholder) | Not yet implemented |

---

## Data Model

### Event

An event represents something that happened at a place and time. Events support **revision tracking** — each edit creates a new revision with the same `eventId` but an incremented `revision` number.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| eventId | int | yes | Shared across all revisions of this event |
| revision | int | yes | Incremented on each edit |
| revisionAuthor | string | yes | Who created this revision |
| title | string | yes | |
| summary | string | no | |
| eventIsCreationOfSource | bool | no | If true, this event IS the creation of a source document |
| eventTime | object | yes | `{ earliestYear, earliestMonth, earliestDay, latestYear, latestMonth, latestDay }` |
| primaryLocation | object | yes | `{ lat, long }` — the pin on the globe |
| regionBoundaries | array | no | Array of `{ lat, long }` defining the event's geographic region |
| sources | array | conditional | Required for non-source-creation events |
| tags | array | no | Strings for categorization |
| eventImage | object | no | Image binary data |

### Event Time

Both events and sources use the same time representation: an **earliest possible** and **latest possible** date. Each bound has year (required), month (optional), and day (optional). When earliest equals latest, the time is exact.

```
eventTime: {
  earliestYear: -776,  earliestMonth: 7,  earliestDay: null,
  latestYear: -776,    latestMonth: 7,    latestDay: null
}
```

Negative years represent BCE. This structure supports uncertainty ("sometime between 500 and 600 CE") and precision ("March 15, 44 BCE, exact").

### Event Source

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | yes | |
| isbn | string | no | |
| whereInSource | string | no | Location within the source (page, chapter, etc.) |
| authors | array | no | Array of `{ authorName }` |
| publicationTime | object | no | Same structure as eventTime |

### Event Types (Design Intent)

Two categories of events are envisioned:
- **RecordsCreated**: The event IS the creation of a source document. Requires no external source.
- **EverythingElse**: Requires at least one source linking to a RecordsCreated event.

`EditEventType.jsx` exists with a checkbox for this, but the full workflow (requiring sources, inline source creation) is not yet built.

### Revision Tracking

Current approach: **full snapshot per revision**. Each edit appends a complete new event object with `revision + 1`. The frontend filters to show only the latest revision per `eventId`.

For the backend (future):
- **Temporal tables** (SQL Server built-in) are the recommended approach — automatic row history with zero app code
- The existing backend model already has a `Revision` field on `Event`

---

## Frontend Architecture

### State Management (Redux Toolkit)

| Slice | Reducer Name | Purpose |
|-------|-------------|---------|
| `stateSliceEvent` | `eventReducer` | All events collection + selected event tracking |
| `stateSliceSelectedEvent` | `selectedEventReducer` | Full data of the currently selected event (feeds Display components) |
| `stateSliceEditEvent` | `editEventReducer` | Event data being edited (feeds Edit components) |
| `stateSliceEditSources` | `editSourcesReducer` | Source editing state (keyed by UUID) |
| `stateSliceEditSourceAuthors` | `editSourceAuthorsReducer` | Author editing state |
| `stateSliceMouseInfo` | `mouseInfoReducer` | Mouse position, raycasting intersections, hover states |

Key design: Edit and Display use **separate Redux slices**. Editing copies data from the selected event into the edit slice. On submit, a new revision is appended to `allEvents`.

### Display vs Edit Mode

`DetailsMain.jsx` switches between:
- **`DisplayEvent`**: Read-only view of the selected event, with an "Edit" button
- **`EditEvent`**: Full edit interface with sub-components for each field group

The app starts in display mode (`editModeOn: false`). Entering edit mode copies the selected event into the edit slices. Canceling discards changes. Submitting creates a new revision.

**Confirmation guard**: If the user selects a different event while editing, a confirmation dialog asks whether to discard unsaved changes.

**Change detection**: Submit is disabled when the edit state matches the original event (deep comparison).

### Component Organization

```
DetailsSection/
  DetailsMain.jsx           — Mode switch (Display vs Edit)
  Display/
    DisplayEvent.jsx        — Container for all display sub-components
    DisplayEventHeader.jsx  — Title + tags (read-only)
    DisplayEventType.jsx    — "Is creation of source" indicator
    DisplayEventImage.jsx   — Event image
    DisplayEventTime.jsx    — Formatted time range
    DisplayEventRegion.jsx  — Location coordinates
    DisplayEventSummary.jsx — Summary text
    DisplayEventSources.jsx — Sources list container
    DisplayEventSource.jsx  — Individual source
    DisplaySourceAuthor.jsx
    DisplaySourcePublicationTimeRange.jsx
  Edit/
    EditEvent.jsx           — Container + Submit/Cancel
    EditEventHeader.jsx     — Title + tags editing
    EditEventType.jsx       — Source creation checkbox
    EditEventImage.jsx      — Image upload
    EditEventTime.jsx       — Time range inputs with validation
    EditEventRegion.jsx     — Region boundary management
    EditEventSummary.jsx    — Summary textarea
    EditEventSources.jsx    — Sources list management
    EditSource.jsx          — Individual source editing
    EditSourceAuthor.jsx
    EditSourcePublicationTimeRange.jsx
    detailRestrictions.jsx  — Validation rules
  convertTimeRangeToString.jsx — Time formatting utilities
  RoundFloat.jsx
```

### 3D Globe (GlobeSection/)

The Three.js scene hierarchy:

```
GlobeSectionMain          — Canvas, camera (PerspectiveCamera), OrbitControls, mouse events
  Scene                   — Frame-by-frame raycasting, mesh management
    Globe                 — Earth sphere with custom GLSL shaders (vertex + fragment in src/assets/shaders/)
    Stars                 — Background star field
    EditableRegion        — Edit-mode pins + region mesh (only rendered when editing)
      EditPinMesh         — Draggable pin with bounding box, connected to editState + mouseState
      EditRegionMesh      — Region mesh from edit state boundary pins
    DisplayOnlyRegion     — Display-mode pins + region mesh (one per search result, props-driven)
      DisplayPinMesh      — Static pin, no interaction, no Redux
      DisplayRegionMesh   — Static region mesh from props
```

**Key design decisions:**

- **Separate Edit and Display pin/region components**: Originally attempted a single component, but edit pins need bounding boxes, drag handling, and Redux integration while display pins are static and props-driven. Splitting avoids conditional complexity.

- **Extracted geometry utilities**: `regionMeshGeometry.js` contains `EarClipping`, `MeshSubdivider`, `rescaleToSphere`, and `generateRegionMesh` — pure geometry functions shared by both `EditRegionMesh` and `DisplayRegionMesh`.

- **Pin sizing**: Display pins are ~0.25x the scale of edit pins (defined in `constValues.jsx` as `displayPinMeshInfo` vs `pinMeshInfo`).

- **Mesh names and group names**: Centralized in `constValues.jsx` for raycaster identification.

### Pin Movement (Click-and-Drag)

Pins cannot be moved by simply rotating their quaternion (the pin was created at the origin, translated to the surface, then rotated — so quaternion rotation just spins it in place). Instead:

1. Calculate vector from earth origin to pin position
2. Apply a quaternion rotor derived from cursor movement over the globe surface
3. Apply a second quaternion rotor compensating for the offset between the raycaster's globe intersection and the bounding box intersection
4. Set the pin mesh position to the rotated vector

For **region boundary pins**, movement increments a counter (`regionBoundaryPinHasMoved`) that triggers region mesh regeneration without recreating pin meshes.

For **whole region movement**, the region mesh vertices are recalculated from the moved boundary pins rather than transformed — because the geometry is calculated via spherical math, transforms would double-apply.

### Coordinate System Notes

- Globe lat/long to XYZ: `convertLatLongXYZ.jsx`
- Mouse coordinates: normalized to [-1, +1] screen space for the raycaster
- Y-axis is inverted between React canvas events and Three.js/OpenGL

### Search Flow

1. User clicks Search button
2. `SearchSectionMain` fetches `events.json` via TanStack React Query
3. Results are filtered to latest revisions per `eventId` (`getLatestRevisions.jsx`)
4. All events render as `DisplayOnlyRegion` components on the globe
5. Clicking a search result or globe region selects the event, populating Display components

---

## Backend Architecture (WebAPI/)

### API Endpoints

Controller: `HistoricalEventController` at `api/HistoricalEvent/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GetLatestRevision/{eventId}` | GET | Latest revision of an event |
| `GetAllRevisions/{eventId}` | GET | Full revision history |
| `GetSpecificRevision/{eventId}/{revision}` | GET | Specific revision |
| `GetFirst100` | GET | First 100 events |
| `GetEventOfTheDay` | GET | Random/featured event |
| `Create` | POST | New event |
| `Update` | PUT | Update (new revision) |
| `Delete/{eventId}` | DELETE | Delete event |

### Data Model (Entity Framework)

`Event` entity with eager-loaded related entities: Tags, EventImage, SpecificLocation (EventLocation), Region (array of EventLocation), Sources (with Authors).

The backend model has `Id` (database PK), `EventId` (shared across revisions), `Revision`, plus all the event fields. Time fields are flattened onto the entity (LB/UB Year/Month/Day/Hour/Min).

### Infrastructure

**Production (Azure):**
- **Frontend**: Azure Static Web Apps (Free tier) — `main` branch → production URL, `test` branch → testing preview URL; CI/CD via GitHub Actions (auto-generated workflow)
- **Backend**: Two App Services on a single B1 plan — `historyprojectapi` (production, Always On) and `historyprojectapi-testing` (test branch); deployed via GitHub Actions publish profile
- **Database**: Azure SQL Basic, shared between both environments
- **Auth**: Managed Identity per App Service → Azure SQL (no passwords or connection string secrets in config)

**Local development:**
- SQL Server Express with connection string in `appsettings.Development.json` (gitignored), read as `ConnectionStrings:LocalDb` in Development mode

**Both environments:**
- CORS enabled for frontend cross-origin requests
- Swagger UI available in development mode
- Backend targets **.NET 10** (migrated from .NET 8)

Detailed setup notes are archived in `claudePlans/2.GettingStartedSetup.txt`.

---

## Design Decisions Log

### "POI" to "Event" Rename (2026-02)
The domain term "event" replaced the UI term "POI" (Point of Interest) throughout the codebase. Users think about historical events, not abstract points of interest. All state slices, components, and variables were renamed.

### Separate Edit and Display Components (2026-02)
Rather than toggling visibility/editability within single components, the project uses dedicated `Edit*` and `Display*` component trees. This keeps each component simple and avoids conditional complexity. The naming convention:
- `Display*` — read-only, fed by `selectedEventReducer`
- `Edit*` — editable, fed by `editEventReducer`

### Full Snapshot Revisions (2026-03)
Each edit creates a complete new event object rather than storing diffs. This is simple to implement, easy to reason about, and sufficient for the current scale. The backend can use SQL Server temporal tables later for more efficient storage.

### Edit State as Separate Redux Slices (ongoing)
Edit state is split across `stateSliceEditEvent`, `stateSliceEditSources`, and `stateSliceEditSourceAuthors` because the reducer functions grew extensive. This works but creates complexity in the submit handler, which must gather state from multiple slices. See TODO.md for planned refactoring.

### Display Pins as Props-Driven Components (2026-02)
Display pins and regions receive all data via props, with no Redux connection. This makes them lightweight and allows rendering many of them (one per search result) without performance concerns from Redux subscriptions.

### Azure Hosting Architecture (2026-04)
Frontend on Azure Static Web Apps (Free), backend on two App Services sharing one B1 plan (production + test), single Azure SQL Basic database shared between environments. Managed Identity handles DB auth — no stored credentials. CI/CD via GitHub Actions: frontend workflow auto-generated by Static Web Apps, backend workflow uses publish profiles. Two separate App Services chosen over deployment slots because slots require Standard tier (~$70/mo).

### .NET 10 Migration (2026-04)
The backend was retargeted from .NET 8 to .NET 10. The development machine only has the .NET 10 SDK installed, making .NET 8 non-functional locally. No API or EF Core changes were required — the migration was a `<TargetFramework>` change in the project file only.

### Reactive UI Principle — No JSX in State, No Imperative DOM (2026-04)
Established during the SearchSectionMain refactor. The rule: components read from Redux and render — no JSX elements stored in `useState`, no `document.getElementById` to set styles imperatively, no refs used to paper over stale closures.

Storing JSX in state freezes closures at creation time, causing stale reads of Redux values (the original `allEventsRef` workaround was a symptom). The fix: store only data (IDs, queries) in state and derive JSX during each render cycle. Selection highlighting is expressed as `eventId === selectedEvent?.eventId` inline, not via imperative className assignment.

This principle applies project-wide. `EditEventRegion` was also corrected during the same refactor.

---

## Validation Rules

### EditEventHeader
- Title is required
- At least one tag is required
- Border changes color: red (with error) / green (valid)
- Slightly rounded borders and input styling

### EditEventTime
- Year is required for both earliest and latest
- Year, month, day must be valid numbers if provided
- Same red/green border behavior as header

---

## Styling Conventions

- **Tailwind CSS** for all styling
- **Display components**: No borders, `text-white` for primary text, `text-gray-400` for labels, `m-1` spacing, "NA" for missing values
- **Edit components**: Bordered sections with validation-based border colors (red = error, green = valid), rounded corners
- Dark theme throughout (the globe section dictates a dark background)
