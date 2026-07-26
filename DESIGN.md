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

The frontend is the primary development focus. The backend is wired up and serving as the primary data source. Redux holds session/edit state.

### Frontend Layout (App.jsx)

Four main sections, matching the UI mockup:

| Section | Component | Purpose |
|---------|-----------|---------|
| Left | `SearchSection/SearchSectionMain` | Search interface, results list |
| Center | `GlobeSection/GlobeSectionMain` | 3D globe with pins, regions, raycasting |
| Right | `DetailsSection/DetailsMain` | Event details — switches between Display and Edit modes; Display mode includes a revision browsing table |
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

An **"Exact date" checkbox** (in both the event time and source publication editors) toggles a single-date entry. It has no dedicated column: while checked, the editor mirrors the earliest bound into the latest bound (`EditEventTime.jsx` / `EditSourcePublicationTimeRange.jsx`), so an exact date persists as `earliest == latest` (which `convertTimeRangeToString.jsx` renders as a single plain date rather than a range). On load, an event/source whose bounds are equal (with a year present) opens in exact mode; a blank new event opens in range mode. Required fields are unchanged — year only, with unknown month/day, still submits in either mode. See `isExactDate` in `detailRestrictions.jsx`.

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
- **`DisplayEvent`**: Read-only view of the selected event, with an "Edit" button. Shows the latest revision by default. Prior revisions are accessible via a clickable table of entries — selecting one updates both the details panel and the globe to reflect that revision. (A visual "stack of cards" redesign is a planned future enhancement.)
- **`EditEvent`**: Full edit interface with sub-components for each field group

The app starts in display mode (`editModeOn: false`). Entering edit mode copies the selected event into the edit slices. Canceling discards changes. Submitting creates a new revision.

**Confirmation guard**: If the user selects a different event while editing, a confirmation dialog asks whether to discard unsaved changes.

**Change detection**: Submit is disabled when the edit state matches the original event (deep comparison).

**Deselection**: Clicking an already-selected search result or globe region again deselects the event — the details section returns to "no event selected".

**Edit mode globe behavior**: While editing, all other events' display regions and pins render in gray and are non-interactive (hover suppressed, clicks blocked). The event being edited shows its display region as a blue ghost for visual reference. Clicking on other regions or search results during edit triggers the confirmation guard rather than switching events.

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
    DisplayRegion         — Display-mode pins + region mesh (one per search result, props-driven); supports hover detection and click-to-select via raycaster
      DisplayPinMesh      — Static pin, hover highlight, no Redux
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

**Per-frame rotor sharing (drag perf, 2026-06).** During a drag the per-frame rotor does **not** flow through Redux — it lives on a module-level mutable `THREE.Quaternion` in `GlobeSection/sharedDragRotor.js`. `MouseHandler.useFrame` writes it each RAF; `EditPinMesh.useFrame` and `EditRegionMesh.useFrame` read it within the same RAF. Routing the rotor through `dispatch` + `useSelector`/`useEffect` left consumers reading the previous render's value (and `EditPinMesh`'s `useEffect` fired after R3F had already painted), so the rendered mesh trailed the cursor by 1–2 frames — imperceptible at 60 Hz, painful on a slow VM. Correctness depends on R3F running `useFrame` callbacks in mount order: `MouseHandler` is mounted before `EditableRegion` in `Scene.jsx`, so the write happens before the reads. Redux's `editState.clickAndDrag` still carries the "drag active" flag, mesh identity, and `initialOffsetQuaternion`; only the per-frame rotor value moved out.

**Live single-pin polygon tracking (drag perf, 2026-06).** `EditRegionMesh.useFrame` handles two drag kinds. *Whole-region* drag rigidly rotates the cached triangulation in place (no re-triangulation). *Single boundary-pin* drag genuinely reshapes the polygon, so it rebuilds the fill each frame: it reconstructs the live boundary (the drag-start `regionBoundaries`, frozen by the rotor-sharing scheme above, with only the dragged marker — matched by its UUID `id` against `clickAndDrag.mesh.userData.locationId` — rotated by the shared rotor) and re-runs `generateRegionMesh` into the Step-1 pre-allocated buffers via a shared `writeRegionMesh` helper (also used by the `regionBoundaries` commit path). The wireframe stays hidden during drag; winding validation runs live, so Submit is gated mid-drag. Per-frame ear-clipping + subdivision is cheap for the default ~8-pin region; a much larger region would warrant throttling this branch.

