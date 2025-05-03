/**
 * Utility function to replace lodash.isequal with node:util's isDeepStrictEqual
 * This is a wrapper to make it easier to replace all instances of lodash.isequal
 */

import { isDeepStrictEqual } from 'node:util'

/**
 * Performs a deep comparison between two values to determine if they are equivalent.
 * This is a drop-in replacement for lodash.isequal
 * 
 * @param value The value to compare
 * @param other The other value to compare
 * @returns Returns true if the values are equivalent, else false
 */
export function isEqual(value: any, other: any): boolean {
  return isDeepStrictEqual(value, other)
}

export default isEqual
