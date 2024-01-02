import type { IPv4 } from "../IPv4"
import { fromBytes } from "./fromBytes"

/** @returns The address in convenient, decimal-dotted format. */
export const toString = (address: IPv4): string => address.join(`.`)

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`toString()`, () => {
		expect(toString(fromBytes(143, 196, 224, 197))).toBe(`143.196.224.197`)
		expect(toString(fromBytes(40, 50, 136, 232))).toBe(`40.50.136.232`)
	})
}
