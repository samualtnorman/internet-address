import * as IPv4 from "../IPv4"
import type { IPv6 } from "../IPv6"
import { getRange } from "./getRange"

/** @returns IPv4 address of IPv4-mapped IPv6 address or `undefined` if it is not. */
export function toIPv4(ipv6: IPv6): IPv4.IPv4 | undefined {
	if (getRange(ipv6) == `ipv4Mapped`) {
		const u8View = new Uint8Array(ipv6.hextets.buffer)

		return IPv4.fromBytes(u8View[13]!, u8View[12]!, u8View[15]!, u8View[14]!)
	}
}
