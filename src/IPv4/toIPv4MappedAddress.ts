import type { IPv4 } from "../IPv4"
import * as IPv6 from "../IPv6"
import { fromBytes } from "./fromBytes"

/** Converts this IPv4 address to an IPv4-mapped IPv6 address. */
export const toIPv4MappedAddress = (address: IPv4, zoneId?: string): IPv6.IPv6 => IPv6.fromBytes(
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xFF, 0xFF, ...address as any as [ number, number, number, number ],
	zoneId
)

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`toIPv4MappedAddress()`, () => expect((toIPv4MappedAddress(fromBytes(77, 88, 21, 11))).hextets)
		.toStrictEqual(new Uint16Array([ 0, 0, 0, 0, 0, 0xFF_FF, 0x4D_58, 0x15_0B ]))
	)
}
