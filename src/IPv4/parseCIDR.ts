import { CIDR } from "../default"
import type { IPv4 } from "../IPv4"
import { fromBytes } from "./fromBytes"
import { numberIsPrefix } from "./numberIsPrefix"
import { parse } from "./parse"

/** Parses the string as an IPv4 Address with CIDR Notation. */
export function parseCIDR(address: string): CIDR<IPv4> | undefined {
	const match = /^(.+)\/(\d+)$/.exec(address)

	if (match) {
		const prefix = Number(match[2])

		if (match[1] && numberIsPrefix(prefix)) {
			const address = parse(match[1])

			if (address)
				return { address, prefix }
		}
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`parseCIDR()`, () => {
		expect(parseCIDR(`108.78.3.18/24`)).toStrictEqual<CIDR<IPv4>>(CIDR.from(fromBytes(108, 78, 3, 18), 24))
		expect(parseCIDR(`1.2.3.4/24`)).toStrictEqual<CIDR<IPv4>>(CIDR.from(fromBytes(1, 2, 3, 4), 24))
		expect(parseCIDR(`1.2.3.4/5`)).toStrictEqual<CIDR<IPv4>>(CIDR.from(fromBytes(1, 2, 3, 4), 5))
		expect(parseCIDR(`10.5.0.1`)).toBeUndefined()
		expect(parseCIDR(`0.0.0.0/-1`)).toBeUndefined()
		expect(parseCIDR(`0.0.0.0/33`)).toBeUndefined()
	})
}
