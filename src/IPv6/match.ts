import type { IPv6 } from "../IPv6"
import { matchCIDR } from "../internal"
import { fromHextets } from "./fromHextets"

/** Checks if this address matches other one within given CIDR range. */
export const match = (ipv6A: IPv6, ipv6B: IPv6, bits: number): boolean =>
	matchCIDR(ipv6A.hextets, ipv6B.hextets, 16, bits)

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`match()`, () => {
		const address = fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 1)

		expect(match(address, fromHextets(0, 0, 0, 0, 0, 0, 0, 0), 0)).toBe(true)
		expect(match(address, fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 1, 1), 64)).toBe(true)
		expect(match(address, fromHextets(0x2001, 0xDB8, 0xF53B, 0, 0, 0, 1, 1), 48)).toBe(false)
		expect(match(address, fromHextets(0x2001, 0xDB8, 0xF531, 0, 0, 0, 1, 1), 44)).toBe(true)
		expect(match(address, fromHextets(0x2001, 0xDB8, 0xF500, 0, 0, 0, 0, 1), 40)).toBe(true)
		expect(match(address, fromHextets(0x2001, 0xDB8, 0xF500, 0, 0, 0, 0, 1, `z`), 40)).toBe(true)
		expect(match(address, fromHextets(0x2001, 0xDB9, 0xF500, 0, 0, 0, 0, 1), 40)).toBe(false)
		expect(match(address, fromHextets(0x2001, 0xDB9, 0xF500, 0, 0, 0, 0, 1, `z`), 40)).toBe(false)
		expect(match(address, address, 128)).toBe(true)
	})
}
