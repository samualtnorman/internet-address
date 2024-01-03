import * as IPv4 from "./IPv4"
import * as IPv6 from "./IPv6"
import * as CIDR from "./CIDR"

type IPv4 = IPv4.IPv4
type IPv6 = IPv6.IPv6
type CIDR<IP extends IPv4 | IPv6> = CIDR.CIDR<IP>

// eslint-disable-next-line @typescript-eslint/consistent-type-exports
export { IPv4, IPv6, CIDR }
export { process } from "./process"
export { subnetMatch } from "./subnetMatch"
