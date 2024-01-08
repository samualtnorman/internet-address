import type { Range } from "."
import type * as IPv4 from "./IPv4"
import { fromBytes as ipv4FromBytes } from "./IPv4/fromBytes"
import { toString as ipv4ToString } from "./IPv4/toString"
import type * as IPv6 from "./IPv6"
import { fromHextets as ipv6FromHextets } from "./IPv6/fromHextets"
import { toString as ipv6ToString } from "./IPv6/toString"
import type { StringSuggest } from "./internal"

export type Prefix<T extends IPv4.IPv4 | IPv6.IPv6> = T extends IPv4.IPv4 ? IPv4.Prefix : IPv6.Prefix
export type CIDR<T extends IPv4.IPv4 | IPv6.IPv6> = { address: T, prefix: Prefix<T> }
export type RangeList<T extends IPv4.IPv4 | IPv6.IPv6> = Map<StringSuggest<Range<T>>, CIDR<T>[]>

export const toString = <T extends IPv4.IPv4 | IPv6.IPv6>(cidr: CIDR<T>): string => `${
	cidr.address instanceof Uint8Array ? ipv4ToString(cidr.address) : ipv6ToString(cidr.address)}/${cidr.prefix}`

export const from = <T extends IPv4.IPv4 | IPv6.IPv6>(address: T, prefix: Prefix<T>): CIDR<T> => ({ address, prefix })

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`toString()`, () =>
		expect(toString(from(ipv4FromBytes(219, 57, 166, 53), 24))).toBe(`219.57.166.53/24`)
	)

	test(`from()`, () => {
		const ipv4 = ipv4FromBytes(58, 217, 131, 69)
		const ipv4Cidr = from(ipv4, 31)

		expect(ipv4Cidr).toStrictEqual<CIDR<IPv4.IPv4>>({ address: ipv4, prefix: 31 })
		expect(ipv4Cidr.address).toBe(ipv4)

		const ipv6 = ipv6FromHextets(0x93F0, 0x10BC, 0x794A, 0xF47B, 0x4E39, 0x8636, 0xC10E, 0xA5CB)
		const ipv6Cidr = from(ipv6, 128)

		expect(ipv6Cidr).toStrictEqual<CIDR<IPv6.IPv6>>({ address: ipv6, prefix: 128 })
		expect(ipv6Cidr.address).toBe(ipv6)
	})
}
