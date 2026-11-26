# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a full-stack web application for visualizing historical events on an interactive 3D globe.

- **`npmfrontend/`** - React + Vite frontend (Three.js, Redux Toolkit, TanStack React Query, Tailwind CSS)
- **`WebAPI/`** - ASP.NET Core backend (Entity Framework Core, SQL Server; Managed Identity in Azure)
- **`Tutorials/`** - Reference tutorials
- **`CLAUDE.md`** - This file (project-level guidance)
- **`DESIGN.md`** - Living design document (vision, architecture, design decisions)
- **`TODO.md`** - Prioritized work items (bug fixes, refactors, features, design discussions)
- **`claudePlans/`** - Archived plan documents and setup guides (numbered chronologically)

## Development Workflow (pull requests)

The user judges whether the app works; Claude handles the git and PR mechanics. The user should not need to read PRs.

- **Branches:** `test` is the integration branch and deploys to the Azure test environment on merge. `main` is production. Never commit directly to either.
- **Doing work:** branch from the latest `test` (e.g. `fix/…`, `feature/…`, `todo/…`), commit, push, and open a PR into `test` with `gh pr create --base test`. The PR description says what changed, how it was tested, and anything not verified.
- **Required checks:** `backend-tests` and `frontend-tests` must pass before a PR can merge into `test` or `main` (GitHub rulesets enforce this). If one fails, fix it on the branch.
- **Merging into `test`:** Claude merges its own PR (`gh pr merge <n> --merge --delete-branch`) once the required checks pass. No approval is needed; GitHub never lets the author approve their own PR anyway. Use a merge commit, not squash, so individual commit messages survive.
- **Merging into `main`:** only when the user explicitly says so (e.g. "release", "promote to main"), every time. Open a PR from `test` into `main`, wait for checks, then merge. Never merge into `main` on your own judgment.
- **Production database on release:** prod is migrated by hand (the test App Service auto-migrates; prod doesn't). Prod's schema can lag behind `main`'s code: in 2026-11 it was missing a migration promoted months earlier, which broke prod reads silently. On every release:
  1. Ask the user to run `SELECT TOP 5 MigrationId FROM __EFMigrationsHistory ORDER BY MigrationId DESC;` on `HistoryProjectDb` (Azure portal → SQL database → Query editor; it shows only the **last** statement's result, so give one query per block).
  2. Generate the script **from prod's newest applied migration**, not from what `main` contains: `dotnet ef migrations script <prodLatest> <newestMigration> --idempotent` (from `WebAPI/WebAPI/`). Strip `GO` lines for the portal editor. Don't commit it.
  3. Read every migration in the range for preconditions (e.g. a unique index fails on existing duplicates) and give the user a read-only check query for each.
  4. User runs the script, then the history query again to confirm. Check the prod API afterwards (`https://historyprojectapi.azurewebsites.net/api/HistoricalEvent/GetFirst100`).
- **After merging into `test`:** tell the user what to try, on the test site (https://gray-ground-025c5820f.7.azurestaticapps.net; backend wakes slowly from idle) or locally.
- **Commit messages:** follow the rules at the top of `TODO.md`, and start every subject with `w/claude: `.

## Build & Run Commands

### Frontend (`npmfrontend/`)
```bash
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run lint     # ESLint with --max-warnings 0
npm run preview  # Preview production build
npm run test:e2e # Playwright E2E tests (boots Vite, API mocked; no backend needed)
```

### Backend (`WebAPI/`)
- Open `WebAPI/WebAPI.sln` in Visual Studio or use `dotnet run` from `WebAPI/WebAPI/`
- Development reads the SQL Server connection string from `ConnectionStrings:LocalDb`
  - Windows: `appsettings.Development.json` points at SQL Server Express (`localhost\SQLEXPRESS`, Windows auth)
  - Linux: run `scripts/setup-linux-dev.sh` once per machine. It starts SQL Server 2022 in Docker (`historyproject-sql`), keeps the generated password in `~/.config/historyproject/sql.env`, stores the connection string in .NET user-secrets (which override appsettings), and applies migrations
- Azure (non-Development) connects via Managed Identity using `AzureSql:Server` / `AzureSql:Database`; no secrets in config
- CORS enabled for cross-origin requests from the frontend
- Swagger UI available in development mode

## Frontend Architecture (`npmfrontend/`)

### Main Layout (App.jsx)
- **SearchSection** (left): Search interface, loads events from `events.json`, displays clickable results
- **GlobeSection** (center): 3D globe with react-three/fiber, handles raycasting and mouse interactions
- **DetailsSection** (right): Shows/edits event details, toggles between Display and Edit modes
- **Timeline** (bottom): Placeholder for timeline functionality

### State Management

Redux Toolkit slices in `src/AppState/`:
- `stateSliceEvent`: All events collection and selected event tracking (`eventReducer`)
- `stateSliceEditEvent`: Edit mode state for event modifications (`editEventReducer`)
- `stateSliceEditSources`: Source document editing state (`editSourcesReducer`)
- `stateSliceEditSourceAuthors`: Author editing state (`editSourceAuthorsReducer`)
- `stateSliceMouseInfo`: Mouse position, raycasting intersections, hover states (`mouseInfoReducer`)
- `stateSliceSelectedEvent`: Selected event state for Display components (`selectedEventReducer`)

React Query (`@tanstack/react-query`) handles data fetching in SearchSectionMain.

### 3D Scene Structure (GlobeSection/)

The Three.js scene hierarchy:
- `GlobeSectionMain`: Canvas setup, camera controls, mouse event handling
- `Scene`: Frame-by-frame raycasting, mesh management, event/region rendering
- `Globe`: Earth sphere with custom GLSL shaders (`src/assets/shaders/`)
- `Stars`: Background star field
- `EditableRegion`/`DisplayOnlyRegion`: Region boundary visualization
- `EditPinMesh`/`DisplayPinMesh`: Location markers on globe surface (edit = draggable, display = static)

Mesh names and group names are centralized in `constValues.jsx`.

### Testing

Playwright E2E tests live in `npmfrontend/tests/` (TypeScript). Run `npm run test:e2e` (or `npx playwright show-report`). The backend API is mocked via `page.route` from `tests/fixtures/events.json`, so no backend/DB is needed; Playwright boots the Vite dev server itself. Fixtures use the backend's PascalCase JSON shape with a counterclockwise region boundary (clockwise crashes ear-clipping). UI hooks are `data-testid`. CI: `.github/workflows/playwright.yml`. See DESIGN.md "Testing" for scenario coverage.

### Visual checks (seeing the 3D UI yourself)

Playwright tests assert behavior but can't show the mouse cursor or what a person sees mid-drag. For UI changes on the globe, also run a visual check: `npm run visual:<name>` from `npmfrontend/` (e.g. `visual:cursors`). It runs a real headed Chromium on an invisible virtual X screen, drives it with **real** X mouse input (press, hold, move, release), and captures the screen **with the OS cursor** into `npmfrontend/visual-output/<name>/` (git-ignored). Read the captured PNGs (especially `strip.png`) to judge the look. Needs `xvfb` and `ffmpeg` (installed on the dev machine). New scenarios go in `npmfrontend/visual/scenarios/` using `visual/harness.mjs`; see DESIGN.md "Visual checks".

### Coordinate System Notes

- Globe coordinates convert lat/long to XYZ via `convertLatLongXYZ.jsx`
- Mouse coordinates are normalized to screen space [-1, +1] for raycaster
- The Y-axis is inverted between React canvas events and Three.js/OpenGL conventions

### Edit vs Display Mode

`DetailsSection/DetailsMain.jsx` switches between:
- `DisplayEvent`: Read-only view of selected event (components in `Display/`)
- `EditEvent`: Full edit interface with sub-components for time, region, sources, etc. (components in `Edit/`)

App starts in display mode. Editing copies selected event into edit slices. Submit creates a new revision.

## Backend Architecture (`WebAPI/`)

### API Controller
- `HistoricalEventController` at route `api/HistoricalEvent/`
- Endpoints: `GetLatestRevision/{eventId}`, `GetAllRevisions/{eventId}`, `GetSpecificRevision/{eventId}/{revision}`, `GetFirst100`, `GetEventOfTheDay`, `Create`, `Update`, `Delete/{eventId}`
- Returns `Event` objects with eager-loaded related entities (Tags, EventImage, SpecificLocation, Region, Sources with Authors)

### Data Model (`WebAPI/Models/`)
- `Event`: Core entity with Id, EventId (shared across revisions), Revision, Title, Summary, time bounds (LB/UB Year/Month/Day/Hour/Min), SpecificLocation, Region, Sources, Tags, EventImage
- `EventSource`: ISBN, Title, Where (location in source), Authors, publication time bounds
- `EventSourceAuthor`: Author name
- `EventLocation`: Latitude/Longitude coordinates
- `EventImage`: Image binary data
- `Tag`: Tag value
- `EventTime`, `EventTimeRange`: Currently commented out (time fields are flattened onto Event and EventSource)

### Database
- Entity Framework Core with SQL Server (`HistoryProjectDbContext`)
- Migrations in `WebAPI/WebAPI/Migrations/`
- JSON serialization via Newtonsoft.Json with `ReferenceLoopHandling.Ignore`
