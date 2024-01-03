import { fromBytes, type IPv4 } from "../IPv4"
import { parseCIDR } from "./parseCIDR"
import { subnetMaskFromPrefixLength } from "./subnetMaskFromPrefixLength"

/** @returns Network address from CIDR or `undefined` if invalid. */
export function networkAddressFromCIDR(address: string): IPv4 | undefined {
	const cidr = parseCIDR(address)

	if (cidr) {
		const subnetMaskOctets = subnetMaskFromPrefixLength(cidr.maskLength)

		for (let index = 4; index--;)
			cidr.address[index] &= subnetMaskOctets[index]!

		return cidr.address
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`networkAddressFromCIDR()`, () => {
		expect(networkAddressFromCIDR(`172.0.0.1/24`)).toStrictEqual(fromBytes(172, 0, 0, 0))
		expect(networkAddressFromCIDR(`172.0.0.1/5`)).toStrictEqual(fromBytes(168, 0, 0, 0))
	})
}
