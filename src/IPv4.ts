import type { IPvXRangeDefaults } from "./internal"

declare const IPv4Tag: unique symbol

export type IPv4 = Uint8Array & { [IPv4Tag]: typeof IPv4Tag }
export type Range = IPvXRangeDefaults | "broadcast" | "carrierGradeNat" | "private"

export { broadcastAddressFromCIDR } from "./IPv4/broadcastAddressFromCIDR"
export { fromBytes } from "./IPv4/fromBytes"
export { fromUint8Array } from "./IPv4/fromUint8Array"
export { is } from "./IPv4/is"
export { isValidFourPartDecimal } from "./IPv4/isValidFourPartDecimal"
export { match } from "./IPv4/match"
export { matchCIDR } from "./IPv4/matchCIDR"
export { networkAddressFromCIDR } from "./IPv4/networkAddressFromCIDR"
export { parse } from "./IPv4/parse"
export { parseCIDR } from "./IPv4/parseCIDR"
export { prefixLengthFromSubnetMask } from "./IPv4/prefixLengthFromSubnetMask"
export { range } from "./IPv4/range"
export { subnetMaskFromPrefixLength } from "./IPv4/subnetMaskFromPrefixLength"
export { toIPv4MappedAddress } from "./IPv4/toIPv4MappedAddress"
export { toString } from "./IPv4/toString"
