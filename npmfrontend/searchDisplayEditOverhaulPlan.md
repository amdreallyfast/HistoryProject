# Plan: Search Display & Globe Visualization Refactoring

## Context

The frontend has working search functionality with default events and a mature edit mode for historical events on a 3D globe. However, the "Show" (read-only) components need cleanup, and the globe currently only displays regions/pins for the single event being edited. This plan introduces display-only globe visualization for all search results, renames components for consistency, and wires up selected-event highlighting.

Each phase has a pause point for manual verification via `npm run dev`.

---

## Phase 1: Cleanup and Renames

**1.1 Rename ShowDetails -> ShowEvent**

- **Rename** `src/DetailsSection/Show/ShowDetails.jsx` -> `src/DetailsSection/Show/ShowEvent.jsx`
- Inside: `export function ShowDetails` -> `export function ShowEvent`
- **Modify** `src/DetailsSection/Details.jsx`: update import and JSX from `ShowDetails` to `ShowEvent`

**1.2 Remove stateSliceEditSources.importSource**

Already done. Confirmed: no `importSource` exists in `stateSliceEditSources.jsx` or anywhere in `src/`.

**Verification:** `npm run dev` - app loads, edit mode still works.

---

## Phase 2: Rename "Show" to "Display"

Rename the `Show/` directory to `Display/` and all components from `Show*` to `Display*`.

| Old File | New File | Function Rename |
|---|---|---|
| `Show/ShowEvent.jsx` | `Display/DisplayEvent.jsx` | `ShowEvent` -> `DisplayEvent` |
| `Show/ShowEventHeader.jsx` | `Display/DisplayEventHeader.jsx` | `ShowEventHeader` -> `DisplayEventHeader` |
| `Show/ShowEventType.jsx` | `Display/DisplayEventType.jsx` | `ShowEventType` -> `DisplayEventType` |
| `Show/ShowEventImage.jsx` | `Display/DisplayEventImage.jsx` | `ShowEventImage` -> `DisplayEventImage` |
| `Show/ShowEventTime.jsx` | `Display/DisplayEventTime.jsx` | `ShowEventTime` -> `DisplayEventTime` |
| `Show/ShowEventRegion.jsx` | `Display/DisplayEventRegion.jsx` | `ShowEventRegion` -> `DisplayEventRegion` |
| `Show/ShowEventSummary.jsx` | `Display/DisplayEventSummary.jsx` | `ShowEventSummary` -> `DisplayEventSummary` |
| `Show/ShowEventSources.jsx` | `Display/DisplayEventSources.jsx` | `ShowEventSources` -> `DisplayEventSources` |
| `Show/ShowEventSource.jsx` | `Display/DisplayEventSource.jsx` | `ShowEventSource` -> `DisplayEventSource` |
| `Show/ShowSourceAuthor.jsx` | `Display/DisplaySourceAuthor.jsx` | `ShowSourceAuthor` -> `DisplaySourceAuthor` |
| `Show/ShowSourcePublicationTimeRange.jsx` | `Display/DisplaySourcePublicationTimeRange.jsx` | `ShowSourcePublicationTimeRange` -> `DisplaySourcePublicationTimeRange` |

**Files needing import updates:**
- `src/DetailsSection/Details.jsx` - import `DisplayEvent` from `./Display/DisplayEvent`
- `Display/DisplayEvent.jsx` - update all sub-component imports
- `Display/DisplayEventSources.jsx` - update `DisplayEventSource` import
- `Display/DisplayEventSource.jsx` - update `DisplaySourceAuthor` and `DisplaySourcePublicationTimeRange` imports

**After renaming, delete the empty `Show/` directory.**

**Verification:** `npm run dev` - app loads, display mode renders correctly when editModeOn is toggled off.

---

## Phase 3: Rename Details to DetailsMain

- **Rename** `src/DetailsSection/Details.jsx` -> `src/DetailsSection/DetailsMain.jsx`
- Inside: `export function Details` -> `export function DetailsMain`
- **Modify** `src/App.jsx`: update import and JSX from `Details` to `DetailsMain`

**Verification:** `npm run dev` - app loads without errors.

---

## Phase 4: Display All Search Results on Globe

### 4.1 Extract Geometry Utilities from EditRegionMesh

