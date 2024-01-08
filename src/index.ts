import * as CIDR from "./CIDR"
import * as IPv4 from "./IPv4"
import * as IPv6 from "./IPv6"

type IPv4 = IPv4.IPv4
type IPv6 = IPv6.IPv6
type CIDR<T extends IPv4 | IPv6> = CIDR.CIDR<T>

export type Range<T extends IPv4 | IPv6> = T extends IPv4 ? IPv4.Range : IPv6.Range

export { process } from "./process"
export { subnetMatch } from "./subnetMatch"
// eslint-disable-next-line @typescript-eslint/consistent-type-exports
export { CIDR, IPv4, IPv6 }
