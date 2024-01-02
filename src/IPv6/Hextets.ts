/** Does not exist at runtime, just for faking nominal typing in typescript. */
declare const HextetsTag: unique symbol

/** Eight big-endian 16-bit unsigned integers. */
export type Hextets = Uint16Array & { [HextetsTag]: typeof HextetsTag }

/** @returns Whether the {@link uint16Array} has a length of 8. */
export const is = (uint16Array: Uint16Array): uint16Array is Hextets => uint16Array.length == 8

/** @returns A {@link Hextets} object from {@link uint16Array}.
  * @throws If {@link uint16Array} does not have a length of 8. */
export function fromUint16Array(uint16Array: Uint16Array): Hextets {
	if (is(uint16Array))
		return uint16Array

	throw Error(`Uint16Array must have a length of 8`)
}
