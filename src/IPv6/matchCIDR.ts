import type { CIDR } from "../CIDR"
import type { IPv6 } from "../IPv6"
import { match } from "./match"

export const matchCIDR = (ipv6: IPv6, cidr: CIDR<IPv6>) => match(ipv6, cidr.ip, cidr.maskLength)
