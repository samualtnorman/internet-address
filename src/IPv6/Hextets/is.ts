import type { Hextets } from "../Hextets"

/** @returns Whether the {@link uint16Array} has a length of 8. */
export const is = (uint16Array: Uint16Array): uint16Array is Hextets => uint16Array.length == 8
