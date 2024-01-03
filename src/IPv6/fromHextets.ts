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
		expect(fromHextets(0xE_15, 0x41_4D, 0xF5_F1, 0xB2_81, 0x76_22, 0xD_9F, 0xC0_28, 0xDB_D3)).toStrictEqual({
			hextets: new Uint16Array([ 0xE_15, 0x41_4D, 0xF5_F1, 0xB2_81, 0x76_22, 0xD_9F, 0xC0_28, 0xDB_D3 ]),
			zoneId: undefined
		})

		expect(fromHextets(0xF3_62, 0xF5_E8, 0xA6_26, 0x7B_F1, 0x28_8D, 0xD3_D5, 0xA9_FF, 0x36_96, `foo`))
			.toStrictEqual({
				hextets: new Uint16Array([ 0xF3_62, 0xF5_E8, 0xA6_26, 0x7B_F1, 0x28_8D, 0xD3_D5, 0xA9_FF, 0x36_96 ]),
				zoneId: `foo`
			})
	})
}
