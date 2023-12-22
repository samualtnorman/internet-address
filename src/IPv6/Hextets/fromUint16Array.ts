import type { Hextets } from "../Hextets"
import { is } from "./is"

/** @returns A {@link Hextets} object from {@link uint16Array}.
  * @throws If {@link uint16Array} does not have a length of 8. */
export function fromUint16Array(uint16Array: Uint16Array): Hextets {
	if (is(uint16Array))
		return uint16Array

	throw Error(`Uint16Array must have a length of 8`)
}
