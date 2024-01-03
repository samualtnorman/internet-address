import type { CIDR } from "../CIDR"
import type { IPv6 } from "../IPv6"
import { parse } from "./parse"

/** @returns parsed `CIDR` or `undefined` if invalid */
export function parseCIDR(addr: string): CIDR<IPv6> | undefined {
	const match = /^(.+)\/(\d+)$/.exec(addr)

	if (match) {
		const maskLength = parseInt(match[2]!)

		if (maskLength >= 0 && maskLength <= 128) {
			const ip = parse(match[1]!)

			if (ip)
				return { address: ip, maskLength }
		}
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`parseCIDR()`, () => {
		expect(parseCIDR(`2001:db8:f53a::1`)).toBeUndefined()
		expect(parseCIDR(`2001:db8:f53a::1/-1`)).toBeUndefined()
		expect(parseCIDR(`2001:db8:f53a::1/129`)).toBeUndefined()
	})
}
