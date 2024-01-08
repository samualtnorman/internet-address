import * as Hextets from "./IPv6/Hextets"
import type { IPvXRangeDefaults } from "./internal"

type Hextets = Hextets.Hextets

export type Range = IPvXRangeDefaults | "uniqueLocal" | "ipv4Mapped" | "rfc6145" | "rfc6052" | "6to4" | "teredo" |
	"benchmarking" | "amt" | "as112v6" | "deprecated" | "orchid2"

/** An IPv6 address. */
export type IPv6 = { hextets: Hextets, zoneId: string | undefined }

export type Prefix = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 |
	22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 |
	45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 62 | 63 | 64 | 65 | 66 | 67 |
	68 | 69 | 70 | 71 | 72 | 73 | 74 | 75 | 76 | 77 | 78 | 79 | 80 | 81 | 82 | 83 | 84 | 85 | 86 | 87 | 88 | 89 | 90 |
	91 | 92 | 93 | 94 | 95 | 96 | 97 | 98 | 99 | 100 | 101 | 102 | 103 | 104 | 105 | 106 | 107 | 108 | 109 | 110 | 111 |
	112 | 113 | 114 | 115 | 116 | 117 | 118 | 119 | 120 | 121 | 122 | 123 | 124 | 125 | 126 | 127 | 128

export { cidrToBroadcastAddress } from "./IPv6/cidrToBroadcastAddress"
export { cidrToNetworkAddress } from "./IPv6/cidrToNetworkAddress"
export { fromBytes } from "./IPv6/fromBytes"
export { fromHextets } from "./IPv6/fromHextets"
export { fromUint16Array } from "./IPv6/fromUint16Array"
export { getRange } from "./IPv6/getRange"
export { match } from "./IPv6/match"
export { matchCIDR } from "./IPv6/matchCIDR"
export { numberIsPrefix } from "./IPv6/numberIsPrefix"
export { numberToPrefix } from "./IPv6/numberToPrefix"
export { parse } from "./IPv6/parse"
export { parseCIDR } from "./IPv6/parseCIDR"
export { prefixToSubnetMask } from "./IPv6/prefixToSubnetMask"
export { subnetMaskToPrefix } from "./IPv6/subnetMaskToPrefix"
export { toFixedLengthString } from "./IPv6/toFixedLengthString"
export { toIPv4 } from "./IPv6/toIPv4"
export { toString } from "./IPv6/toString"
// eslint-disable-next-line @typescript-eslint/consistent-type-exports
export { Hextets }
