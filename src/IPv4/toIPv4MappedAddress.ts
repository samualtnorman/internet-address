import type { IPv4 } from "../IPv4"
import * as IPv6 from "../IPv6"

/** Converts this IPv4 address to an IPv4-mapped IPv6 address. */
export const toIPv4MappedAddress = (address: IPv4, zoneId?: string): IPv6.IPv6 => IPv6.fromBytes(
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xFF, 0xFF, ...address as any as [ number, number, number, number ],
	zoneId
)
