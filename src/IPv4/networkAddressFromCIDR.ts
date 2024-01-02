import type { IPv4 } from "../IPv4"
import { parseCIDR } from "./parseCIDR"
import { subnetMaskFromPrefixLength } from "./subnetMaskFromPrefixLength"

/** @returns Network address from CIDR or `undefined` if invalid. */
export function networkAddressFromCIDR(address: string): IPv4 | undefined {
	const cidr = parseCIDR(address)

	if (cidr) {
		const subnetMaskOctets = subnetMaskFromPrefixLength(cidr.maskLength)

		for (let index = 4; index--;)
			cidr.ip[index] &= subnetMaskOctets[index]!

		return cidr.ip
	}
}
