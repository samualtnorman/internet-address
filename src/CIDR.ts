import type { Range } from "."
import * as IPv4 from "./IPv4"
import * as IPv6 from "./IPv6"
import type { StringSuggest } from "./internal"

export type Prefix<T extends IPv4.IPv4 | IPv6.IPv6> = T extends IPv4.IPv4 ? IPv4.Prefix : IPv6.Prefix
export type CIDR<T extends IPv4.IPv4 | IPv6.IPv6> = { address: T, prefix: Prefix<T> }
export type RangeList<T extends IPv4.IPv4 | IPv6.IPv6> = Map<StringSuggest<Range<T>>, CIDR<T>[]>

export const toString = <T extends IPv4.IPv4 | IPv6.IPv6>(cidr: CIDR<T>): string => `${
	cidr.address instanceof Uint8Array ? IPv4.toString(cidr.address) : IPv6.toString(cidr.address)}/${cidr.prefix}`

export const from = <T extends IPv4.IPv4 | IPv6.IPv6>(address: T, prefix: Prefix<T>): CIDR<T> => ({ address, prefix })

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`toString()`, () =>
		expect(toString(from(IPv4.fromBytes(219, 57, 166, 53), 24))).toBe(`219.57.166.53/24`)
	)
}
