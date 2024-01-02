import { Hextets } from "./IPv6/Hextets"
import { IPvXRangeDefaults } from "./internal"

export type Range = IPvXRangeDefaults | "uniqueLocal" | "ipv4Mapped" | "rfc6145" | "rfc6052" | "6to4" | "teredo"

/** An IPv6 address. */
export type IPv6 = { hextets: Hextets, zoneId: string | undefined }

export * as Hextets from "./IPv6/Hextets"
export { broadcastAddressFromCIDR } from "./IPv6/broadcastAddressFromCIDR"
export { fromBytes } from "./IPv6/fromBytes"
export { fromHextets } from "./IPv6/fromHextets"
export { match } from "./IPv6/match"
export { matchCIDR } from "./IPv6/matchCIDR"
export { networkAddressFromCIDR } from "./IPv6/networkAddressFromCIDR"
export { parse } from "./IPv6/parse"
export { parseCIDR } from "./IPv6/parseCIDR"
export { prefixLengthFromSubnetMask } from "./IPv6/prefixLengthFromSubnetMask"
export { range } from "./IPv6/range"
export { subnetMaskFromPrefixLength } from "./IPv6/subnetMaskFromPrefixLength"
export { toFixedLengthString } from "./IPv6/toFixedLengthString"
export { toIPv4Address } from "./IPv6/toIPv4Address"
export { toString } from "./IPv6/toString"
