import type { IPv4 } from "../IPv4"
import { matchCIDR } from "../internal"
import { fromBytes } from "./fromBytes"

/** Checks if this address matches other one within given CIDR range. */
export const match = (addressA: IPv4, addressB: IPv4, bits: number): boolean =>
	matchCIDR(addressA, addressB, 8, bits)

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`match()`, () => {
		const address = fromBytes(10, 5, 0, 1)

		expect(match(address, fromBytes(0, 0, 0, 0), 0)).toBe(true)
		expect(match(address, fromBytes(11, 0, 0, 0), 8)).toBe(false)
		expect(match(address, fromBytes(10, 0, 0, 0), 8)).toBe(true)
		expect(match(address, fromBytes(10, 0, 0, 1), 8)).toBe(true)
		expect(match(address, fromBytes(10, 0, 0, 10), 8)).toBe(true)
		expect(match(address, fromBytes(10, 5, 5, 0), 16)).toBe(true)
		expect(match(address, fromBytes(10, 4, 5, 0), 16)).toBe(false)
		expect(match(address, fromBytes(10, 4, 5, 0), 15)).toBe(true)
		expect(match(address, fromBytes(10, 5, 0, 2), 32)).toBe(false)
		expect(match(address, address, 32)).toBe(true)
	})
}
