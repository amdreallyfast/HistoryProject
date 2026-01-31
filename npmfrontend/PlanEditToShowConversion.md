# Plan: Create Read-Only Show Variants for EditEvent Components

## Summary

Create read-only "Show" variants for the remaining EditEvent components and rename existing Show components to follow the `ShowEvent*` naming convention. These will display event data without edit controls, using `selectedEventReducer` state.

## Design Decisions

- **Terminology: "Event" replaces "POI"** - The domain term "event" replaces the UI term "POI" (Point of Interest) throughout the codebase. Users think about historical events, not points of interest.
- **Sources remain separate objects** - Sources are distinct from events (not event variants). They have their own structure with fields like `title`, `isbn`, `authors[]`, `whereInSource`, and `publicationTime`.
- **Standardized time structure** - Both events and sources use the same nested time object structure with 6 fields: `earliestYear`, `earliestMonth`, `earliestDay`, `latestYear`, `latestMonth`, `latestDay`.
- **State slice naming convention:**
  - `stateSliceEvent` - collection of all events + which one is selected
  - `stateSliceSelectedEvent` - full data of the selected event (for display by Show components)
  - `stateSliceEditEvent` - event data being edited (for Edit components)

## Part 1: Rename Existing Show Components

Rename to follow `ShowEvent*` naming pattern (matching `EditEvent*`):

| Current Name | New Name |
|--------------|----------|
| ShowHeaderDetails.jsx | ShowEventHeader.jsx |
| ShowImageDetails.jsx | ShowEventImage.jsx |
| ShowRegionDetails.jsx | ShowEventRegion.jsx |
| ShowSummaryDetails.jsx | ShowEventSummary.jsx |
| ShowSourceDetails.jsx | (delete - will be replaced by ShowEventSources) |

**For each renamed component:**
1. Rename the file
2. Rename the exported function to match
3. Update variable name: `selectedPoiState` → `selectedEventState`
4. Update selector: `state.selectedPoiReducer` → `state.selectedEventReducer`

Update imports in ShowDetails.jsx accordingly.

## Part 2: Files to Create

All new Show components use `selectedEventReducer` via:
```javascript
const selectedEventState = useSelector((state) => state.selectedEventReducer)
```

### 1. `src/DetailsSection/Show/ShowEventType.jsx`
- Displays `selectedEventState.eventIsCreationOfSource` as "Yes" / "No" text
- Simple layout, no borders

### 2. `src/DetailsSection/Show/ShowEventTime.jsx`
- Displays `selectedEventState.eventTime` (earliest and latest possible dates)
- Calls `convertTimeRangeToGregorianYearMonthDayString` (the helper handles "(exact)" annotation internally)
- Shows "NA" for missing values

