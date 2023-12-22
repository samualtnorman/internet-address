import { Hextets } from "./IPv6/Hextets"
import { IPvXRangeDefaults } from "./internal"

export type Range = IPvXRangeDefaults | "uniqueLocal" | "ipv4Mapped" | "rfc6145" | "rfc6052" | "6to4" | "teredo"

/** An IPv6 address. */
export type IPv6 = { hextets: Hextets, zoneId: string | undefined }
