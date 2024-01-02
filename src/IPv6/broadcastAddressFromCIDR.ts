import type { IPv6 } from "../IPv6"
import { parseCIDR } from "./parseCIDR"
import { subnetMaskFromPrefixLength } from "./subnetMaskFromPrefixLength"

/** @returns Broadcast adress from parsed CIDR or `undefined` if invalid CIDR string */
export function broadcastAddressFromCIDR(address: string): IPv6 | undefined {
	const cidr = parseCIDR(address)

	if (cidr) {
		const subnetMask = subnetMaskFromPrefixLength(cidr.maskLength)

		cidr.ip.zoneId = undefined

		for (let index = 16; index--;)
			cidr.ip.hextets[index] |= subnetMask.hextets[index]! ^ 0xFF_FF

		return cidr.ip
	}
}
