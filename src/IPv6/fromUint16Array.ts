import type { IPv6 } from "../IPv6"
import * as Hextets from "./Hextets"

export const fromUint16Array = (uint16Array: Uint16Array, zoneId?: string): IPv6 =>
	({ hextets: Hextets.fromUint16Array(uint16Array), zoneId })
