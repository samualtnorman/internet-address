import type { IPv6 } from "../IPv6"
import * as Hextets from "./Hextets"

/** @returns An {@link IPv6} object from a series of bytes and an optional {@link zoneId}. */
export const fromBytes = (
	byte0: number, byte1: number, byte2: number, byte3: number, byte4: number, byte5: number, byte6: number,
	byte7: number, byte8: number, byte9: number, byte10: number, byte11: number, byte12: number, byte13: number,
	byte14: number, byte15: number, zoneId?: string
): IPv6 => ({
	hextets: Hextets.fromUint16Array(new Uint16Array(new Uint8Array([
		byte1, byte0, byte3, byte2, byte5, byte4, byte7, byte6, byte9,
		byte8, byte11, byte10, byte13, byte12, byte15, byte14
	]).buffer)),
	zoneId
})

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`fromBytes()`, () => {
		expect(fromBytes(38, 113, 243, 182, 152, 232, 15, 25, 130, 134, 251, 156, 225, 234, 34, 103)).toStrictEqual({
			hextets: new Uint16Array([ 0x2671, 0xF3B6, 0x98E8, 0xF19, 0x8286, 0xFB9C, 0xE1EA, 0x2267 ]),
			zoneId: undefined
		})

		expect(fromBytes(189, 246, 221, 148, 201, 140, 71, 36, 32, 133, 174, 79, 242, 229, 156, 238, `foo`))
			.toStrictEqual({
				hextets: new Uint16Array([ 0xBDF6, 0xDD94, 0xC98C, 0x4724, 0x2085, 0xAE4F, 0xF2E5, 0x9CEE ]),
				zoneId: `foo`
			})
	})
}
