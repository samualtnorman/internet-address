import type { IPv4 } from "./common"
import { fromBytes } from "./fromBytes"

/** @returns Subnet mask in IPv4 format given the prefix length */
export function subnetMaskFromPrefixLength(prefix: number): IPv4 {
	if (prefix < 0 || prefix > 32)
		throw Error(`Invalid IPv4 prefix length`)

	const octets: [ number, number, number, number ] = [ 0, 0, 0, 0 ]
	const filledOctetCount = Math.floor(prefix / 8)

	for (let index = filledOctetCount; index--;)
		octets[index] = 0xFF

	if (filledOctetCount < 4)
		octets[filledOctetCount] = (2 ** (prefix % 8)) - 1 << 8 - (prefix % 8)

	return fromBytes(...octets)
}
