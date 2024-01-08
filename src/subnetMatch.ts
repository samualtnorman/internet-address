import type { Range } from "."
import type { RangeList } from "./CIDR"
import * as IPv4 from "./IPv4"
import * as IPv6 from "./IPv6"
import type { StringSuggest } from "./internal"
import * as CIDR from "./CIDR"

type IPv4 = IPv4.IPv4
type IPv6 = IPv6.IPv6

/** A utility function to ease named range matching. See examples below.
  * rangeList can contain both IPv4 and IPv6 subnet entries and will not throw errors
  * on matching IPv4 addresses to IPv6 ranges or vice versa. */
export function subnetMatch<T extends IPv4 | IPv6>(
	address: T,
	rangeList: RangeList<T>,
	defaultName: StringSuggest<Range<T>> = `unicast`
): StringSuggest<Range<T>> {
	if (address instanceof Uint8Array) {
		for (const [ rangeName, rangeSubnets ] of rangeList) {
			for (const subnet of rangeSubnets) {
				if (subnet.address instanceof Uint8Array && IPv4.match(address, subnet.address, subnet.prefix))
					return rangeName
			}
		}
	} else {
		for (const [ rangeName, rangeSubnets ] of rangeList) {
			for (const subnet of rangeSubnets) {
				if (!(subnet.address instanceof Uint8Array) && IPv6.match(address, subnet.address, subnet.prefix))
					return rangeName
			}
		}
	}

	return defaultName
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`subnetMatch()`, () => {
		expect(subnetMatch(IPv4.fromBytes(1, 2, 3, 4), new Map, `foo`)).toBe(`foo`)
		expect(subnetMatch(IPv4.fromBytes(1, 2, 3, 4), new Map([ [ `subnet`, [] ] ]), `bar`)).toBe(`bar`)

		expect(subnetMatch<IPv4 | IPv6>(
			IPv4.fromBytes(1, 2, 3, 4),
			new Map([ [ `subnet6`, [ CIDR.from(IPv6.fromHextets(0xFE80, 0, 0, 0, 0, 0, 0, 0), 64) ] ] ]),
			`foo`
		)).toBe(`foo`)

		expect(subnetMatch<IPv4 | IPv6>(
			IPv6.fromHextets(0xFE80, 0, 0, 0, 0, 0, 0, 1),
			new Map([ [ `subnet4`, [ CIDR.from(IPv4.fromBytes(1, 2, 3, 0), 24) ] ] ]),
			`foo`
		)).toBe(`foo`)

		const rangeList: RangeList<IPv4 | IPv6> = new Map([
			[
				`dual64`,
				[
					CIDR.from(IPv4.fromBytes(1, 2, 4, 0), 24),
					CIDR.from(IPv6.fromHextets(0x2001, 1, 2, 3, 0, 0, 0, 0), 64)
				]
			]
		])

		expect(subnetMatch(IPv4.fromBytes(1, 2, 4, 1), rangeList, `foo`)).toBe(`dual64`)
		expect(subnetMatch(IPv6.fromHextets(0x2001, 1, 2, 3, 0, 0, 0, 1), rangeList, `foo`)).toBe(`dual64`)
	})
}
