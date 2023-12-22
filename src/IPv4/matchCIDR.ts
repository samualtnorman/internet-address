import type { CIDR } from ".."
import type { IPv4 } from "./common"
import { match } from "./match"

export const matchCIDR = (address: IPv4, cidr: CIDR<IPv4>): boolean => match(address, cidr.ip, cidr.bits)
