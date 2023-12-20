import { IPv4 } from "./IPv4"
import { IPv6 } from "./IPv6"
import type { CIDR } from "./common"

/** Try to parse an array in network order (MSB first) for IPv4 and IPv6. */
export function fromByteArray(bytes: number[]): IPv4 | IPv6 {
	if (bytes.length == 4)
		return IPv4.fromBytes(...bytes as [ number, number, number, number ])

	if (bytes.length == 16)
		return IPv6.fromBytes(...bytes as [ number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number ])

	throw Error(`The binary input is neither an IPv6 nor IPv4 address`)
}

/** Checks if the address is valid IP address. */
export function isValid(address: string): boolean {
	return IPv6.isValid(address) || IPv4.isValid(address)
}

/** Attempts to parse an IP Address, first through IPv6 then IPv4.
  * Throws an error if it could not be parsed. */
export function parse(address: string): IPv4 | IPv6 {
	if (IPv6.isValid(address))
		return IPv6.parse(address)

	if (IPv4.isValid(address))
		return IPv4.parse(address)

	throw Error(`The address has neither IPv6 nor IPv4 format`)
}

/** Attempt to parse CIDR notation, first through IPv6 then IPv4.
  * Throws an error if it could not be parsed. */
export function parseCIDR(mask: string): CIDR<IPv4 | IPv6> {
	try {
		return IPv6.parseCIDR(mask)
	} catch {
		try {
			return IPv4.parseCIDR(mask)
		} catch {
			throw Error(`The address has neither IPv6 nor IPv4 CIDR format`)
		}
	}
}

/** Parse an address and return plain IPv4 address if it is an IPv4-mapped address. */
export function process(address: string): IPv4 | IPv6 {
	const parsedAddress = parse(address)

	if (parsedAddress instanceof IPv6 && parsedAddress.isIPv4MappedAddress())
		return parsedAddress.toIPv4Address()

	return parsedAddress
}
