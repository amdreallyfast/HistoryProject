// Backend JSON uses PascalCase (DefaultContractResolver in Newtonsoft.Json).
// These functions convert between backend Event shape and frontend event shape.

import { dataUrlToImageBinary, imageBinaryToDataUrl } from "./imageDataUrl"
import { classifyRegionWinding, regionWinding } from "../GlobeSection/Region/regionMeshGeometry"
import { ConvertLatLongToXYZ } from "../GlobeSection/convertLatLongXYZ"

function nullableIntToString(value) {
  return value != null ? String(value) : null
}

// backend Event → frontend event (for storing in allEvents Redux state)
export function backendToFrontend(e) {
  return {
    eventId: e.EventId,
    revision: e.Revision,
    revisionAuthor: e.RevisionAuthor ?? "",
    revisionDateTime: e.RevisionDateTime ?? null,
    title: e.Title,
    tags: e.Tags?.map(t => t.Value) ?? [],
    summary: e.Summary ?? "",
    eventIsCreationOfSource: e.EventIsCreationOfSource ?? false,
    imageDataUrl: imageBinaryToDataUrl(e.EventImage?.ImageBinary),
    eventTime: {
      earliestYear: nullableIntToString(e.LBYear),
      earliestMonth: nullableIntToString(e.LBMonth),
      earliestDay: nullableIntToString(e.LBDay),
      latestYear: nullableIntToString(e.UBYear),
      latestMonth: nullableIntToString(e.UBMonth),
      latestDay: nullableIntToString(e.UBDay),
    },
    primaryLoc: e.SpecificLocation
      ? { lat: e.SpecificLocation.Latitude, long: e.SpecificLocation.Longitude }
      : null,
    regionBoundaries: [...(e.Region ?? [])].sort((a, b) => a.OrderIndex - b.OrderIndex).map(loc => ({
      lat: loc.Latitude,
      long: loc.Longitude,
    })),
    sources: e.Sources?.map(s => ({
      title: s.Title ?? "",
      isbn: s.ISBN ?? null,
      whereInSource: s.Where ?? "",
      publicationTime: {
        earliestYear: nullableIntToString(s.PublicationLBYear),
        earliestMonth: nullableIntToString(s.PublicationLBMonth),
        earliestDay: nullableIntToString(s.PublicationLBDay),
        latestYear: nullableIntToString(s.PublicationUBYear),
        latestMonth: nullableIntToString(s.PublicationUBMonth),
        latestDay: nullableIntToString(s.PublicationUBDay),
      },
      authors: s.Authors?.map(a => ({ name: a.Name })) ?? [],
    })) ?? [],
  }
}

// Normalize a region boundary to counterclockwise before submitting.
//
// EarClipping requires counterclockwise (viewed from outside the globe) and throws otherwise,
// so a clockwise ring would be a region no viewer could draw. The manual pin-drag UI can
// transiently produce one — drag a pin far enough across the ring and the orientation flips —
// so rather than block the user, reverse it here. Reversing a merely-clockwise ring yields the
// same shape wound the right way.
//
// The backend deliberately does NOT do this: it rejects a clockwise ring with a 422. A bad
// winding arriving at the API means this function was bypassed or has regressed, and quietly
// repairing it there would hide that.
//
// A DEGENERATE ring (collinear, duplicated, zero-area) is returned untouched. There is nothing
// to normalize — it has no orientation to correct — and silently reordering it would disguise
// bad data as good. Submit is already blocked in that case by the triangulation gate
// (regionValid), and if one does reach the API the backend rejects it.
//
// Radius is arbitrary: regionSignedArea normalizes to unit vectors, and only the SIGN is used.
function normalizeRegionWinding(boundaries) {
  if (!boundaries || boundaries.length < 3) {
    return boundaries ?? []
  }

  const asXYZ = boundaries.map(b => ConvertLatLongToXYZ(b.lat, b.long, 1))
  if (classifyRegionWinding(asXYZ) === regionWinding.clockwise) {
    return [...boundaries].reverse()
  }
  return boundaries
}

// frontend event → backend Event shape (for POST /api/HistoricalEvent/Create)
export function frontendToBackend(ev) {
  const toInt = (str) => str != null ? parseInt(str) : null

  return {
    Id: crypto.randomUUID(),
    EventId: ev.eventId,
    Revision: ev.revision,
    RevisionDateTime: new Date().toISOString(),
    RevisionAuthor: ev.revisionAuthor ?? "amdreallyfast",
    Title: ev.title,
    Summary: ev.summary ?? "",
    EventIsCreationOfSource: ev.eventIsCreationOfSource ?? false,
    LBYear: toInt(ev.eventTime?.earliestYear) ?? -99999,
    LBMonth: toInt(ev.eventTime?.earliestMonth),
    LBDay: toInt(ev.eventTime?.earliestDay),
    LBHour: null,
    LBMin: null,
    UBYear: toInt(ev.eventTime?.latestYear) ?? 99999,
    UBMonth: toInt(ev.eventTime?.latestMonth),
    UBDay: toInt(ev.eventTime?.latestDay),
    UBHour: null,
    UBMin: null,
    Tags: ev.tags?.map(v => ({ Id: crypto.randomUUID(), Value: v })) ?? [],
    EventImage: { Id: crypto.randomUUID(), ImageBinary: dataUrlToImageBinary(ev.imageDataUrl) },
    SpecificLocation: ev.primaryLoc
      ? { Id: crypto.randomUUID(), Latitude: ev.primaryLoc.lat, Longitude: ev.primaryLoc.long }
      : null,
    // OrderIndex is assigned AFTER normalization, because OrderIndex — not list position —
    // is what both the backend winding check and backendToFrontend treat as the ring order.
    Region: normalizeRegionWinding(ev.regionBoundaries).map((b, index) => ({
      Id: crypto.randomUUID(),
      Latitude: b.lat,
      Longitude: b.long,
      OrderIndex: index,
    })),
    Sources: ev.sources?.map(s => ({
      Id: crypto.randomUUID(),
      Title: s.title ?? "",
      ISBN: s.isbn ?? null,
      Where: s.whereInSource || null,
      PublicationLBYear: toInt(s.publicationTime?.earliestYear) ?? -99999,
      PublicationLBMonth: toInt(s.publicationTime?.earliestMonth),
      PublicationLBDay: toInt(s.publicationTime?.earliestDay),
      PublicationUBYear: toInt(s.publicationTime?.latestYear) ?? 99999,
      PublicationUBMonth: toInt(s.publicationTime?.latestMonth),
      PublicationUBDay: toInt(s.publicationTime?.latestDay),
      Authors: s.authors?.map(a => ({ Id: crypto.randomUUID(), Name: a.name })) ?? [],
    })) ?? [],
  }
}
