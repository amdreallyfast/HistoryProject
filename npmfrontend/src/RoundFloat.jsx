// Source:
//  https://stackoverflow.com/questions/6134039/format-number-to-always-show-2-decimal-places
export function roundFloat(value, numDecimalPlaces) {
  // This is simply the float equivalent of rounding an integer to the nearest 100 (in a C-like 
  // language, at least) by multiplying by 100 and then dividing by 100. 
  // With the float, we are:
  //  1. Increasing the exponent by the number of desired decimal places
  //  2. Rounding the result down to the nearest integer
  //  3. Decreasing the exponent by the number of desired decimal places
  //  This puts the decimal back in place.
  // And we are doing it with string parsing. Because JavaScript.
  let asLargerFloat = parseFloat(value + "e" + numDecimalPlaces)
  let asRoundedInt = Math.round(asLargerFloat)
  let asRoundedFloat = Number(asRoundedInt + "e-" + numDecimalPlaces)

  return asRoundedFloat
}