**TODO / Design thoughts on approaches:**
- **(a) Extract to utility module (chosen approach):** Move `EarClipping`, `MeshSubdivider`, `rescaleToSphere`, and `generateRegionMesh` into `src/GlobeSection/Region/regionMeshGeometry.js`. These are pure geometry classes using only `THREE.Vector3` - zero React/Redux dependency. Both `EditRegionMesh` and `DisplayRegionMesh` import from it.
- **(b) Props-based single component:** One `RegionMesh` with a mode prop. Rejected because Edit reads from Redux while Display takes props, and Edit has wireframe lines while Display does not - too many conditionals.
- **(c) Shared base component:** A `RegionMeshBase` with Edit/Display wrappers. Over-engineered for current needs - option (a) achieves the same sharing more simply.

**New file:** `src/GlobeSection/Region/regionMeshGeometry.js`
- Extract from `EditRegionMesh.jsx`: `class EarClipping`, `class MeshSubdivider`, `function rescaleToSphere`, `function generateRegionMesh`
- Named exports for all four

**Modify:** `src/GlobeSection/Region/EditRegionMesh.jsx`
- Remove inlined classes/functions (~lines 67-419)
- Add `import { generateRegionMesh } from "./regionMeshGeometry"`
- `useEffect` logic unchanged

### 4.2 DisplayPinMesh + Rename PinMesh to EditPinMesh

**Rename:** `src/GlobeSection/PinMesh.jsx` -> `src/GlobeSection/EditPinMesh.jsx`
- `export function PinMesh` -> `export function EditPinMesh`
- All internal logic unchanged (click-and-drag, bounding box, hover, selection)

**Update imports:**
- `src/GlobeSection/Region/EditableRegion.jsx` - `EditPinMesh` from `"../EditPinMesh"`
- `src/GlobeSection/Scene.jsx` - no longer imports PinMesh for display (see 4.4)

**New file:** `src/GlobeSection/DisplayPinMesh.jsx`
- Props: `{ spherePoint, globeInfo, colorHex, length, scale, lookAt }`
- Contains only `makePin()` geometry logic (from EditPinMesh lines 34-84)
- Single `<mesh>`, no bounding box, no `useSelector`, no `useDispatch`, no mouse interaction
- A `useEffect` on `colorHex` to update `meshRef.current.material.color` when it changes

### 4.3 DisplayRegion (rewrite DisplayOnlyRegion)

**Rewrite:** `src/GlobeSection/Region/DisplayOnlyRegion.jsx` (currently a broken placeholder)
- Props: `{ eventId, primaryLoc, regionBoundaries, globeInfo, isSelected }`
- No Redux reads - all data via props
- Renders:
  - One `DisplayPinMesh` for primary location (using `displayPinMeshInfo` colors/scales)
  - One `DisplayPinMesh` per region boundary point
  - One `DisplayRegionMesh` for region fill (if >= 3 boundary points)
- Returns `null` if no `primaryLoc`

**New file:** `src/GlobeSection/Region/DisplayRegionMesh.jsx`
- Props: `{ regionBoundaries, sphereRadius, color }`
- Import `generateRegionMesh` from `"./regionMeshGeometry"`
- Same mesh generation as EditRegionMesh useEffect, but driven by props
- No wireframe lines
- Single `<mesh>` with `meshBasicMaterial`, `DoubleSide`, `transparent`, `opacity: 0.5`

### 4.4 Display Pin Constants + Scene Integration

**Modify:** `src/GlobeSection/constValues.jsx`

Add:
```js
export const displayPinMeshInfo = {
  length: 3,
  primaryPinScale: 0.025,     // ~0.25x of edit's 0.1
  primaryPinColor: 0xff0000,
  regionPinScale: 0.0125,     // ~0.25x of edit's 0.05
  regionPinColor: 0xffd700,
}

// meshNames additions:
DisplayPin: "DisplayPinMesh",
DisplayRegion: "DisplayRegionMesh",

// groupNames additions:
DisplayRegionGroup: "DisplayRegionGroup",
```

**Modify:** `src/GlobeSection/Scene.jsx`

1. Replace the `useEffect` on `eventState.allEvents` (line 67): instead of creating `PinMesh` per event, create `DisplayOnlyRegion` per event (which includes pins + region mesh):
   ```jsx
   eventState.allEvents?.forEach((event) => {
     if (event.eventId != editState.eventId && event.primaryLoc) {
       let primarySpherePoint = createSpherePointFromLatLong(...)
       let regionSpherePoints = (event.regionBoundaries || []).map(b => createSpherePointFromLatLong(...))
       displayElements.push(
         <DisplayOnlyRegion key={event.eventId} eventId={event.eventId}
           primaryLoc={primarySpherePoint} regionBoundaries={regionSpherePoints}
           globeInfo={earthGlobeInfo} isSelected={false} />
       )
     }
   })
   ```

