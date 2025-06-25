import { CIDR } from "../default"
import type { IPv6 } from "../IPv6"
import { fromHextets } from "./fromHextets"
import { numberIsPrefix } from "./numberIsPrefix"
import { parse } from "./parse"

/** @returns parsed `CIDR` or `undefined` if invalid */
export function parseCIDR(addr: string): CIDR<IPv6> | undefined {
	const match = /^(.+)\/(\d+)$/.exec(addr)

	if (match) {
		const prefix = parseInt(match[2]!)

		if (numberIsPrefix(prefix)) {
			const address = parse(match[1]!)

			if (address)
				return { address, prefix }
		}
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`parseCIDR()`, () => {
		expect(parseCIDR(`0:0:0:0:0:0:0:0/64`)).toStrictEqual(CIDR.from(fromHextets(0, 0, 0, 0, 0, 0, 0, 0), 64))
		expect(parseCIDR(`0:0:0:ff:ff:0:0:0/64`)).toStrictEqual(CIDR.from(fromHextets(0, 0, 0, 0xFF, 0xFF, 0, 0, 0), 64))

		expect(parseCIDR(`2001:db8:ff:abc:def:123b:456c:78d/64`))
			.toStrictEqual(CIDR.from(fromHextets(0x2001, 0xDB8, 0xFF, 0xABC, 0xDEF, 0x123B, 0x456C, 0x78D), 64))

		expect(parseCIDR(`::1%zone/24`)).toStrictEqual(CIDR.from(fromHextets(0, 0, 0, 0, 0, 0, 0, 1, `zone`), 24))
		expect(parseCIDR(`fc00::/64`)).toStrictEqual(CIDR.from(fromHextets(0xFC00, 0, 0, 0, 0, 0, 0, 0), 64))
		expect(parseCIDR(`2001:db8:f53a::1`)).toBeUndefined()
		expect(parseCIDR(`2001:db8:f53a::1/-1`)).toBeUndefined()
		expect(parseCIDR(`2001:db8:f53a::1/129`)).toBeUndefined()
	})
}
