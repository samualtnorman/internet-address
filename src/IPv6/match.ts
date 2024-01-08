import type { IPv6 } from "../IPv6"
import { matchCIDR } from "../internal"
import { fromHextets } from "./fromHextets"

/** Checks if this address matches other one within given CIDR range. */
export const match = (ipv6A: IPv6, ipv6B: IPv6, bits: number): boolean =>
	matchCIDR(ipv6A.hextets, ipv6B.hextets, 16, bits)

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`match()`, () => {
		const address = fromHextets(0x20_01, 0xD_B8, 0xF5_3A, 0, 0, 0, 0, 1)

		expect(match(address, fromHextets(0, 0, 0, 0, 0, 0, 0, 0), 0)).toBe(true)
		expect(match(address, fromHextets(0x20_01, 0xD_B8, 0xF5_3A, 0, 0, 0, 1, 1), 64)).toBe(true)
		expect(match(address, fromHextets(0x20_01, 0xD_B8, 0xF5_3B, 0, 0, 0, 1, 1), 48)).toBe(false)
		expect(match(address, fromHextets(0x20_01, 0xD_B8, 0xF5_31, 0, 0, 0, 1, 1), 44)).toBe(true)
		expect(match(address, fromHextets(0x20_01, 0xD_B8, 0xF5_00, 0, 0, 0, 0, 1), 40)).toBe(true)
		expect(match(address, fromHextets(0x20_01, 0xD_B8, 0xF5_00, 0, 0, 0, 0, 1, `z`), 40)).toBe(true)
		expect(match(address, fromHextets(0x20_01, 0xD_B9, 0xF5_00, 0, 0, 0, 0, 1), 40)).toBe(false)
		expect(match(address, fromHextets(0x20_01, 0xD_B9, 0xF5_00, 0, 0, 0, 0, 1, `z`), 40)).toBe(false)
		expect(match(address, address, 128)).toBe(true)
	})
}
