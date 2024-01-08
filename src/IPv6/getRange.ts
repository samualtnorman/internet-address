import type { RangeList } from "../CIDR"
import * as CIDR from "../CIDR"
import type { IPv6, Range } from "../IPv6"
import type { StringSuggest } from "../internal"
import { subnetMatch } from "../subnetMatch"
import { fromHextets } from "./fromHextets"

/** Special IPv6 ranges */
const SpecialRanges: RangeList<IPv6> = new Map([
	// RFC4291, here and after
	[ `unspecified`, [ CIDR.from(fromHextets(0, 0, 0, 0, 0, 0, 0, 0), 128) ] ],
	[ `linkLocal`, [ CIDR.from(fromHextets(0xFE80, 0, 0, 0, 0, 0, 0, 0), 10) ] ],
	[ `multicast`, [ CIDR.from(fromHextets(0xFF00, 0, 0, 0, 0, 0, 0, 0), 8) ] ],
	[ `loopback`, [ CIDR.from(fromHextets(0, 0, 0, 0, 0, 0, 0, 1), 128) ] ],
	[ `uniqueLocal`, [ CIDR.from(fromHextets(0xFC00, 0, 0, 0, 0, 0, 0, 0), 7) ] ],
	[ `ipv4Mapped`, [ CIDR.from(fromHextets(0, 0, 0, 0, 0, 0xFFFF, 0, 0), 96) ] ],
	// RFC6145
	[ `rfc6145`, [ CIDR.from(fromHextets(0, 0, 0, 0, 0xFFFF, 0, 0, 0), 96) ] ],
	// RFC6052
	[ `rfc6052`, [ CIDR.from(fromHextets(0x64, 0xFF9B, 0, 0, 0, 0, 0, 0), 96) ] ],
	// RFC3056
	[ `6to4`, [ CIDR.from(fromHextets(0x2002, 0, 0, 0, 0, 0, 0, 0), 16) ] ],
	// RFC6052, RFC6146
	[ `teredo`, [ CIDR.from(fromHextets(0x2001, 0, 0, 0, 0, 0, 0, 0), 32) ] ],
	// RFC4291
	[ `reserved`, [ CIDR.from(fromHextets(0x2001, 0xDB8, 0, 0, 0, 0, 0, 0), 32) ] ],
	[ `benchmarking`, [ CIDR.from(fromHextets(0x2001, 0x2, 0, 0, 0, 0, 0, 0), 48) ] ],
	[ `amt`, [ CIDR.from(fromHextets(0x2001, 0x3, 0, 0, 0, 0, 0, 0), 32) ] ],
	[ `as112v6`, [ CIDR.from(fromHextets(0x2001, 0x4, 0x112, 0, 0, 0, 0, 0), 48) ] ],
	[ `deprecated`, [ CIDR.from(fromHextets(0x2001, 0x10, 0, 0, 0, 0, 0, 0), 28) ] ],
	[ `orchid2`, [ CIDR.from(fromHextets(0x2001, 0x20, 0, 0, 0, 0, 0, 0), 28) ] ]
])

/** Checks if the address corresponds to one of the special ranges. */
export const getRange = (ipv6: IPv6): StringSuggest<Range> => subnetMatch(ipv6, SpecialRanges)

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`range()`, () => {
		expect(getRange(fromHextets(0, 0, 0, 0, 0, 0, 0, 0))).toBe(`unspecified`)
		expect(getRange(fromHextets(0xFE80, 0, 0, 0, 0x1234, 0x5678, 0xABCD, 0x0123))).toBe(`linkLocal`)
		expect(getRange(fromHextets(0xFF00, 0, 0, 0, 0, 0, 0, 0x1234))).toBe(`multicast`)
		expect(getRange(fromHextets(0, 0, 0, 0, 0, 0, 0, 1))).toBe(`loopback`)
		expect(getRange(fromHextets(0xFC00, 0, 0, 0, 0, 0, 0, 0))).toBe(`uniqueLocal`)
		expect(getRange(fromHextets(0, 0, 0, 0, 0, 0xFFFF, 0xC0A8, 0x10A))).toBe(`ipv4Mapped`)
		expect(getRange(fromHextets(0, 0, 0, 0, 0xFFFF, 0, 0xC0A8, 0x10A))).toBe(`rfc6145`)
		expect(getRange(fromHextets(0x2002, 0x1F63, 0x45E8, 0, 0, 0, 0, 1))).toBe(`6to4`)
		expect(getRange(fromHextets(0x2001, 0, 0, 0, 0, 0, 0, 0x4242))).toBe(`teredo`)
		expect(getRange(fromHextets(0x2001, 2, 0, 0, 0, 0, 0, 0))).toBe(`benchmarking`)
		expect(getRange(fromHextets(0x2001, 3, 0, 0, 0, 0, 0, 0))).toBe(`amt`)
		expect(getRange(fromHextets(0x2001, 0x10, 0, 0, 0, 0, 0, 0))).toBe(`deprecated`)
		expect(getRange(fromHextets(0x2001, 0x20, 0, 0, 0, 0, 0, 0))).toBe(`orchid2`)
		expect(getRange(fromHextets(0x2001, 0xDB8, 0, 0, 0, 0, 0, 0x3210))).toBe(`reserved`)
		expect(getRange(fromHextets(0x2001, 0x470, 8, 0x66, 0, 0, 0, 1))).toBe(`unicast`)
		expect(getRange(fromHextets(0x2001, 0x470, 8, 0x66, 0, 0, 0, 1, `z`))).toBe(`unicast`)
	})
}