### Coordinate System Notes

- Globe lat/long to XYZ: `convertLatLongXYZ.jsx`
- Mouse coordinates: normalized to [-1, +1] screen space for the raycaster
- Y-axis is inverted between React canvas events and Three.js/OpenGL

### Search Flow

1. User clicks Search button
2. `SearchSectionMain` fetches from the backend API (`GetFirst100` / search endpoint) via TanStack React Query
3. Results are filtered to latest revisions per `eventId` (`getLatestRevisions.jsx`)
4. All events render as `DisplayRegion` components on the globe
5. Clicking a search result or globe region selects the event, populating Display components; clicking the already-selected event deselects it

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
| `Delete/{eventId}` | DELETE | Hard-delete whole event (all revisions + children); dev/test only |

### Data Model (Entity Framework)

`Event` entity with eager-loaded related entities: Tags, EventImage, SpecificLocation (EventLocation), Region (array of EventLocation), Sources (with Authors).

The backend model has `Id` (database PK), `EventId` (shared across revisions), `Revision`, plus all the event fields. Time fields are flattened onto the entity (LB/UB Year/Month/Day/Hour/Min).

### Infrastructure

**Production (Azure):**
- **Frontend**: Two Azure Static Web Apps (Free tier) — `historyprojectswa` (`main` branch) and `historyprojectswa-testing` (`test` branch); each has its own URL and API token; CI/CD via manually maintained GitHub Actions workflows
- **Backend**: Two App Services on a single B1 plan — `historyprojectapi` (production, Always On) and `historyprojectapi-testing` (test branch); deployed via GitHub Actions using Azure OIDC (Workload Identity Federation — no secrets to rotate)
- **Database**: Two Azure SQL Basic databases on one logical SQL server — `HistoryProjectDb` (prod) and `HistoryProjectDb-Test` (test). Test auto-migrates on app startup (gated by `IsTesting()`); prod is migrated manually via `dotnet ef migrations script` to keep schema changes deliberate.
- **Auth**: Managed Identity per App Service → Azure SQL (no passwords or connection string secrets in config). Connection strings use `Authentication=Active Directory Managed Identity` to go straight to IMDS rather than probing the full DefaultAzureCredential chain.

**Local development:**
- SQL Server Express with connection string in `appsettings.Development.json` (gitignored), read as `ConnectionStrings:LocalDb` in Development mode

**Both environments:**
- CORS enabled for frontend cross-origin requests
- Swagger UI available in development mode
- Backend targets **.NET 10** (migrated from .NET 8)

Detailed setup notes are archived in `claudePlans/2.GettingStartedSetup.txt`.

---

## Testing

Two frontend layers: **Vitest** unit tests (pure logic) and **Playwright** UI E2E.

**Unit (Vitest)** — `npm run test` from `npmfrontend/`. Tests live next to source as `src/**/*.test.{js,jsx}` (scoped via `vitest.config.js`; the `tests/` Playwright specs are excluded). Covers pure logic — currently the image helpers (`api/imageDataUrl.test.js`: magic-byte validation/sniffing incl. the disguised-file reject, size cap, data-URL round trip) and the event mapper contract (`api/eventMapper.test.js`: image bytes + `EventIsCreationOfSource` survive both directions). The image-validation tests load the real `tests/fixtures/images/` files so they run against genuine bytes.

**E2E (Playwright)**, TypeScript in `npmfrontend/tests/`. Run `npm run test:e2e` from `npmfrontend/`. Playwright boots the Vite dev server itself (`playwright.config.ts`, port 5173); no backend or DB required.

