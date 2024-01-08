import * as IPv4 from "../IPv4"
import type { IPv6 } from "../IPv6"
import { fromHextets } from "./fromHextets"
import { getRange } from "./getRange"

/** @returns IPv4 address of IPv4-mapped IPv6 address or `undefined` if it is not. */
export function toIPv4(address: IPv6): IPv4.IPv4 | undefined {
	if (getRange(address) == `ipv4Mapped`) {
		const u8View = new Uint8Array(address.hextets.buffer)

		return IPv4.fromBytes(u8View[13]!, u8View[12]!, u8View[15]!, u8View[14]!)
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`toIPv4()`, () => {
		expect(toIPv4(fromHextets(0, 0, 0, 0, 0, 0xFFFF, 0x4D58, 0x150B))).toStrictEqual(IPv4.fromBytes(77, 88, 21, 11))
		expect(toIPv4(fromHextets(0xB828, 0x5881, 0xF628, 0xDB64, 0xBD14, 0xE05, 0xCEB8, 0x11EF))).toBeUndefined()
		expect(toIPv4(fromHextets(0x2001, 0xDB8, 0, 0, 0, 0, 0, 1))).toBeUndefined()
	})
}