### 3. `src/DetailsSection/Show/ShowEventSources.jsx`
- Container that maps over `selectedEventState.sources` array
- Renders `ShowEventSource` for each source
- Shows "NA" fallback when empty (though this shouldn't happen since at least one source is required)

### 4. `src/DetailsSection/Show/ShowEventSource.jsx`
- Displays individual source: title, authors, publication date, location in source, ISBN
- Receives `source` object as prop
- Composes `ShowSourcePublicationTimeRange` and `ShowSourceAuthor`

### 5. `src/DetailsSection/Show/ShowSourcePublicationTimeRange.jsx`
- Displays `source.publicationTime` (earliest/latest bounds)
- Calls `convertTimeRangeToGregorianYearMonthDayString` (the helper handles "(exact)" annotation internally)
- Receives `source` object as prop

### 6. `src/DetailsSection/Show/ShowSourceAuthor.jsx`
- Displays single author name
- Receives `author` object as prop

## Part 3: Files to Modify

### 1. Rename "POI" to "Event" Throughout Codebase

**State Slice Files - Rename:**

| Current File | New File |
|--------------|----------|
| `stateSlicePoi.jsx` | `stateSliceEvent.jsx` |
| `stateSliceEditPoi.jsx` | `stateSliceEditEvent.jsx` |
| `stateSliceSelectedPoi.jsx` | `stateSliceSelectedEvent.jsx` |

**State Slice Internal Names:**

| Current | New |
|---------|-----|
| `stateSlicePoi` | `stateSliceEvent` |
| `stateSliceEditPoi` | `stateSliceEditEvent` |
| `stateSliceSelectedPoi` | `stateSliceSelectedEvent` |

**Reducer Names in `stateStore.jsx`:**

| Current | New |
|---------|-----|
| `poiReducer` | `eventReducer` |
| `editPoiReducer` | `editEventReducer` |
| `selectedPoiReducer` | `selectedEventReducer` |

**Action Exports:**

| Current | New |
|---------|-----|
| `poiStateActions` | `eventStateActions` |
| `editStateActions` | `editEventStateActions` |
| `selectedPoiActions` | `selectedEventStateActions` |

**Field Names in `stateSliceEvent` (formerly `stateSlicePoi`):**

| Current | New |
|---------|-----|
| `allPois` | `allEvents` |
| `selectedPoi` | `selectedEvent` |
| `prevSelectedPoi` | `prevSelectedEvent` |

**Variable Names in Components:**

| Component Type | Current | New |
|----------------|---------|-----|
| Show components | `selectedPoiState` | `selectedEventState` |
| Edit components | `editState` | `editEventState` (optional, for consistency) |
| Other components | `poiState` | `eventState` |

**Files requiring updates for this rename:**
- `src/AppState/stateStore.jsx`
- `src/AppState/stateSlicePoi.jsx` → `stateSliceEvent.jsx`
- `src/AppState/stateSliceEditPoi.jsx` → `stateSliceEditEvent.jsx`
- `src/AppState/stateSliceSelectedPoi.jsx` → `stateSliceSelectedEvent.jsx`
- `src/SearchSection/SearchSectionMain.jsx`
- `src/GlobeSection/Scene.jsx`
- `src/GlobeSection/MouseHandler.jsx`
- `src/GlobeSection/PinMesh.jsx`
- `src/GlobeSection/Region/EditableRegion.jsx`
- `src/GlobeSection/Region/EditRegionMesh.jsx`
- `src/DetailsSection/Details.jsx`
- `src/DetailsSection/Edit/EditEvent.jsx`
- `src/DetailsSection/Edit/EditEventHeader.jsx`
- `src/DetailsSection/Edit/EditEventImage.jsx`
- `src/DetailsSection/Edit/EditEventRegion.jsx`
- `src/DetailsSection/Edit/EditEventSummary.jsx`
- `src/DetailsSection/Edit/EditEventTime.jsx`
- `src/DetailsSection/Edit/EditEventType.jsx`
- `src/DetailsSection/Edit/EditEventSources.jsx`
- `src/DetailsSection/Show/ShowHeaderDetails.jsx` (and other Show components)
- `CLAUDE.md`

### 2. `src/DetailsSection/convertTimeRangeToString.jsx`

**Rename helper functions** to reflect they return strings:
- `convertTimeToGregorianYearMonthDay` → `convertTimeToGregorianYearMonthDayString`
- `convertTimeRangeToGregorianYearMonthDay` → `convertTimeRangeToGregorianYearMonthDayString`

**Update `convertTimeRangeToGregorianYearMonthDayString`** to append "(exact)" when earliest and latest dates are identical:
```javascript
if (earliestYear == latestYear && earliestMonth == latestMonth && earliestDay == latestDay) {
  return convertTimeToGregorianYearMonthDayString(earliestYear, earliestMonth, earliestDay) + " (exact)"
}
```

**Update parameter names** from `lbYear/ubYear` (lower/upper bound) to `earliestYear/latestYear` for consistency.

### 3. `src/AppState/stateSliceEditEvent.jsx` (formerly `stateSliceEditPoi.jsx`)

**Standardize time field structure.** Replace flat fields:
```javascript
// OLD (flat fields)
eventTimeEarliestYear: null,
eventTimeEarliestMonth: null,
eventTimeEarliestDay: null,
eventTimeLatestYear: null,
eventTimeLatestMonth: null,
eventTimeLatestDay: null,
```

With nested structure:
```javascript
// NEW (nested object)
eventTime: {
  earliestYear: null,
  earliestMonth: null,
  earliestDay: null,
  latestYear: null,
  latestMonth: null,
  latestDay: null,
}
```

Update all reducers that reference these fields.

### 4. `src/AppState/stateSliceEditSources.jsx`

**Standardize time field structure** in `sourceInitialState`. Replace:
```javascript
// OLD
publicationTimeRange: {
  lowerBoundYear: null,
  lowerBoundMonth: null,
  lowerBoundDay: null,
  upperBoundYear: null,
  upperBoundMonth: null,
  upperBoundDay: null,
}
```

With:
```javascript
// NEW
publicationTime: {
  earliestYear: null,
  earliestMonth: null,
  earliestDay: null,
  latestYear: null,
  latestMonth: null,
  latestDay: null,
}
```

Update all reducers that reference these fields.

### 5. `src/AppState/stateSliceSelectedEvent.jsx` (formerly `stateSliceSelectedPoi.jsx`)

**Why this needs updating:** Show components use `selectedEventReducer`, not `editEventReducer`. These are separate Redux slices. The edit slice has all fields, but the selected event slice is missing:

- `eventIsCreationOfSource`
- `eventTime` (with 6 subfields: earliestYear/Month/Day, latestYear/Month/Day)

Add these to both `initialState` and the `load` reducer.

### 6. `src/DetailsSection/Show/ShowDetails.jsx`
- Update imports to use new `ShowEvent*` names
- Update selector: `state.poiReducer` → `state.eventReducer`
- Add new components in order:
  - ShowEventHeader
  - ShowEventType
  - ShowEventImage
  - ShowEventTime
  - ShowEventRegion
  - ShowEventSummary
  - ShowEventSources

## Implementation Order

### Phase 1: Foundation Updates

#### Step 1a: Rename "POI" to "Event"
1. **Rename state slice files** - `stateSlicePoi.jsx` → `stateSliceEvent.jsx`, etc.
2. **Update stateStore.jsx** - Change reducer names (`poiReducer` → `eventReducer`, etc.)
3. **Update all importing files** - Fix imports and variable names throughout codebase
4. **Update CLAUDE.md** - Reflect new naming convention

#### Step 1b: Time Structure Updates
5. **convertTimeRangeToString.jsx** - Rename functions, add "(exact)" logic, update parameter names
6. **stateSliceEditEvent.jsx** - Refactor to use nested `eventTime` object
7. **stateSliceEditSources.jsx** - Refactor to use nested `publicationTime` object
8. **Update Edit components** - Update EditEventTime and EditSourcePublicationTimeRange to use new field structure
9. **EditSourcePublicationTimeRange.jsx** - Complete the upper bound inputs (currently incomplete)

### Phase 2: Rename Existing Show Components
10. **Rename Show component files** - Update filenames to `ShowEvent*` pattern
11. **Update component function names** - Match new filenames
12. **Update variable names** - `selectedPoiState` → `selectedEventState`
13. **Update ShowDetails.jsx imports** - Reference new component names

### Phase 3: Create New Show Components
14. **stateSliceSelectedEvent.jsx** - Add missing fields (`eventIsCreationOfSource`, `eventTime`)
15. **ShowEventType.jsx** - Simplest new component, uses `selectedEventState`
16. **ShowSourceAuthor.jsx** - Simple leaf component
17. **ShowSourcePublicationTimeRange.jsx** - Uses `convertTimeRangeToGregorianYearMonthDayString`
18. **ShowEventTime.jsx** - Uses `convertTimeRangeToGregorianYearMonthDayString`
19. **ShowEventSource.jsx** - Composes author and time components
20. **ShowEventSources.jsx** - Container for sources
21. **ShowDetails.jsx** - Update imports and wire everything together

## Styling Conventions

- **No borders** on Show components (borders were for validation feedback in edit mode)
- Use `text-white` for primary text
- Use `text-gray-400` for secondary labels
- Use `m-1` for spacing
- Use "NA" for missing/empty values
- Clean, minimal display-only styling

## Verification

### Phase 1a Verification (POI → Event Rename)
1. Run `npm run lint` to check for import/reference errors
2. Run `npm run dev` to start dev server
3. Verify app still loads without errors
4. Verify search results still populate
5. Verify clicking an event still highlights it
6. Verify Edit mode still works (components use `editEventReducer`)

### Phase 1b Verification (Time Structure Updates)
7. Verify Edit components still work after refactoring:
   - EditEventTime reads/writes to `eventTime.earliestYear`, etc.
   - EditSourcePublicationTimeRange reads/writes to `publicationTime.earliestYear`, etc.
   - EditSourcePublicationTimeRange displays both earliest AND latest inputs
8. Run `npm run lint` to check for errors

### Phase 2 Verification (Show Component Renames)
9. Verify renamed Show components still work:
   - ShowEventHeader displays title and tags
   - ShowEventImage displays image
   - ShowEventRegion displays coordinates
   - ShowEventSummary displays summary
10. Verify components use `selectedEventState` (not `selectedPoiState`)

### Phase 3 Verification (New Show Components)
11. Select an event to view in ShowDetails mode
12. Verify each new component renders correctly:
   - ShowEventType shows Yes/No
   - ShowEventTime shows formatted dates or "NA"
   - ShowEventTime shows "(exact)" when earliest and latest dates match
   - ShowEventSources shows source list or "NA"
   - ShowSourcePublicationTimeRange shows "(exact)" when dates match
13. Test with null/empty data to verify "NA" fallbacks work
14. Run `npm run lint` to check for errors