**Layer:** *UI* E2E — real browser, real React/Redux/Three.js — with the backend API stubbed at the network layer via `page.route`, served from `tests/fixtures/events.json`. Deterministic and Azure-independent, but does **not** verify the frontend↔backend contract (a true full-stack layer is a planned follow-up — see TODO.md "Full-stack testing").

**Scenarios covered** (reproduce/extend here):
- `smoke.spec.ts` (no mocking) — page loads with the expected `<title>`; the Three.js `<canvas>` is visible.
- `search.spec.ts` (mocks `GET **/api/HistoricalEvent/GetFirst100` in `beforeEach`) — search form visible on load; clicking Search renders result items; empty search still loads results without crashing; a result shows the fixture title; clicking a result populates the details panel.
- `image-upload.spec.ts` (mocks `GetFirst100`, and `POST Create` for the submit case) — backend `EventImage.ImageBinary` is rebuilt into a `data:image/png` URL on display; a valid PNG/JPEG upload previews with no error; a real SVG and HTML-disguised-as-`.png` are rejected with an inline error; submitting a valid image posts non-empty `ImageBinary` (stripped base64) and preserves `EventIsCreationOfSource`. Extra `data-testid`s: `edit-event-button`, `image-upload-input`, `edit-image-preview`, `image-upload-error`, `submit-event-button`, `display-event-image`.
- `exact-date.spec.ts` (mocks `GetFirst100` per-test with tailored events; `POST Create` for the submit case) — event time opens in range mode when `begin != end` and exact mode when `begin == end`; display renders the exact date plainly (no "(exact)" suffix); checking "Exact date" and entering a year-only date posts `LB == UB` with null month/day (proves the begin==end proxy *and* that partial dates still submit); the source publication editor opens exact when `begin == end`. Extra `data-testid`s: `event-exact-date-checkbox`, `event-latest-subsection`, `source-exact-date-checkbox`, `source-latest-subsection`.
- `revision-history.spec.ts` (mocks `GetFirst100` + `GetAllRevisions/**`) — selecting an event renders the revision history as a 2-column table: `Rev N — author` on the left and the UTC submittal time (`formatRevisionDate`, e.g. `2026-06-28 14:30 UTC`) on the right. `data-testid`s: `revision-row`, `revision-date`.
- `edit-submit-selection.spec.ts` (mocks `GetFirst100`, `GetAllRevisions`, and `POST Create`) — a successful submit shows the pending overlay (`submit-overlay`) while a delayed Create is in flight, then closes the panel and makes the event the active selection (details panel shows the new title, `display-event-image` visible, `search-result-item` highlighted); a failed Create (500) keeps the edit panel open with an inline `submit-error` (containing the backend reason), clears the overlay, and commits nothing (search list still 1 — no phantom). (New-event creation needs a globe raycast to place the pin and is not headlessly drivable — covered by manual verification + the `selectEvent` unit test.)

**Fixture constraints** (a fixture that violates these silently breaks tests): backend **PascalCase** shape that `eventMapper.backendToFrontend` reads (`EventId`, `Title`, `SpecificLocation.Latitude`, `Region` as a flat array of `{Latitude, Longitude, OrderIndex}`); `SpecificLocation` non-null (selection dereferences it); region boundary wound **counterclockwise** (clockwise makes `EarClipping` throw). As of the region error boundary (2026-06) a clockwise region no longer blanks the whole UI — it is caught per-region and skipped — but valid fixtures should still be CCW so the region actually renders. `region-error-boundary.spec.ts` deliberately feeds a clockwise region (`fixtures/events-with-bad-region.json`) to assert the boundary contains the crash. UI selectors are `data-testid`: `search-input`, `search-button`, `search-result-item`, `details-event-title`.

**CI:** `.github/workflows/playwright.yml` — runs on push/PR to `main` and `test`, path-scoped to `npmfrontend/**`.

### Backend tests (two layers)

The frontend suites above mock the API, so they deliberately don't verify the frontend↔backend contract. Two backend layers cover that gap.

