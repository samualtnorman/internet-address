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

// TODO rename to `getRange`

/** Checks if the address corresponds to one of the special ranges. */
export const range = (ipv6: IPv6): StringSuggest<Range> => subnetMatch(ipv6, SpecialRanges)

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`range()`, () => {
		expect(range(fromHextets(0, 0, 0, 0, 0, 0, 0, 0))).toBe(`unspecified`)
		expect(range(fromHextets(0xFE_80, 0, 0, 0, 0x12_34, 0x56_78, 0xAB_CD, 0x01_23))).toBe(`linkLocal`)
		expect(range(fromHextets(0xFF_00, 0, 0, 0, 0, 0, 0, 0x12_34))).toBe(`multicast`)
		expect(range(fromHextets(0, 0, 0, 0, 0, 0, 0, 1))).toBe(`loopback`)
		expect(range(fromHextets(0xFC_00, 0, 0, 0, 0, 0, 0, 0))).toBe(`uniqueLocal`)
		expect(range(fromHextets(0, 0, 0, 0, 0, 0xFF_FF, 0xC0_A8, 0x1_0A))).toBe(`ipv4Mapped`)
		expect(range(fromHextets(0, 0, 0, 0, 0xFF_FF, 0, 0xC0_A8, 0x1_0A))).toBe(`rfc6145`)
		expect(range(fromHextets(0x20_02, 0x1F_63, 0x45_E8, 0, 0, 0, 0, 1))).toBe(`6to4`)
		expect(range(fromHextets(0x20_01, 0, 0, 0, 0, 0, 0, 0x42_42))).toBe(`teredo`)
		expect(range(fromHextets(0x20_01, 2, 0, 0, 0, 0, 0, 0))).toBe(`benchmarking`)
		expect(range(fromHextets(0x20_01, 3, 0, 0, 0, 0, 0, 0))).toBe(`amt`)
		expect(range(fromHextets(0x20_01, 0x10, 0, 0, 0, 0, 0, 0))).toBe(`deprecated`)
		expect(range(fromHextets(0x20_01, 0x20, 0, 0, 0, 0, 0, 0))).toBe(`orchid2`)
		expect(range(fromHextets(0x20_01, 0xD_B8, 0, 0, 0, 0, 0, 0x32_10))).toBe(`reserved`)
		expect(range(fromHextets(0x20_01, 0x4_70, 8, 0x66, 0, 0, 0, 1))).toBe(`unicast`)
		expect(range(fromHextets(0x20_01, 0x4_70, 8, 0x66, 0, 0, 0, 1, `z`))).toBe(`unicast`)
	})
}
