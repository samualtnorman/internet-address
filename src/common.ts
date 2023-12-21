import { IPv4 } from "."
import { IPv6, type IPv6Range } from "./IPv6"

export type IPvXRangeDefaults = "unicast" | "unspecified" | "multicast" | "linkLocal" | "loopback" | "reserved"

// eslint-disable-next-line @typescript-eslint/ban-types
export type StringSuggest<T> = (string & {}) | T

export type RangeList<T extends IPv4 | IPv6> = Map<StringSuggest<T extends IPv4 ? IPv4.Range : IPv6Range>, CIDR<T>[]>

export class CIDR<IP extends IPv4 | IPv6> {
	constructor(public ip: IP, public bits: number) {}

	toString() {
		return `${IPv4.is(this.ip) ? IPv4.toString(this.ip) : this.ip.toString()}/${this.bits}`
	}
}

/** A generic CIDR (Classless Inter-Domain Routing) RFC1518 range matcher. */
export function matchCIDR(first: { [index: number]: number, length: number }, second: { [index: number]: number, length: number }, partSize: number, cidrBits: number) {
	if (first.length != second.length)
		throw Error(`Cannot match CIDR for objects with different lengths`)

	for (let part = 0; cidrBits > 0; part += 1) {
		const shift = Math.max(partSize - cidrBits, 0)

		if (first[part]! >> shift != second[part]! >> shift)
			return false

		cidrBits -= partSize
	}

	return true
}

/** A utility function to ease named range matching. See examples below.
  * rangeList can contain both IPv4 and IPv6 subnet entries and will not throw errors
  * on matching IPv4 addresses to IPv6 ranges or vice versa. */
export function subnetMatch<T extends IPv4 | IPv6>(
	address: T,
	rangeList: RangeList<T>,
	defaultName: StringSuggest<T extends IPv4 ? IPv4.Range : IPv6Range> = `unicast`
): StringSuggest<T extends IPv4 ? IPv4.Range : IPv6Range> {
	if (IPv4.is(address)) {
		for (const [ rangeName, rangeSubnets ] of rangeList) {
			for (const subnet of rangeSubnets) {
				if (IPv4.is(subnet.ip) && IPv4.match(address, subnet.ip, subnet.bits))
					return rangeName
			}
		}
	} else {
		for (const [ rangeName, rangeSubnets ] of rangeList) {
			for (const subnet of rangeSubnets) {
				if (subnet.ip instanceof IPv6 && address.match(subnet.ip, subnet.bits))
					return rangeName
			}
		}
	}

	return defaultName
}
