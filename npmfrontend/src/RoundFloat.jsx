// Source:
//  https://stackoverflow.com/questions/6134039/format-number-to-always-show-2-decimal-places
export function roundFloat(value, numDecimalPlaces) {
  // This is simply the float equivalent of rounding an integer to the nearest 100 (in a C-like 
  // language, at least) by multiplying by 100 and then dividing by 100. 
  // With the float, we are increasing the exponent by the number of desired decimal places, 
  // rounding the result down to the nearest integer, and then reducing the exponent by the number
  // of desired decimal places.
  let asLargerFloat = parseFloat(value + "e" + numDecimalPlaces)
  let asRoundedInt = Math.round(asLargerFloat)
  let asRoundedFloat = Number(asRoundedInt + "e-" + numDecimalPlaces)

  return asRoundedFloat
}