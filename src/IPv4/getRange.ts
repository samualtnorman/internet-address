import type { RangeList } from "../CIDR"
import type { IPv4, Range } from "../IPv4"
import { subnetMatch } from "../subnetMatch"
import { fromBytes } from "./fromBytes"

/** Special IPv4 address ranges.
  * @see https://en.wikipedia.org/wiki/Reserved_IP_addresses */
const SpecialRanges: RangeList<Range, IPv4> = {
	unspecified: [ { address: fromBytes(0, 0, 0, 0), prefix: 8 } ],
	broadcast: [ { address: fromBytes(255, 255, 255, 255), prefix: 32 } ],
	// RFC3171
	multicast: [ { address: fromBytes(224, 0, 0, 0), prefix: 4 } ],
	// RFC3927
	linkLocal: [ { address: fromBytes(169, 254, 0, 0), prefix: 16 } ],
	// RFC5735
	loopback: [ { address: fromBytes(127, 0, 0, 0), prefix: 8 } ],
	// RFC6598
	carrierGradeNat: [ { address: fromBytes(100, 64, 0, 0), prefix: 10 } ],
	// RFC1918
	private: [
		{ address: fromBytes(10, 0, 0, 0), prefix: 8 },
		{ address: fromBytes(172, 16, 0, 0), prefix: 12 },
		{ address: fromBytes(192, 168, 0, 0), prefix: 16 }
	],
	// Reserved and testing-only ranges; RFCs 5735, 5737, 2544, 1700
	reserved: [
		{ address: fromBytes(192, 0, 0, 0), prefix: 24 },
		{ address: fromBytes(192, 0, 2, 0), prefix: 24 },
		{ address: fromBytes(192, 88, 99, 0), prefix: 24 },
		{ address: fromBytes(198, 18, 0, 0), prefix: 15 },
		{ address: fromBytes(198, 51, 100, 0), prefix: 24 },
		{ address: fromBytes(203, 0, 113, 0), prefix: 24 },
		{ address: fromBytes(240, 0, 0, 0), prefix: 4 }
	],
	// RFC7534, RFC7535
	as112: [ { address: fromBytes(192, 175, 48, 0), prefix: 24 }, { address: fromBytes(192, 31, 196, 0), prefix: 24 } ],
	// RFC7450
	amt: [ { address: fromBytes(192, 52, 193, 0), prefix: 24 } ]
}

export const getRange = (address: IPv4): Range => subnetMatch(SpecialRanges, address) || `unicast`

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`range()`, () => {
		expect(getRange(fromBytes(0, 0, 0, 0))).toBe(`unspecified`)
		expect(getRange(fromBytes(0, 1, 0, 0))).toBe(`unspecified`)
		expect(getRange(fromBytes(10, 1, 0, 1))).toBe(`private`)
		expect(getRange(fromBytes(100, 64, 0, 0))).toBe(`carrierGradeNat`)
		expect(getRange(fromBytes(100, 127, 255, 255))).toBe(`carrierGradeNat`)
		expect(getRange(fromBytes(192, 168, 2, 1))).toBe(`private`)
		expect(getRange(fromBytes(224, 100, 0, 1))).toBe(`multicast`)
		expect(getRange(fromBytes(169, 254, 15, 0))).toBe(`linkLocal`)
		expect(getRange(fromBytes(127, 1, 1, 1))).toBe(`loopback`)
		expect(getRange(fromBytes(255, 255, 255, 255))).toBe(`broadcast`)
		expect(getRange(fromBytes(240, 1, 2, 3))).toBe(`reserved`)
		expect(getRange(fromBytes(8, 8, 8, 8))).toBe(`unicast`)
		expect(getRange(fromBytes(192, 52, 193, 1))).toBe(`amt`)
		expect(getRange(fromBytes(192, 175, 48, 0))).toBe(`as112`)
	})
}
