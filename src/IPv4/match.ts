import { matchCIDR } from "../internal"
import type { IPv4 } from "./common"

/** Checks if this address matches other one within given CIDR range. */
export const match = (addressA: IPv4, addressB: IPv4, bits: number): boolean =>
	matchCIDR(addressA, addressB, 8, bits)
