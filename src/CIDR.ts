import * as IPv4 from "./IPv4"
import * as IPv6 from "./IPv6"
import type { StringSuggest } from "./internal"

export type CIDR<IP extends IPv4.IPv4 | IPv6.IPv6> = { address: IP, maskLength: number }

export type RangeList<T extends IPv4.IPv4 | IPv6.IPv6> =
	Map<StringSuggest<T extends IPv4.IPv4 ? IPv4.Range : IPv6.Range>, CIDR<T>[]>

export const toString = <T extends IPv4.IPv4 | IPv6.IPv6>(cidr: CIDR<T>): string => `${
	cidr.address instanceof Uint8Array ? IPv4.toString(cidr.address) : IPv6.toString(cidr.address)}/${cidr.maskLength}`

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`toString()`, () =>
		expect(toString({ address: IPv4.fromBytes(219, 57, 166, 53), maskLength: 24 })).toBe(`219.57.166.53/24`)
	)
}
