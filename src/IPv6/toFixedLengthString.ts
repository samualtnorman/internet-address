import type { IPv6 } from "../IPv6"

/** Returns the address in expanded format with all zeros included, like
  * `2001:0db8:0008:0066:0000:0000:0000:0001`. */
export const toFixedLengthString = (ipv6: IPv6): string =>
	[ ...ipv6.hextets ].map(part => part.toString(16).padStart(4, `0`)).join(`:`) +
		(ipv6.zoneId ? `%${ipv6.zoneId}` : ``)
