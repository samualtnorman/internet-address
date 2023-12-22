import type { IPv6 } from "../IPv6"
import { match } from "./match"

export function matchCIDR(ipv6: IPv6, cidr: CIDR<IPv6>) {
	return match(ipv6, cidr.ip, cidr.bits)
}