**Layer 1 — per-push deterministic** (`WebAPI/UnitTesting`, MSTest). No Azure/SQL: controller tests run over EF Core **InMemory**. `CreateImageValidationTests` asserts `Create` returns 200 for a valid PNG/JPEG/no-image and 422 for oversized / non-image (disguised) bytes. `ReadEndpointContractTests` asserts `GetFirst100` returns latest-only per `EventId` and eager-loads the related entities (queried via a fresh context so a missing `.Include` would surface). `JsonContractTests` reproduces the `Program.cs` Newtonsoft settings (`ReferenceLoopHandling.Ignore` + `DefaultContractResolver`) and asserts the PascalCase key/shape contract `backendToFrontend` reads — the casing-drift guard. Run: `dotnet test WebAPI/UnitTesting/UnitTesting.csproj`. CI: `.github/workflows/dotnet-tests.yml` (push/PR to `main`/`test`, paths `WebAPI/**`).

**Layer 2 — nightly/manual live-DB** (`WebAPI/LiveE2ETests`, MSTest + `HttpClient` against the deployed test App Service). Verifies the real live JSON contract and genuine long-term persistence/edits. **Data lifecycle — namespaced, capped, never wipe:** all test data lives under a reserved `__e2e__` tag; a small set of **permanent** `Test Event N E2E` events (fixed `EventId`s) is seeded idempotently (create-if-absent), read/contract tests run against them, and edit tests **append a new revision** (history grows, event count stays capped). `ClassInitialize` sweeps **orphans** (any `__e2e__`-tagged event not in the permanent set) — cleanup is namespace-scoped only, so the DB is never wiped and real data is never touched. Gated on the `E2E_API_BASE_URL` env var (repo variable; e.g. the test App Service URL); when unset the tests **skip** (`Assert.Inconclusive`), so they're no-ops per-push and locally. CI: `.github/workflows/live-e2e.yml` (nightly cron + `workflow_dispatch`; warms the App Service first for cold-start tolerance).

---

## Design Decisions Log

### Event Delete: Whole-Event Hard Delete, Gated to Non-Prod (2026-07)
`Delete/{eventId}` hard-deletes the **entire** event — every revision of the `EventId` plus its owned children (Region locations, specific location, image, sources, source authors) — via load-graph + `RemoveRange` (no schema/cascade migration). It previously loaded one row without includes and `Remove`d it, which both (a) **500'd** on the real DB (Region/Source rows carry `NO ACTION` FKs to the Event, so removing the Event alone violates them) and (b) only removed a **single revision**. There is **no user-facing delete** — the app is append-only (editing always appends a revision) — so this endpoint is backend-only test/admin cleanup; the live-E2E orphan cleanup is its only caller. Until an account/permission system exists it is **gated to dev/test** (`IsDevelopment() || IsTesting()`); prod returns 403. Tags are shared via the `EventTag` many-to-many join, so their join rows drop by DB cascade but the `Tag` entities are left for other events. Soft-delete was considered and rejected: the append-only UI already guarantees history persistence, and soft-delete wouldn't free the test-DB rows this endpoint exists to clean.

### Event Image Persistence (2026-06)
Event images persist as **raw bytes** in `EventImage.ImageBinary` (`varbinary(max)`); no re-encoding and no stored MIME type. The frontend captures an upload as a base64 data URL; `eventMapper.frontendToBackend` strips the `data:...;base64,` prefix and sends the bare base64 body, which Newtonsoft deserializes to `byte[]`. On read, `backendToFrontend` rebuilds the data URL and derives the MIME by **sniffing the leading magic bytes** (PNG `89 50 4E 47`, JPEG `FF D8 FF`) rather than carrying a label. Uploads are validated by **magic-byte signature + a 5 MB size cap** on the client (`api/imageDataUrl.js`) *and* re-validated server-side in `HistoricalEventController.Create` (→ 422) — validation, not the MIME label, is what prevents arbitrary bytes from being stored; the `MAX_IMAGE_BYTES` constant is mirrored in both. Images are rendered via `<img src={dataUrl}>`, which runs untrusted SVG without executing script — but SVG is rejected at upload anyway (only PNG/JPEG pass). Known follow-up: `GetFirst100` eager-loads images, so the search payload carries every result's bytes — a lazy-load-on-selection optimization is tracked in TODO.md. The `Event.EventIsCreationOfSource` flag (already wired through the frontend) is now a persisted backend column as part of the same work.

