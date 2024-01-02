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
