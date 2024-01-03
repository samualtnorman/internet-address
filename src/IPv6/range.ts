import type { RangeList } from "../CIDR"
import type { IPv6, Range } from "../IPv6"
import type { StringSuggest } from "../internal"
import { subnetMatch } from "../subnetMatch"
import { fromHextets } from "./fromHextets"

/** Special IPv6 ranges */
const SpecialRanges: RangeList<IPv6> = new Map([
	// RFC4291, here and after
	[ `unspecified`, [ { address: fromHextets(0, 0, 0, 0, 0, 0, 0, 0), maskLength: 128 } ] ],
	[ `linkLocal`, [ { address: fromHextets(0xFE_80, 0, 0, 0, 0, 0, 0, 0), maskLength: 10 } ] ],
	[ `multicast`, [ { address: fromHextets(0xFF_00, 0, 0, 0, 0, 0, 0, 0), maskLength: 8 } ] ],
	[ `loopback`, [ { address: fromHextets(0, 0, 0, 0, 0, 0, 0, 1), maskLength: 128 } ] ],
	[ `uniqueLocal`, [ { address: fromHextets(0xFC_00, 0, 0, 0, 0, 0, 0, 0), maskLength: 7 } ] ],
	[ `ipv4Mapped`, [ { address: fromHextets(0, 0, 0, 0, 0, 0xFF_FF, 0, 0), maskLength: 96 } ] ],
	// RFC6145
	[ `rfc6145`, [ { address: fromHextets(0, 0, 0, 0, 0xFF_FF, 0, 0, 0), maskLength: 96 } ] ],
	// RFC6052
	[ `rfc6052`, [ { address: fromHextets(0x64, 0xFF_9B, 0, 0, 0, 0, 0, 0), maskLength: 96 } ] ],
	// RFC3056
	[ `6to4`, [ { address: fromHextets(0x20_02, 0, 0, 0, 0, 0, 0, 0), maskLength: 16 } ] ],
	// RFC6052, RFC6146
	[ `teredo`, [ { address: fromHextets(0x20_01, 0, 0, 0, 0, 0, 0, 0), maskLength: 32 } ] ],
	// RFC4291
	[ `reserved`, [ { address: fromHextets(0x20_01, 0xD_B8, 0, 0, 0, 0, 0, 0), maskLength: 32 } ] ],
	[ `benchmarking`, [ { address: fromHextets(0x20_01, 0x2, 0, 0, 0, 0, 0, 0), maskLength: 48 } ] ],
	[ `amt`, [ { address: fromHextets(0x20_01, 0x3, 0, 0, 0, 0, 0, 0), maskLength: 32 } ] ],
	[ `as112v6`, [ { address: fromHextets(0x20_01, 0x4, 0x1_12, 0, 0, 0, 0, 0), maskLength: 48 } ] ],
	[ `deprecated`, [ { address: fromHextets(0x20_01, 0x10, 0, 0, 0, 0, 0, 0), maskLength: 28 } ] ],
	[ `orchid2`, [ { address: fromHextets(0x20_01, 0x20, 0, 0, 0, 0, 0, 0), maskLength: 28 } ] ]
])

/** Checks if the address corresponds to one of the special ranges. */
export const range = (ipv6: IPv6): StringSuggest<Range> => subnetMatch(ipv6, SpecialRanges)
