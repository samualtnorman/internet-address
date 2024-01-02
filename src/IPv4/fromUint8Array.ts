import type { IPv4 } from "../IPv4"
import { is } from "./is"

export function fromUint8Array(u8View: Uint8Array): IPv4 {
	if (is(u8View))
		return u8View

	throw Error(`Uint8Array should have a length of 4`)
}
