# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a full-stack web application for visualizing historical events on an interactive 3D globe.

- **`npmfrontend/`** - React + Vite frontend (Three.js, Redux Toolkit, TanStack React Query, Tailwind CSS)
- **`WebAPI/`** - ASP.NET Core backend (Entity Framework Core, SQL Server, Azure Key Vault for secrets)
- **`Tutorials/`** - Reference tutorials
- **`CLAUDE.md`** - This file (project-level guidance)
- **`npmfrontend/PlanEditToShowConversion.md`** - Active plan for Edit-to-Show component conversion

## Build & Run Commands

### Frontend (`npmfrontend/`)
```bash
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run lint     # ESLint with --max-warnings 0
npm run preview  # Preview production build
```

### Backend (`WebAPI/`)
- Open `WebAPI/WebAPI.sln` in Visual Studio or use `dotnet run` from `WebAPI/WebAPI/`
- Requires Azure Key Vault certificate (`historyprojectwebapp`) installed in CurrentUser cert store
- Connects to SQL Server via connection string stored in Azure Key Vault
- CORS enabled for cross-origin requests from the frontend
- Swagger UI available in development mode

## Frontend Architecture (`npmfrontend/`)

### Main Layout (App.jsx)
- **SearchSection** (left): Search interface, currently using restcountries.com API as placeholder; displays clickable results
- **GlobeSection** (center): 3D globe with react-three/fiber, handles raycasting and mouse interactions
- **DetailsSection** (right): Shows/edits event details, toggles between view and edit modes
- **Timeline** (bottom): Placeholder for timeline functionality

### State Management

Redux Toolkit slices in `src/AppState/`:
- `stateSlicePoi`: All events collection and selected event tracking (`poiReducer`)
- `stateSliceEditPoi`: Edit mode state for event modifications (`editPoiReducer`)
- `stateSliceEditSources`: Source document editing state (`editSourcesReducer`)
- `stateSliceEditSourceAuthors`: Author editing state (`editSourceAuthorsReducer`)
- `stateSliceMouseInfo`: Mouse position, raycasting intersections, hover states (`mouseInfoReducer`)
- `stateSliceSelectedPoi`: Selected event state for Show components (`selectedPoiReducer`)

Note: "POI" naming is being migrated to "Event" naming per the plan.

React Query (`@tanstack/react-query`) handles data fetching in SearchSectionMain.

### 3D Scene Structure (GlobeSection/)

The Three.js scene hierarchy:
- `GlobeSectionMain`: Canvas setup, camera controls, mouse event handling
- `Scene`: Frame-by-frame raycasting, mesh management, event/region rendering
- `Globe`: Earth sphere with custom GLSL shaders (`src/assets/shaders/`)
- `Stars`: Background star field
- `EditableRegion`/`DisplayOnlyRegion`: Region boundary visualization
- `PinMesh`: Location markers on globe surface

Mesh names and group names are centralized in `constValues.jsx`.

### Coordinate System Notes

- Globe coordinates convert lat/long to XYZ via `convertLatLongXYZ.jsx`
- Mouse coordinates are normalized to screen space [-1, +1] for raycaster
- The Y-axis is inverted between React canvas events and Three.js/OpenGL conventions

### Edit vs Display Mode

`DetailsSection/Details.jsx` switches between:
- `ShowDetails`: Read-only view of selected event
- `EditEvent`: Full edit interface with sub-components for time, region, sources, etc.

Components in `Edit/` handle specific event fields; `Show/` components display them.

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
