import type { IPv4 } from "../IPv4"
import { is } from "./is"

export function fromUint8Array(u8View: Uint8Array): IPv4 {
	if (is(u8View))
		return u8View

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
