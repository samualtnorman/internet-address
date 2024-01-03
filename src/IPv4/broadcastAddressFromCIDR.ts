import type { IPv4 } from "../IPv4"
import { fromBytes } from "./fromBytes"
import { parseCIDR } from "./parseCIDR"
import { subnetMaskFromPrefixLength } from "./subnetMaskFromPrefixLength"

/** @returns Broadcast address from CIDR or `undefined` if invalid. */
export function broadcastAddressFromCIDR(address: string): IPv4 | undefined {
	const cidr = parseCIDR(address)

	if (cidr) {
		const subnetMask = subnetMaskFromPrefixLength(cidr.maskLength)

		for (let index = 4; index--;)
			cidr.address[index] |= subnetMask[index]! ^ 0xFF

		return cidr.address
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`broadcastAddressFromCIDR()`, () => {
		expect(broadcastAddressFromCIDR(`172.0.0.1/24`)).toStrictEqual(fromBytes(172, 0, 0, 255))
		expect(broadcastAddressFromCIDR(`172.0.0.1/26`)).toStrictEqual(fromBytes(172, 0, 0, 63))
	})
}
