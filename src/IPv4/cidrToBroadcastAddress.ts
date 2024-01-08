import { CIDR } from ".."
import type { IPv4 } from "../IPv4"
import { fromBytes } from "./fromBytes"
import { prefixToSubnetMask } from "./prefixToSubnetMask"

/** @returns Broadcast address from {@link cidr}.
  * @example const broadcastAddress = IPv4.cidrToBroadcastAddress(CIDR.from(IPv4.fromBytes(192, 168, 0, 1), 8)) */
export function cidrToBroadcastAddress(cidr: CIDR<IPv4>): IPv4 {
	const subnetMask = prefixToSubnetMask(cidr.prefix)

	for (let index = 4; index--;)
		subnetMask[index] = cidr.address[index]! | (subnetMask[index]! ^ 255)

	return subnetMask
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`cidrToBroadcastAddress()`, () => {
		expect(cidrToBroadcastAddress(CIDR.from(fromBytes(172, 0, 0, 1), 24))).toStrictEqual(fromBytes(172, 0, 0, 255))
		expect(cidrToBroadcastAddress(CIDR.from(fromBytes(172, 0, 0, 1), 26))).toStrictEqual(fromBytes(172, 0, 0, 63))
	})
}
