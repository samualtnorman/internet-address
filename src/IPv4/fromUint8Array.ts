import type { IPv4 } from "../IPv4"
import { is } from "./is"

/** @returns `IPv4` from `Uint8Array`.
  * @throws When `Uint8Array` length is not 4. */
export function fromUint8Array(uint8Array: Uint8Array): IPv4 {
	if (is(uint8Array))
		return uint8Array

	throw Error(`Uint8Array should have a length of 4`)
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`fromUint8Array()`, () => {
		const u8View = new Uint8Array([ 37, 187, 127, 176 ])

		expect(fromUint8Array(u8View)).toBe(u8View)
		expect(() => fromUint8Array(new Uint8Array())).toThrowError()
	})
}
