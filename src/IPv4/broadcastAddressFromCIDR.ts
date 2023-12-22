import type { IPv4 } from "./common"
import { parseCIDR } from "./parseCIDR"
import { subnetMaskFromPrefixLength } from "./subnetMaskFromPrefixLength"

/** @returns Broadcast address from CIDR or `undefined` if invalid. */
export function broadcastAddressFromCIDR(address: string): IPv4 | undefined {
	const cidr = parseCIDR(address)

	if (cidr) {
		const subnetMask = subnetMaskFromPrefixLength(cidr.bits)

		for (let index = 4; index--;)
			cidr.ip[index] |= subnetMask[index]! ^ 0xFF

		return cidr.ip
	}
}
