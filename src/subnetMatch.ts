import type { RangeList } from "./CIDR"
import * as CIDR from "./CIDR"
import * as IPv4 from "./IPv4"
import * as IPv6 from "./IPv6"

type IPv4 = IPv4.IPv4
type IPv6 = IPv6.IPv6

/** A utility function to ease named range matching. See examples below.
  * rangeList can contain both IPv4 and IPv6 subnet entries and will not throw errors
  * on matching IPv4 addresses to IPv6 ranges or vice versa. */
export function subnetMatch<TIP extends IPv4 | IPv6, TRangeList extends RangeList<string, TIP>>(
	rangeList: TRangeList,
	address: IPv4 | IPv6
): (keyof TRangeList) | undefined {
	if (address instanceof Uint8Array) {
		for (const [ rangeName, rangeSubnets ] of Object.entries(rangeList) as [ keyof TRangeList, CIDR.CIDR<TIP>[] ][]) {
			for (const subnet of rangeSubnets) {
				if (subnet.address instanceof Uint8Array && IPv4.match(address, subnet.address, subnet.prefix))
					return rangeName
			}
		}
	} else {
		for (const [ rangeName, rangeSubnets ] of Object.entries(rangeList) as [ keyof TRangeList, CIDR.CIDR<TIP>[] ][]) {
			for (const subnet of rangeSubnets) {
				if (!(subnet.address instanceof Uint8Array) && IPv6.match(address, subnet.address, subnet.prefix))
					return rangeName
			}
		}
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`subnetMatch()`, () => {
		// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
		expect(subnetMatch({}, IPv4.fromBytes(1, 2, 3, 4))).toBeUndefined()
		expect(subnetMatch({ subnet: [] }, IPv4.fromBytes(1, 2, 3, 4))).toBeUndefined()

		expect(subnetMatch(
			{ subnet6: [ CIDR.from(IPv6.fromHextets(0xFE80, 0, 0, 0, 0, 0, 0, 0), 64) ] },
			IPv4.fromBytes(1, 2, 3, 4)
		)).toBeUndefined()

		expect(subnetMatch(
			{ subnet4: [ CIDR.from(IPv4.fromBytes(1, 2, 3, 0), 24) ] },
			IPv6.fromHextets(0xFE80, 0, 0, 0, 0, 0, 0, 1)
		)).toBeUndefined()

		const rangeList = {
			dual64: [
				CIDR.from(IPv4.fromBytes(1, 2, 4, 0), 24),
				CIDR.from(IPv6.fromHextets(0x2001, 1, 2, 3, 0, 0, 0, 0), 64)
			]
		}

		expect(subnetMatch(rangeList, IPv4.fromBytes(1, 2, 4, 1))).toBe(`dual64`)
		expect(subnetMatch(rangeList, IPv6.fromHextets(0x2001, 1, 2, 3, 0, 0, 0, 1))).toBe(`dual64`)
	})
}
