# Plan: Create Read-Only Show Variants for EditEvent Components

## Summary

Create read-only "Show" variants for the remaining EditEvent components and rename existing Show components to follow the `ShowEvent*` naming convention. These will display POI data without edit controls, using `selectedPoiReducer` state.

## Part 1: Rename Existing Show Components

Rename to follow `ShowEvent*` naming pattern (matching `EditEvent*`):

| Current Name | New Name |
|--------------|----------|
| ShowHeaderDetails.jsx | ShowEventHeader.jsx |
| ShowImageDetails.jsx | ShowEventImage.jsx |
| ShowRegionDetails.jsx | ShowEventRegion.jsx |
| ShowSummaryDetails.jsx | ShowEventSummary.jsx |
| ShowSourceDetails.jsx | (delete - will be replaced by ShowEventSources) |

Update imports in ShowDetails.jsx accordingly.

## Part 2: Files to Create

### 1. `src/DetailsSection/Show/ShowEventType.jsx`
- Displays `eventIsCreationOfSource` as "Yes" / "No" text
- Simple layout, no borders

### 2. `src/DetailsSection/Show/ShowEventTime.jsx`
- Displays earliest and latest possible dates
- Uses `convertTimeToGregorianYearMonthDay` helper for formatting
- Shows "NA" for missing values

### 3. `src/DetailsSection/Show/ShowEventSources.jsx`
- Container that maps over `sources` array
- Renders `ShowEventSource` for each source
- Shows "NA" fallback when empty (though this shouldn't happen since at least one source is required)

### 4. `src/DetailsSection/Show/ShowEventSource.jsx`
- Displays individual source: title, authors, publication date, location in source, ISBN
- Receives `source` object as prop
- Composes `ShowSourcePublicationTimeRange` and `ShowSourceAuthor`

### 5. `src/DetailsSection/Show/ShowSourcePublicationTimeRange.jsx`
- Displays publication date range (lower/upper bounds)
- If both bounds match: show single date with "Exact date" note to the right
- Receives `source` object as prop

### 6. `src/DetailsSection/Show/ShowSourceAuthor.jsx`
- Displays single author name
- Receives `author` object as prop

## Part 3: Files to Modify

### 1. `src/AppState/stateSliceSelectedPoi.jsx`

**Why this needs updating:** Show components use `selectedPoiReducer` (from `stateSliceSelectedPoi.jsx`), not `editPoiReducer` (from `stateSliceEditPoi.jsx`). These are separate Redux slices. The edit slice has all fields, but the selected POI slice is missing:

- `eventIsCreationOfSource`
- `eventTimeEarliestYear/Month/Day`
- `eventTimeLatestYear/Month/Day`

Add these to both `initialState` and the `load` reducer.

### 2. `src/DetailsSection/Show/ShowDetails.jsx`
- Update imports to use new `ShowEvent*` names
- Add new components in order:
  - ShowEventHeader
  - ShowEventType
  - ShowEventImage
  - ShowEventTime
  - ShowEventRegion
  - ShowEventSummary
  - ShowEventSources

## Implementation Order

1. **Rename existing components** - Update filenames and component names
2. **stateSliceSelectedPoi.jsx** - Add missing fields
3. **ShowEventType.jsx** - Simplest new component
4. **ShowSourceAuthor.jsx** - Simple leaf component
5. **ShowSourcePublicationTimeRange.jsx** - Date formatting with "Exact date" logic
6. **ShowEventTime.jsx** - Similar date formatting
7. **ShowEventSource.jsx** - Composes author and time components
8. **ShowEventSources.jsx** - Container for sources
9. **ShowDetails.jsx** - Update imports and wire everything together

## Styling Conventions

- **No borders** on Show components (borders were for validation feedback in edit mode)
- Use `text-white` for primary text
- Use `text-gray-400` for secondary labels
- Use `m-1` for spacing
- Use "NA" for missing/empty values
- Clean, minimal display-only styling

## Verification

1. Run `npm run dev` to start dev server
2. Select a POI to view in ShowDetails mode
3. Verify each component renders correctly:
   - Renamed components still work
   - ShowEventType shows Yes/No
   - ShowEventTime shows formatted dates or "NA"
   - ShowEventSources shows source list or "NA"
   - ShowSourcePublicationTimeRange shows "Exact date" when bounds match
4. Test with null/empty data to verify "NA" fallbacks work
5. Run `npm run lint` to check for errors
