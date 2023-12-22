import type { IPv6 } from "../IPv6"
import { matchCIDR } from "../internal"

/** Checks if this address matches other one within given CIDR range. */
export const match = (ipv6A: IPv6, ipv6B: IPv6, bits: number): boolean =>
	matchCIDR(ipv6A.hextets, ipv6B.hextets, 16, bits)
