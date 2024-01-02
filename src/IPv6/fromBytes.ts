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
