import { fromHextets, type IPv6 } from "../IPv6"
import { prefixToSubnetMask } from "./prefixToSubnetMask"
import { CIDR } from "../default"

/** @returns An {@link IPv6} from {@link CIDR} */
export function cidrToNetworkAddress(cidr: CIDR<IPv6>): IPv6 {
	const subnetMask = prefixToSubnetMask(cidr.prefix)

	cidr.address.zoneId = undefined

	for (let index = 16; index--;)
		cidr.address.hextets[index]! &= subnetMask.hextets[index]!

	return cidr.address
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`networkAddressFromCIDR()`, () => {
		expect(cidrToNetworkAddress(CIDR.from(fromHextets(0, 0, 0, 0, 0, 0, 0, 0), 0)))
			.toStrictEqual(fromHextets(0, 0, 0, 0, 0, 0, 0, 0))

		expect(cidrToNetworkAddress(CIDR.from(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 1, 1), 64)))
			.toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 0))

		expect(cidrToNetworkAddress(CIDR.from(fromHextets(0x2001, 0xDB8, 0xF53B, 0, 0, 0, 1, 1), 48)))
			.toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF53B, 0, 0, 0, 0, 0))

		expect(cidrToNetworkAddress(CIDR.from(fromHextets(0x2001, 0xDB8, 0xF531, 0, 0, 0, 1, 1), 44)))
			.toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF530, 0, 0, 0, 0, 0))

		expect(cidrToNetworkAddress(CIDR.from(fromHextets(0x2001, 0xDB8, 0xF500, 0, 0, 0, 0, 1), 40)))
			.toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF500, 0, 0, 0, 0, 0))

		expect(cidrToNetworkAddress(CIDR.from(fromHextets(0x2001, 0xDB8, 0xF500, 0, 0, 0, 0, 1, `z`), 40)))
			.toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF500, 0, 0, 0, 0, 0))

		expect(cidrToNetworkAddress(CIDR.from(fromHextets(0x2001, 0xDB9, 0xF500, 0, 0, 0, 0, 1), 40)))
			.toStrictEqual(fromHextets(0x2001, 0xDB9, 0xF500, 0, 0, 0, 0, 0))

		expect(cidrToNetworkAddress(CIDR.from(fromHextets(0x2001, 0xDB9, 0xF500, 0, 0, 0, 0, 1, `z`), 40)))
			.toStrictEqual(fromHextets(0x2001, 0xDB9, 0xF500, 0, 0, 0, 0, 0))

		expect(cidrToNetworkAddress(CIDR.from(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 1), 128)))
			.toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 1))
	})
}
