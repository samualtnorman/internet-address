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

	throw Error(`Uint16Array must have a length of 8, got ${uint16Array.length}`)
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`is()`, () => {
		expect(is(new Uint16Array([ 0xB4_45, 0x89_55, 0xCC_64, 0xE3_78, 0x9A_AB, 0x7A_9D, 0x8E_9F, 0x23_92 ]))).toBe(true)
		expect(is(new Uint16Array())).toBe(false)
	})

	test(`fromUint16Array()`, () => {
		const u16View = new Uint16Array([ 0xB0_68, 0xBD_0E, 0x26_92, 0x84_22, 0xAC_DE, 0xB1_8D, 0x9C_08, 0x92_58 ])

		expect(fromUint16Array(u16View)).toStrictEqual(u16View)
		expect(() => fromUint16Array(new Uint16Array())).toThrowError()
	})
}
