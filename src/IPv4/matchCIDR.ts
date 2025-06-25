import { CIDR } from "../default"
import type { IPv4 } from "../IPv4"
import { fromBytes } from "./fromBytes"
import { match } from "./match"

export const matchCIDR = (address: IPv4, cidr: CIDR<IPv4>): boolean => match(address, cidr.address, cidr.prefix)

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`parseCIDR()`, () => {
		const address = fromBytes(10, 5, 0, 1)

		expect(matchCIDR(address, CIDR.from(fromBytes(0, 0, 0, 0), 0))).toBe(true)
		expect(matchCIDR(address, CIDR.from(fromBytes(11, 0, 0, 0), 8))).toBe(false)
		expect(matchCIDR(address, CIDR.from(fromBytes(10, 0, 0, 0), 8))).toBe(true)
		expect(matchCIDR(address, CIDR.from(fromBytes(10, 0, 0, 1), 8))).toBe(true)
		expect(matchCIDR(address, CIDR.from(fromBytes(10, 0, 0, 10), 8))).toBe(true)
		expect(matchCIDR(address, CIDR.from(fromBytes(10, 5, 5, 0), 16))).toBe(true)
		expect(matchCIDR(address, CIDR.from(fromBytes(10, 4, 5, 0), 16))).toBe(false)
		expect(matchCIDR(address, CIDR.from(fromBytes(10, 4, 5, 0), 15))).toBe(true)
		expect(matchCIDR(address, CIDR.from(fromBytes(10, 5, 0, 2), 32))).toBe(false)
		expect(matchCIDR(address, CIDR.from(fromBytes(10, 5, 0, 1), 32))).toBe(true)
	})
}
