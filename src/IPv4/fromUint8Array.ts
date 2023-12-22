import type { IPv4 } from "./common"

export function fromUint8Array(u8View: Uint8Array): IPv4 {
	if (u8View.length != 4)
		throw Error(`Uint8Array should have a length of 4`)

	return u8View as IPv4
}
