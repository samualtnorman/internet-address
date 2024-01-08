import type { IPv4 } from "../IPv4"
import { IPv6 } from ".."
import { fromBytes } from "./fromBytes"

/** Converts this IPv4 address to an IPv4-mapped IPv6 address. */
export const toIPv6 = (address: IPv4, zoneId?: string): IPv6 => IPv6.fromBytes(
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xFF, 0xFF, ...address as any as [ number, number, number, number ],
	zoneId
)

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`toIPv6()`, () => expect((toIPv6(fromBytes(77, 88, 21, 11))).hextets)
		.toStrictEqual(new Uint16Array([ 0, 0, 0, 0, 0, 0xFFFF, 0x4D58, 0x150B ]))
	)
}
