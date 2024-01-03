import type { RangeList } from "../CIDR"
import type { IPv4 } from "../IPv4"
import type { StringSuggest } from "../internal"
import { subnetMatch } from "../subnetMatch"
import { fromBytes } from "./fromBytes"

/** Special IPv4 address ranges.
  * @see https://en.wikipedia.org/wiki/Reserved_IP_addresses */
const SpecialRanges: RangeList<IPv4> = new Map([
	[ `unspecified`, [ { address: fromBytes(0, 0, 0, 0), maskLength: 8 } ] ],
	[ `broadcast`, [ { address: fromBytes(255, 255, 255, 255), maskLength: 32 } ] ],
	// RFC3171
	[ `multicast`, [ { address: fromBytes(224, 0, 0, 0), maskLength: 4 } ] ],
	// RFC3927
	[ `linkLocal`, [ { address: fromBytes(169, 254, 0, 0), maskLength: 16 } ] ],
	// RFC5735
	[ `loopback`, [ { address: fromBytes(127, 0, 0, 0), maskLength: 8 } ] ],
	// RFC6598
	[ `carrierGradeNat`, [ { address: fromBytes(100, 64, 0, 0), maskLength: 10 } ] ],
	// RFC1918
	[ `private`, [
		{ address: fromBytes(10, 0, 0, 0), maskLength: 8 },
		{ address: fromBytes(172, 16, 0, 0), maskLength: 12 },
		{ address: fromBytes(192, 168, 0, 0), maskLength: 16 }
	] ],
	// Reserved and testing-only ranges; RFCs 5735, 5737, 2544, 1700
	[ `reserved`, [
		{ address: fromBytes(192, 0, 0, 0), maskLength: 24 },
		{ address: fromBytes(192, 0, 2, 0), maskLength: 24 },
		{ address: fromBytes(192, 88, 99, 0), maskLength: 24 },
		{ address: fromBytes(198, 18, 0, 0), maskLength: 15 },
		{ address: fromBytes(198, 51, 100, 0), maskLength: 24 },
		{ address: fromBytes(203, 0, 113, 0), maskLength: 24 },
		{ address: fromBytes(240, 0, 0, 0), maskLength: 4 }
	] ]
])

/** Checks if the address corresponds to one of the special ranges. */
export const range = (address: IPv4): StringSuggest<Range> => subnetMatch(address, SpecialRanges)

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`range()`, () => {
		expect(range(fromBytes(0, 0, 0, 0))).toBe(`unspecified`)
		expect(range(fromBytes(0, 1, 0, 0))).toBe(`unspecified`)
		expect(range(fromBytes(10, 1, 0, 1))).toBe(`private`)
		expect(range(fromBytes(100, 64, 0, 0))).toBe(`carrierGradeNat`)
		expect(range(fromBytes(100, 127, 255, 255))).toBe(`carrierGradeNat`)
		expect(range(fromBytes(192, 168, 2, 1))).toBe(`private`)
		expect(range(fromBytes(224, 100, 0, 1))).toBe(`multicast`)
		expect(range(fromBytes(169, 254, 15, 0))).toBe(`linkLocal`)
		expect(range(fromBytes(127, 1, 1, 1))).toBe(`loopback`)
		expect(range(fromBytes(255, 255, 255, 255))).toBe(`broadcast`)
		expect(range(fromBytes(240, 1, 2, 3))).toBe(`reserved`)
		expect(range(fromBytes(8, 8, 8, 8))).toBe(`unicast`)
	})
}
