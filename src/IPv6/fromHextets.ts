import type { IPv6 } from "../IPv6"
import * as Hextets from "./Hextets"

/** @returns An {@link IPv6} object from a series of hextets and an optional {@link zoneId}. */
export const fromHextets = (
	hextet0: number, hextet1: number, hextet2: number, hextet3: number, hextet4: number, hextet5: number,
	hextet6: number, hextet7: number, zoneId?: string
): IPv6 => ({
	hextets: Hextets.fromUint16Array(
		new Uint16Array([ hextet0, hextet1, hextet2, hextet3, hextet4, hextet5, hextet6, hextet7 ])
	),
	zoneId
})

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`fromBytes()`, () => {
		expect(fromHextets(0xE15, 0x414D, 0xF5F1, 0xB281, 0x7622, 0xD9F, 0xC028, 0xDBD3)).toStrictEqual({
			hextets: new Uint16Array([ 0xE15, 0x414D, 0xF5F1, 0xB281, 0x7622, 0xD9F, 0xC028, 0xDBD3 ]),
			zoneId: undefined
		})

		expect(fromHextets(0xF362, 0xF5E8, 0xA626, 0x7BF1, 0x288D, 0xD3D5, 0xA9FF, 0x3696, `foo`))
			.toStrictEqual({
				hextets: new Uint16Array([ 0xF362, 0xF5E8, 0xA626, 0x7BF1, 0x288D, 0xD3D5, 0xA9FF, 0x3696 ]),
				zoneId: `foo`
			})
	})
}
