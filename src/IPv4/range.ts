import { subnetMatch, type RangeList } from ".."
import type { StringSuggest } from "../internal"
import * as IPv4 from "."

/** Special IPv4 address ranges.
  * @see https://en.wikipedia.org/wiki/Reserved_IP_addresses */
  const SpecialRanges: RangeList<IPv4.IPv4> = new Map([
	[ `unspecified`, [ { ip: IPv4.fromBytes(0, 0, 0, 0), bits: 8 } ] ],
	[ `broadcast`, [ { ip: IPv4.fromBytes(255, 255, 255, 255), bits: 32 } ] ],
	// RFC3171
	[ `multicast`, [ { ip: IPv4.fromBytes(224, 0, 0, 0), bits: 4 } ] ],
	// RFC3927
	[ `linkLocal`, [ { ip: IPv4.fromBytes(169, 254, 0, 0), bits: 16 } ] ],
	// RFC5735
	[ `loopback`, [ { ip: IPv4.fromBytes(127, 0, 0, 0), bits: 8 } ] ],
	// RFC6598
	[ `carrierGradeNat`, [ { ip: IPv4.fromBytes(100, 64, 0, 0), bits: 10 } ] ],
	// RFC1918
	[ `private`, [
		{ ip: IPv4.fromBytes(10, 0, 0, 0), bits: 8 },
		{ ip: IPv4.fromBytes(172, 16, 0, 0), bits: 12 },
		{ ip: IPv4.fromBytes(192, 168, 0, 0), bits: 16 }
	] ],
	// Reserved and testing-only ranges; RFCs 5735, 5737, 2544, 1700
	[ `reserved`, [
		{ ip: IPv4.fromBytes(192, 0, 0, 0), bits: 24 },
		{ ip: IPv4.fromBytes(192, 0, 2, 0), bits: 24 },
		{ ip: IPv4.fromBytes(192, 88, 99, 0), bits: 24 },
		{ ip: IPv4.fromBytes(198, 18, 0, 0), bits: 15 },
		{ ip: IPv4.fromBytes(198, 51, 100, 0), bits: 24 },
		{ ip: IPv4.fromBytes(203, 0, 113, 0), bits: 24 },
		{ ip: IPv4.fromBytes(240, 0, 0, 0), bits: 4 }
	] ]
])

/** Checks if the address corresponds to one of the special ranges. */
export const range = (address: IPv4): StringSuggest<Range> => subnetMatch(address, SpecialRanges)
