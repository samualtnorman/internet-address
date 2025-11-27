import type { IPv6 } from "../IPv6"
import * as Hextets from "./Hextets"

export const fromUint16Array = <TArrayBuffer extends ArrayBufferLike>(uint16Array: Uint16Array<TArrayBuffer>, zoneId?: string): IPv6<TArrayBuffer> =>
	({ hextets: Hextets.fromUint16Array(uint16Array), zoneId })
