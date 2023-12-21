export type IPvXRangeDefaults = "unicast" | "unspecified" | "multicast" | "linkLocal" | "loopback" | "reserved"

// eslint-disable-next-line @typescript-eslint/ban-types
export type StringSuggest<T> = (string & {}) | T

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