### Confirm-Before-Commit Submit (2026-06)
`EditEvent.onSubmitClick` awaits the backend `createEvent` **before** mutating local state. While the request is in flight the edit panel stays open under a semi-transparent scrim with an orbiting comet ("Submitting...", Tailwind `animate-spin` on a glowing dot — no library/CSS-config change) and the buttons are disabled. On **failure** it drops the scrim, stays in edit mode, and shows the backend's reason inline (`createEvent` now includes the response body in its thrown error, so a 422 like "Image exceeds 5MB limit." is shown) so the user can fix and retry. This replaces the earlier *optimistic* flow (append/select/exit first, then fire-and-`console.error`), which left a **phantom** event/revision in `allEvents` on any rejection (422/500/network) until reload — newly reachable once server-side image validation could 422.

On **success** it does an authoritative confirm-and-refresh rather than trusting the locally-built event: it re-fetches `GetAllRevisions(eventId)`, updates **only that event** in place in `allEvents` (`upsertEventRevisions` — drop the old entries for that `eventId`, append the fresh set; other events untouched), seeds RevisionStack's query cache from the same fetch (`queryClient.setQueryData(["revisions", eventId], fresh)`) so the revision-history list is correct the instant the panel opens (no separate invalidate-driven refetch lag), selects the latest fresh revision, then exits edit mode. The scrim stays up across both round-trips (Create, then the re-fetch). If the re-fetch fails after a *successful* Create, it falls back to the optimistic append + `invalidateQueries` so the submit isn't lost. Clicking a revision in RevisionStack loads that revision into the display panel and moves the highlight (via `selectEvent`; current row keyed on `selectedEventReducer.revision`).

