# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run lint     # ESLint with --max-warnings 0
npm run preview  # Preview production build
```

## Architecture Overview

This is a React + Three.js application for visualizing historical "Points of Interest" (POIs) on an interactive 3D globe. The app is structured around three main UI panels plus a timeline.

### Main Layout (App.jsx)
- **SearchSection** (left): Search interface using restcountries.com API, displays clickable results
- **GlobeSection** (center): 3D globe with react-three/fiber, handles raycasting and mouse interactions
- **DetailsSection** (right): Shows/edits POI details, toggles between view and edit modes
- **Timeline** (bottom): Placeholder for timeline functionality

### State Management

Redux Toolkit slices in `src/AppState/`:
- `stateSlicePoi`: All POIs collection and selected POI tracking
- `stateSliceEditPoi`: Edit mode state for POI modifications
- `stateSliceEditSources`: Source document editing state
- `stateSliceMouseInfo`: Mouse position, raycasting intersections, hover states
- `stateSliceSelectedPoi`: Selected POI state

React Query (`@tanstack/react-query`) handles data fetching in SearchSectionMain.

### 3D Scene Structure (GlobeSection/)

The Three.js scene hierarchy:
- `GlobeSectionMain`: Canvas setup, camera controls, mouse event handling
- `Scene`: Frame-by-frame raycasting, mesh management, POI/region rendering
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
- `ShowDetails`: Read-only view of selected POI
- `EditEvent`: Full edit interface with sub-components for time, region, sources, etc.

Components in `Edit/` handle specific POI fields; `Show/` components display them.
