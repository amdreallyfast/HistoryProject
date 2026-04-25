export const detailRestrictions = {
  maxTitleLength: 128,
  maxTagLength: 32,
  maxSummaryLength: 2048,
  maxSourceTitleLength: 128,
  maxSourceIsbnLength: 13,
  maxWhereInSourceLength: 64,
  maxSourceAuthorLength: 128
}

// Returns true if the earliest date is chronologically later than the latest date.
export function isDateRangeInverted(eYear, eMonth, eDay, lYear, lMonth, lDay) {
  const ey = Number(eYear), ly = Number(lYear)
  if (isNaN(ey) || isNaN(ly) || !eYear || !lYear) return false
  if (ey > ly) return true
  if (ey < ly) return false
  const em = Number(eMonth), lm = Number(lMonth)
  if (!eMonth || !lMonth || isNaN(em) || isNaN(lm)) return false
  if (em > lm) return true
  if (em < lm) return false
  const ed = Number(eDay), ld = Number(lDay)
  if (!eDay || !lDay || isNaN(ed) || isNaN(ld)) return false
  return ed > ld
}