### Submit Selects the Event; Shared `selectEvent` Helper (2026-06)
On a successful submit, `EditEvent.onSubmitClick` makes the just-submitted event the active selection (`AppState/selectEvent.js`: `setSelectedEvent` + `selectedEventStateActions.load` with lat/long→sphere-point conversion). Previously selection was left to a re-sync `useEffect` in `SearchSectionMain` that only re-points an *already-selected* event — so a brand-new event (never `setSelectedEvent`'d, placed via the globe) was appended to `allEvents` but never selected, leaving the details panel blank/stale. (Originally this ran independent of the network as part of an optimistic append; it now runs in the success branch of the confirm-before-commit flow above.) The convert+select block was duplicated in three places (`SearchSectionMain.onEventClicked`, its re-sync effect, `RevisionStack.onRevisionClick`); all now route through the shared `selectEvent` helper so they can't drift.

### Exact Date via begin==end Proxy (2026-06)
The "Exact date" mode (event time and source publication) stores a single point in time as `earliest == latest` rather than adding a boolean column. This is unambiguous — a range whose bounds are equal *is* a single point — and lossless: such an event reloads into exact-mode UI, and unchecking the box reveals both (equal) bounds to widen. The editors keep the bounds equal by mirroring earliest→latest in Redux on every keystroke while exact mode is on, so the existing mapper/backend persist `LB == UB` with no changes (no migration). Equal bounds display as a single plain date (an earlier "(exact)" suffix was dropped per user preference — the date is shown as provided). Considered and rejected: a dedicated boolean column (extra schema + migration for information already derivable from the bounds).

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
Frontend on two Azure Static Web Apps (Free) — one per branch (`main`/`test`), each with its own URL and SWA API token. Backend on two App Services sharing one B1 plan (production + test), originally with a single Azure SQL Basic database shared between environments (split into separate prod/test DBs in 2026-05 — see "Test Database Split (2026-05)" below). Managed Identity handles DB auth — no stored credentials. CI/CD via GitHub Actions: frontend workflows are manually maintained (split per SWA), backend workflow uses Azure OIDC (Workload Identity Federation) so basic auth stays disabled and no secrets need rotation. Two separate App Services chosen over deployment slots because slots require Standard tier (~$70/mo).

### Test Database Split (2026-05)
Test and prod environments now have separate Azure SQL Basic databases (`HistoryProjectDb` and `HistoryProjectDb-Test`) on the same logical SQL server. Previously the test App Service shared the prod DB, which meant any Create/Update operation from test would write into prod data.

Auto-migration is gated to `Development` and `Testing` environments only via the `IsTesting()` extension in `HostEnvironmentExtensions.cs`; prod schema changes are run manually via `dotnet ef migrations script` against the live DB to keep them deliberate. The test App Service runs with `ASPNETCORE_ENVIRONMENT=Testing` and `AzureSql:Database=HistoryProjectDb-Test`.

### Cold-start Reliability (2026-05)
Two changes guard against cold-start behavior on the B1 App Service plan:

1. `EnableRetryOnFailure(maxRetryCount: 6, maxRetryDelay: 30s)` on the `DbContext` (Program.cs). The first SQL login after a container cold start frequently fails with a transient `TdsParser` "Connection reset by peer" — common during the MI auth handshake. EF Core's retry strategy retries transparently with exponential backoff, masking the failure from the user.

2. `DbWarmupService` — an `IHostedService` registered in `Program.cs` that opens a `SELECT 1` during `StartAsync`. Because `IHostedService.StartAsync` runs before Kestrel begins accepting requests, the MI token fetch + TLS + TDS handshake costs are paid during boot rather than on the first user request. Warmup failures are swallowed and logged as warnings — the first user request will still benefit from `EnableRetryOnFailure`.

Together: the first request after a deploy or container recycle should succeed instead of erroring. The B1 cold-boot stall itself (cert rehash, container respawn) is unchanged — that's a plan-tier property and outside the scope of these app-level mitigations.

### SQL Authentication via Active Directory Managed Identity (2026-05)
The connection string switched from `Authentication=Active Directory Default` to `Authentication=Active Directory Managed Identity`. The "Default" credential chain probes multiple sources (env vars, Azure CLI, MI, etc.) and was producing intermittent token-acquisition failures on App Service; "Managed Identity" goes straight to IMDS and is more reliable.

### New Event Creation Workflow (2026-05)
Brand-new events are created via a three-stage workflow when nothing is selected:

1. **Idle.** `DetailsMain.jsx` shows "No event selected" plus a "Create New Event" button.
2. **Awaiting placement.** Clicking the button dispatches `prepareNewEvent`, which sets a `newEventAwaitingPlacement` flag in `stateSliceEditEvent`. The details panel swaps to a disabled "Click on globe" button and a Cancel button. Edit mode is NOT yet on. Display-mesh and search-result clicks are ignored in this state — explicit Cancel (`endEditMode`, which resets to `initialState`) is the only exit.
3. **Globe click → edit mode.** `MouseHandler.jsx` detects `newEventAwaitingPlacement && clickedGlobe` and dispatches a single combined action `startNewEvent(spherePoint)` that atomically sets `editModeOn: true`, generates a fresh `eventId` via `uuid()`, sets `primaryLoc`, clears the awaiting flag, and stores an empty `originalEvent` snapshot. The empty snapshot is required because `EditEvent.hasChanges` returns false when `originalEvent` is null, which would leave Submit permanently disabled for a new event. `EditableRegion` then auto-creates the default 8-pin ring from `primaryLoc?.id` changing.

Two existing patterns extended at the same time: empty-globe-click (no display mesh, not editing, not awaiting) now deselects the current event by dispatching `setSelectedEvent(null)` + `selectedEventStateActions.clear()` (mirroring the search-result re-click pattern in `SearchSectionMain.jsx`). `EditEvent.onSubmitClick` was hardened to optional-chain `allEvents.forEach` because `allEvents` is null until the user has run Search at least once.

Also during this work: `EventSource.Where` was flipped from `[Required, MaxLength(128)]` to nullable `string?` because the frontend has no UI for it and the data-model comment in `stateSliceEditEvent.jsx` documents it as optional ("Chapter 3, paragraph 28"). EF migration `MakeEventSourceWhereNullable` (2026-05-23) makes the column nullable. Test auto-migrates on app startup; prod will need a manual `dotnet ef migrations script` run before its next deploy.

### .NET 10 Migration (2026-04)
The backend was retargeted from .NET 8 to .NET 10. The development machine only has the .NET 10 SDK installed, making .NET 8 non-functional locally. No API or EF Core changes were required — the migration was a `<TargetFramework>` change in the project file only.

### Display Region Interaction (2026-04)
Display regions (`DisplayRegion`) support hover detection and click-to-select via the Three.js raycaster. Only the topmost intersected mesh is acted on — other event regions may be behind the cursor in the ray path. In edit mode, display regions are non-interactive (dimmed gray); the event being edited shows its display region as a blue ghost for spatial reference. Clicking an already-selected event deselects it. These behaviors are centralized in `MouseHandler.jsx` using `mesh.userData.eventId` for event identification.

### Region Winding Validation & Last-Valid Edit Mesh (2026-06)
`EarClipping` requires the boundary wound counterclockwise as seen from outside the globe; a clockwise (or otherwise untriangulatable) boundary throws. Rather than let the edit mesh disappear (the error-boundary fallback) when a user twists pins into an invalid shape, the editor now keeps the **last valid** mesh on screen and recolors it **red** until the boundary is valid again, then restores **blue**. Mechanism: `regionWindingSign` / `isRegionWindingValid` (`regionMeshGeometry.js`) — an origin-relative spherical "vector-area" test (sum of edge cross products dotted with the outward radial) that matches `EarClipping#isEar`'s convention. In `EditRegionMesh`'s regen `useLayoutEffect`, validity = winding-CCW **and** `generateRegionMesh` succeeds (wrapped in try/catch as a backstop). On invalid, the pre-allocated buffers (see buffer entry below) are simply **not** overwritten — so the last valid geometry stays on the GPU for free — and the material flips to `editRegionMeshInfo.errorColor`; on valid, buffers are rebuilt and the color returns to `validColor`. Because the throw is now handled locally, the edit-path error boundary stops tripping for ordinary bad windings (it stays as a last-resort net). Color updates on pin **release** (boundary commit); live mid-drag recoloring waits on the deferred single-pin live-tracking refactor. Oracle test `region-winding.spec.ts` locks the classifier's sign to EarClipping's actual accept/reject. **Submit gating (2026-06 follow-up):** the gate no longer recomputes winding in `EditEvent`. `EditRegionMesh` already triangulates to build the mesh and knows valid-vs-red, so it **publishes** that result to a `regionValid` flag in `stateSliceEditEvent` (a small `setRegionValid` reducer; dispatched ref-guarded, only on a true↔false transition) and `EditEvent.hasRegionError` simply reads it. This (a) avoids triangulating twice — important ahead of the planned per-frame single-pin regen — and (b) closes a real gap: the winding classifier sums the sign over the **whole** boundary, so a *local* single-pin twist can keep global winding positive (classifier passes) while EarClipping still throws "Iterated all points twice"; the old winding-only gate left Submit enabled for that case, persisting a region whose display mesh can't render. `regionValid` defaults `true` and resets on every edit-mode enter/leave (all entry actions spread `...initialState`). The oracle test adds a "local twist" fixture (winding-valid yet throws) to lock that triangulation-success — not winding — is the correct signal. **Still not covered (out of scope by decision):** true edge-crossing self-intersection that triangulates *silently wrong* without throwing (no crash, CCW, gate passes); catching those would need a separate O(n²) segment test, deliberately deferred — "just catch the crashes."

**Gating correctness fixes (2026-07):** Three related gate bugs (2026-06 code review) were closed, all in `EditRegionMesh.writeRegionMesh`. (1) The winding **pre-gate** was removed — triangulation success, now inseparable from the buffer-capacity check, is the *sole* validity signal, matching read-only `DisplayRegionMesh`. `regionWindingSign` sums **un-normalized** vertex vectors for its centroid, so over a large/pole-spanning extent the sign can flip even for a boundary `EarClipping` accepts (concrete: a 40°S–40°N × 120°W–120°E CCW square signs `−693` yet triangulates fine), which previously *falsely* red-flagged and blocked Submit on a valid region. `regionWindingSign` / `isRegionWindingValid` stay exported as the oracle-test classifier and reserved for the planned backend winding-normalize. (2) Buffer **over-capacity** is folded into the validity decision — a small `buildRegionBuffers` helper returns null on *either* a triangulation throw *or* an over-budget result — so an over-capacity region blocks Submit, instead of the old order that published `regionValid=true` and the valid color *before* the capacity check returned (enabling Submit over a stale/blank fill). (3) **Reversed-fill red:** on any invalid boundary the editor retries the *reversed* point order — a merely-clockwise region reverses to CCW and renders its true shape in **red** rather than showing nothing on first-load of already-invalid stored data (no last-valid buffer exists yet); a genuinely self-intersecting boundary fails reversed too and falls back to last-valid / pins-only. Regressions: `region-edit-gating.spec.ts` (large-valid region **enables** Submit — verified to fail against the pre-fix code; clockwise stays disabled) plus an extended `region-winding.spec.ts` oracle pinning that the large region signs `<0` yet triangulates.

### Region Rendering Error Boundary (2026-06)
A region whose boundary triangulates badly — most commonly **clockwise** winding — makes `EarClipping` throw `"Iterated all points twice with no triangles"` (`regionMeshGeometry.js`). The throw originates inside the react-three-fiber tree (`DisplayRegionMesh` `useEffect`, `EditRegionMesh` `useLayoutEffect`); with no boundary it unwound to the React root and blanked the **entire** UI, including the search list. A small custom `ErrorBoundary` class (`GlobeSection/Region/ErrorBoundary.jsx`, no new dependency) now wraps each region fill mesh **per region**: `DisplayRegion` wraps its `DisplayRegionMesh` (pins stay as siblings), and `EditableRegion` wraps the edit region mesh. The boundary must sit **inside `<Canvas>`** — a boundary in the outer DOM tree does not catch r3f-tree errors. `fallback` is `null` (the bad region simply renders nothing); `onError` logs the offending `eventId`; `resetKeys=[regionBoundaries]` lets a tripped boundary recover when the boundary data changes (so a bad mid-edit shape recovers once the user fixes it). This is the safety net; winding validation at edit time is the planned root-cause prevention. Note all `generateRegionMesh` calls are in effects (catchable); the live-drag `useFrame` does not triangulate, so its errors (none expected) would not be caught here.

### Region Mesh Pre-Allocated Dynamic Buffers (2026-06)
`EditRegionMesh` no longer allocates fresh `THREE.Float32BufferAttribute` / `Uint32BufferAttribute` on every mesh update. It allocates one large position buffer (`MAX_VERTICES = 4096` × 3 floats) and one index buffer (`MAX_INDICES = 4096 × 8`) once via `initGeometryBuffers()`, both `DynamicDrawUsage`, attached to the geometry a single time. Each update copies `generateRegionMesh` output in with `TypedArray.set(...)` and renders only the live slice via `geometry.setDrawRange(0, indexCount)`; `activeVertexCount` tracks the live length so the whole-region drag `useFrame` snapshots/rotates only active vertices, not the zeroed tail. A capacity guard `console.warn`s and skips the update if a region exceeds the buffers (strictly safer than overflowing), and as of the 2026-07 gating fix also marks the region invalid so Submit is blocked (see winding section). Sizing is comfortable: a default 8-pin region subdivides to a few dozen vertices and even a near-hemisphere region stays under ~700, so the guard realistically never fires. Bounding sphere is intentionally conservative (computed over the full buffer incl. the zeroed tail at globe center) — only ever makes frustum culling less aggressive, never culls a visible mesh. This removes the per-update GPU-buffer churn and is the foundation for live single-pin polygon tracking (Refactor Step 3), which re-runs `generateRegionMesh` per frame.

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
