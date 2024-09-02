

export function convertToTimeSinceFoundingOfRome(y, m, d) {
  // "pivot" date == origin (zero point) of calendar
  let py = -753
  let pm = 4
  let pd = 21

  if (y && m && d) {
    yDiff = py - y
    mDiff = pm - m
    dDiff = pd - d
    if (yDiff < -1) {
      return `${Math.abs(yDiff)}y, ${Math.abs(mDiff)}m, ${Math.abs(dDiff)}d before the founding of Rome`
    }
    else if (yDiff > 1) {
      return `${Math.abs(yDiff)}y, ${Math.abs(mDiff)}m, ${Math.abs(dDiff)}d after the founding of Rome`
    }
    else if (mDiff < -1) {
      return `${Math.abs(mDiff)}m, ${Math.abs(dDiff)}d before the founding of Rome`
    }
    else if (mDiff > 1) {
      return `${Math.abs(mDiff)}m, ${Math.abs(dDiff)}d after the founding of Rome`
    }
    else if (dDiff < -1) {
      return `${Math.abs(dDiff)}d before the founding of Rome`
    }
    else if (dDiff > 1) {
      return `${Math.abs(dDiff)}d after the founding of Rome`
    }
    else {
      return `day of the founding of Rome`
    }
  }
  else if (y && m) {
    yDiff = py - y
    mDiff = pm - m
    if (yDiff < -1) {
      return `${Math.abs(yDiff)}y, ${Math.abs(mDiff)}m before the founding of Rome`
    }
    else if (yDiff > 1) {
      return `${Math.abs(yDiff)}y, ${Math.abs(mDiff)}m after the founding of Rome`
    }
    else if (mDiff < -1) {
      return `${Math.abs(mDiff)}m before the founding of Rome`
    }
    else if (mDiff > 1) {
      return `${Math.abs(mDiff)}m after the founding of Rome`
    }
    else {
      return `month of the founding of Rome`
    }
  }
  else if (y) {
    yDiff = py - y
    if (yDiff < -1) {
      return `${Math.abs(yDiff)}y before the founding of Rome`
    }
    else if (yDiff > 1) {
      return `${Math.abs(yDiff)}y after the founding of Rome`
    }
    else {
      return `year of the founding of Rome`
    }
  }
  else {
    throw new Error("couldn't convert to time since Rome's founding")
  }
}

export function convertTimeRangeToGregorianYearMonthDay(lbYear, lbMonth, lbDay, ubYear, ubMonth, ubDay) {
  if (lbYear == ubYear && lbMonth == ubMonth && lbDay == ubDay) {
    // Exact date. Upper bound == lower bound. Only need one.
    return convertTimeToGregorianYearMonthDay(lbYear, lbMonth, lbDay)
  }

  let lbString = convertTimeToGregorianYearMonthDay(lbYear, lbMonth, lbDay)
  let ubString = convertTimeToGregorianYearMonthDay(ubYear, ubMonth, ubDay)
  return `between '${lbString}' and ${ubString}`
}

export function convertTimeToGregorianYearMonthDay(y, m, d) {
  // "pivot" date == origin (zero point) of calendar
  let py = 0
  let pm = 0
  let pd = 0

  if (y && m && d) {
    return `${y.toString()}/${m.toString().padStart(2)}/${d.toString().padStart(2)}`
  }
  else if (y && m) {
    return `${y.toString()}/${m.toString().padStart(2)}`
  }
  else if (y) {
    return `${y.toString()}`
  }
  else {
    throw new Error("couldn't convert to Gregorian time")
  }
}

//??use somewhere maybe??
// Source:
//  Note: I combined the solutions.
//  https://www.sitepoint.com/convert-numbers-to-ordinals-javascript/
//  https://stackoverflow.com/questions/13627308/add-st-nd-rd-and-th-ordinal-suffix-to-a-number
function toOrdinalString(n) {
  if (n % 10 == 1 && n % 100 != 11) {
    return n + 'st';
  }
  else if (n % 10 == 2 && n % 100 != 12) {
    return n + 'nd';
  }
  else if (n % 10 == 3 && n % 100 != 13) {
    return n + 'rd';
  }

  return n + "th";
}