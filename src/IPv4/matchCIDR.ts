import type { CIDR } from "../CIDR"
import type { IPv4 } from "../IPv4"
import { match } from "./match"

export const matchCIDR = (address: IPv4, cidr: CIDR<IPv4>): boolean => match(address, cidr.address, cidr.prefix)
