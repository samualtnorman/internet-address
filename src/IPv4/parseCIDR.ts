import type { CIDR } from "../CIDR"
import type { IPv4 } from "../IPv4"
import { fromBytes } from "./fromBytes"
import { parse } from "./parse"

/** Parses the string as an IPv4 Address with CIDR Notation. */
export function parseCIDR(address: string): CIDR<IPv4> | undefined {
	const match = /^(.+)\/(\d+)$/.exec(address)

	if (match) {
		const maskLength = Number(match[2])

		if (match[1] && maskLength >= 0 && maskLength <= 32) {
			const ip = parse(match[1])

			if (ip)
				return { address: ip, maskLength }
		}
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`parseCIDR()`, () => {
		expect(parseCIDR(`108.78.3.18/24`)).toStrictEqual({ address: fromBytes(108, 78, 3, 18), maskLength: 24 })
		expect(parseCIDR(`1.2.3.4/24`)).toStrictEqual({ address: fromBytes(1, 2, 3, 4), maskLength: 24 })
		expect(parseCIDR(`1.2.3.4/5`)).toStrictEqual({ address: fromBytes(1, 2, 3, 4), maskLength: 5 })
		expect(parseCIDR(`10.5.0.1`)).toBeUndefined()
		expect(parseCIDR(`0.0.0.0/-1`)).toBeUndefined()
		expect(parseCIDR(`0.0.0.0/33`)).toBeUndefined()
	})
}
