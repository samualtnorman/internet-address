import { CIDR } from ".."
import type { IPv6 } from "../IPv6"
import { fromHextets } from "./fromHextets"
import { match } from "./match"

export const matchCIDR = (ipv6: IPv6, cidr: CIDR<IPv6>) => match(ipv6, cidr.address, cidr.prefix)

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`matchCIDR()`, () => {
		const address = fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 1)

		expect(matchCIDR(address, CIDR.from(fromHextets(0, 0, 0, 0, 0, 0, 0, 0), 0))).toBe(true)
		expect(matchCIDR(address, CIDR.from(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 1, 1), 64))).toBe(true)
		expect(matchCIDR(address, CIDR.from(fromHextets(0x2001, 0xDB8, 0xF53B, 0, 0, 0, 1, 1), 48))).toBe(false)
		expect(matchCIDR(address, CIDR.from(fromHextets(0x2001, 0xDB8, 0xF531, 0, 0, 0, 1, 1), 44))).toBe(true)
		expect(matchCIDR(address, CIDR.from(fromHextets(0x2001, 0xDB8, 0xF500, 0, 0, 0, 0, 1), 40))).toBe(true)
		expect(matchCIDR(address, CIDR.from(fromHextets(0x2001, 0xDB8, 0xF500, 0, 0, 0, 0, 1, `z`), 40))).toBe(true)
		expect(matchCIDR(address, CIDR.from(fromHextets(0x2001, 0xDB9, 0xF500, 0, 0, 0, 0, 1), 40))).toBe(false)
		expect(matchCIDR(address, CIDR.from(fromHextets(0x2001, 0xDB9, 0xF500, 0, 0, 0, 0, 1, `z`), 40))).toBe(false)
		expect(matchCIDR(address, CIDR.from(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 1), 128))).toBe(true)
	})
}
