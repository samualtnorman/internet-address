import type { IPvXRangeDefaults } from "./internal"

declare const IPv4Tag: unique symbol

export type IPv4 = Uint8Array & { [IPv4Tag]: typeof IPv4Tag }
export type Range = IPvXRangeDefaults | "broadcast" | "carrierGradeNat" | "private"

export type Prefix = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 |
	22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32

export { cidrToBroadcastAddress } from "./IPv4/cidrToBroadcastAddress"
export { cidrToNetworkAddress } from "./IPv4/cidrToNetworkAddress"
export { fromBytes } from "./IPv4/fromBytes"
export { fromUint8Array } from "./IPv4/fromUint8Array"
export { getRange } from "./IPv4/getRange"
export { is } from "./IPv4/is"
export { isValidFourPartDecimal } from "./IPv4/isValidFourPartDecimal"
export { match } from "./IPv4/match"
export { matchCIDR } from "./IPv4/matchCIDR"
export { numberIsPrefix } from "./IPv4/numberIsPrefix"
export { numberToPrefix } from "./IPv4/numberToPrefix"
export { parse } from "./IPv4/parse"
export { parseCIDR } from "./IPv4/parseCIDR"
export { prefixToSubnetMask } from "./IPv4/prefixToSubnetMask"
export { subnetMaskToPrefix } from "./IPv4/subnetMaskToPrefix"
export { toIPv6 } from "./IPv4/toIPv6"
export { toString } from "./IPv4/toString"
