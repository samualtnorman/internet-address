import type { IPv6 } from "../IPv6"

/** @returns The address in expanded format with all zeros included, like `2001:db8:8:66:0:0:0:1`.
  * @deprecated Use {@link toFixedLengthString()} instead. */
export function toNormalizedString(ipv6: IPv6): string {
	return `${[ ...ipv6.hextets ].map(hextet => hextet.toString(16)).join(`:`)}${
		ipv6.zoneId ? `%${ipv6.zoneId}` : ``}`
}
