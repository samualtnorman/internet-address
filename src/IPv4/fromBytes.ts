import type { IPv4 } from "./common"
import { fromUint8Array } from "./fromUint8Array"

export const fromBytes = (byte0: number, byte1: number, byte2: number, byte3: number): IPv4 =>
	fromUint8Array(new Uint8Array([ byte0, byte1, byte2, byte3 ]))
