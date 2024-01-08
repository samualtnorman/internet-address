import { CIDR } from ".."
import type { IPv6 } from "../IPv6"
import { fromHextets } from "./fromHextets"
import { prefixToSubnetMask } from "./prefixToSubnetMask"

/** @returns Broadcast adress from parsed CIDR or `undefined` if invalid CIDR string */
export function cidrToBroadcastAddress(cidr: CIDR<IPv6>): IPv6 {
	const subnetMask = prefixToSubnetMask(cidr.prefix)

	for (let index = 16; index--;)
		subnetMask.hextets[index] = cidr.address.hextets[index]! | (subnetMask.hextets[index]! ^ 0xFFFF)

	return subnetMask
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`broadcastAddressFromCIDR()`, () => {
		expect(cidrToBroadcastAddress(CIDR.from(fromHextets(0, 0, 0, 0, 0, 0, 0, 0), 0)))
			.toStrictEqual(fromHextets(0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF))

		expect(cidrToBroadcastAddress(CIDR.from(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 1, 1), 64)))
			.toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF53A, 0x0, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF))

		expect(cidrToBroadcastAddress(CIDR.from(fromHextets(0x2001, 0xDB8, 0xF53B, 0, 0, 0, 1, 1), 48)))
			.toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF53B, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF))

		expect(cidrToBroadcastAddress(CIDR.from(fromHextets(0x2001, 0xDB8, 0xF531, 0, 0, 0, 1, 1), 44)))
			.toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF53F, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF))

		expect(cidrToBroadcastAddress(CIDR.from(fromHextets(0x2001, 0xDB8, 0xF500, 0, 0, 0, 0, 1), 40)))
			.toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF5FF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF))

		expect(cidrToBroadcastAddress(CIDR.from(fromHextets(0x2001, 0xDB8, 0xF500, 0, 0, 0, 0, 1, `z`), 40)))
			.toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF5FF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF))

		expect(cidrToBroadcastAddress(CIDR.from(fromHextets(0x2001, 0xDB9, 0xF500, 0, 0, 0, 0, 1), 40)))
			.toStrictEqual(fromHextets(0x2001, 0xDB9, 0xF5FF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF))

		expect(cidrToBroadcastAddress(CIDR.from(fromHextets(0x2001, 0xDB9, 0xF500, 0, 0, 0, 0, 1, `z`), 40)))
			.toStrictEqual(fromHextets(0x2001, 0xDB9, 0xF5FF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF))

		expect(cidrToBroadcastAddress(CIDR.from(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 1), 128)))
			.toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 1))
	})
}