2. Simplify the `editModeOn` useEffect (line 107): only render `EditableRegion` when editing, `null` otherwise (display regions are handled by poiReactElements now).

3. Remove `import { PinMesh }` and `import { DisplayOnlyRegion }` from old location. Add `import { DisplayOnlyRegion } from "./Region/DisplayOnlyRegion"`.

4. Display meshes have no bounding boxes, so raycasting naturally skips them.

**Verification:** `npm run dev` - search, click Search button, all events show pins + regions on globe.

---

## Phase 5: Selected Event Interaction

### 5.1 Search Result Highlighting (already works)
`SearchSectionMain.jsx` already highlights/outlines the selected search result via the `useEffect` on `eventState.selectedEvent`. No changes needed.

### 5.2 + 5.3 Globe Highlighting for Selected Event

**Modify:** `src/GlobeSection/constValues.jsx` - add highlight colors:
```js
export const displayHighlightInfo = {
  regionColor: 0x00aaff,       // bright blue for selected region
  primaryPinColor: 0xff4444,   // slightly brighter red for selected primary pin
  regionPinColor: 0xffee00,    // slightly brighter yellow for selected boundary pins
}
```

**Modify:** `src/GlobeSection/Region/DisplayOnlyRegion.jsx` - use `isSelected` prop to switch between normal and highlight colors for `DisplayPinMesh` and `DisplayRegionMesh`.

**Modify:** `src/GlobeSection/Scene.jsx` - in the allEvents `useEffect`, pass `isSelected={event.eventId === eventState.selectedEvent?.eventId}` to each `DisplayOnlyRegion`. Add `eventState.selectedEvent` to the dependency array.

### 5.4 Display Components Feed from selectedEvent State
Already wired: all Display* components (formerly Show*) read from `state.selectedEventReducer`, and `SearchSectionMain.onEventClicked` dispatches to `selectedEventStateActions.load`. No changes needed.

### 5.5 Turn Off editModeOn Default

**Modify:** `src/AppState/stateSliceEditEvent.jsx` - change `editModeOn: true` to `editModeOn: false` in `initialState`.

This means on startup: `DetailsMain` renders `DisplayEvent` (not `EditEvent`), and `Scene` does not render `EditableRegion`.

**Verification:** `npm run dev` - app starts in display mode. Click Search, results appear. Click a result: it highlights in search list, its region/pins highlight on globe, its details appear in the Display panel.

---

## New Files Summary

| File | Purpose |
|---|---|
| `src/GlobeSection/Region/regionMeshGeometry.js` | Extracted EarClipping, MeshSubdivider, rescaleToSphere |
| `src/GlobeSection/Region/DisplayRegionMesh.jsx` | Props-driven region mesh (no Redux) |
| `src/GlobeSection/DisplayPinMesh.jsx` | Props-driven pin (no Redux, no interaction) |

## Renamed Files Summary

| Old | New |
|---|---|
| `DetailsSection/Show/ShowDetails.jsx` | `DetailsSection/Display/DisplayEvent.jsx` |
| All `DetailsSection/Show/Show*.jsx` | All `DetailsSection/Display/Display*.jsx` |
| `DetailsSection/Details.jsx` | `DetailsSection/DetailsMain.jsx` |
| `GlobeSection/PinMesh.jsx` | `GlobeSection/EditPinMesh.jsx` |

## Key Modified Files

| File | Changes |
|---|---|
| `App.jsx` | Import `DetailsMain` |
| `GlobeSection/constValues.jsx` | Add `displayPinMeshInfo`, `displayHighlightInfo`, new mesh/group names |
| `GlobeSection/Scene.jsx` | Use `DisplayOnlyRegion` for all non-edited events, pass `isSelected` |
| `GlobeSection/Region/EditableRegion.jsx` | Import `EditPinMesh` |
| `GlobeSection/Region/EditRegionMesh.jsx` | Import geometry from `regionMeshGeometry.js` |
| `GlobeSection/Region/DisplayOnlyRegion.jsx` | Complete rewrite |
| `AppState/stateSliceEditEvent.jsx` | `editModeOn` default to `false` |
