// Backend JSON uses PascalCase (DefaultContractResolver in Newtonsoft.Json).
// These functions convert between backend Event shape and frontend event shape.

function nullableIntToString(value) {
  return value != null ? String(value) : null
}

// backend Event → frontend event (for storing in allEvents Redux state)
export function backendToFrontend(e) {
  return {
    eventId: e.EventId,
    revision: e.Revision,
    revisionAuthor: e.RevisionAuthor ?? "",
    title: e.Title,
    tags: e.Tags?.map(t => t.Value) ?? [],
    summary: e.Summary ?? "",
    eventIsCreationOfSource: false, // not stored in backend model yet
    imageDataUrl: null,
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
    regionBoundaries: e.Region?.map(loc => ({
      lat: loc.Latitude,
      long: loc.Longitude,
    })) ?? [],
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
    EventImage: { Id: crypto.randomUUID(), ImageBinary: "" },
    SpecificLocation: ev.primaryLoc
      ? { Id: crypto.randomUUID(), Latitude: ev.primaryLoc.lat, Longitude: ev.primaryLoc.long }
      : null,
    Region: ev.regionBoundaries?.map(b => ({
      Id: crypto.randomUUID(),
      Latitude: b.lat,
      Longitude: b.long,
    })) ?? [],
    Sources: ev.sources?.map(s => ({
      Id: crypto.randomUUID(),
      Title: s.title ?? "",
      ISBN: s.isbn ?? null,
      Where: s.whereInSource ?? "",
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
