import type { CIDR } from "../CIDR"
import { fromBytes, type IPv4 } from "../IPv4"
import { prefixToSubnetMask } from "./prefixToSubnetMask"

/** @returns Network address from {@link cidr}.
  * @example const broadcastAddress = IPv4.cidrToNetworkAddress(CIDR.from(IPv4.fromBytes(192, 168, 0, 1), 8)) */
export function cidrToNetworkAddress(cidr: CIDR<IPv4>): IPv4 {
	const subnetMask = prefixToSubnetMask(cidr.prefix)

	for (let index = 4; index--;)
		subnetMask[index]! &= cidr.address[index]!

	return subnetMask
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`cidrToNetworkAddress()`, () => {
		expect(cidrToNetworkAddress({ address: fromBytes(172, 0, 0, 1), prefix: 24 }))
			.toStrictEqual(fromBytes(172, 0, 0, 0))

		expect(cidrToNetworkAddress({ address: fromBytes(172, 0, 0, 1), prefix: 5 }))
			.toStrictEqual(fromBytes(168, 0, 0, 0))
	})
}
