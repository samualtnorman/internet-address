import type { IPv6 } from "../IPv6"
import { parseCIDR } from "./parseCIDR"
import { subnetMaskFromPrefixLength } from "./subnetMaskFromPrefixLength"
import { fromHextets } from "./fromHextets"

/** @returns Broadcast adress from parsed CIDR or `undefined` if invalid CIDR string */
export function broadcastAddressFromCIDR(address: string): IPv6 | undefined {
	const cidr = parseCIDR(address)

	if (cidr) {
		const subnetMask = subnetMaskFromPrefixLength(cidr.maskLength)

		cidr.address.zoneId = undefined

		for (let index = 16; index--;)
			cidr.address.hextets[index] |= subnetMask.hextets[index]! ^ 0xFF_FF

		return cidr.address
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`broadcastAddressFromCIDR()`, () => {
		expect(broadcastAddressFromCIDR(`::/0`))
			.toStrictEqual(fromHextets(0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF))

		expect(broadcastAddressFromCIDR(`2001:db8:f53a::1:1/64`))
			.toStrictEqual(fromHextets(0x20_01, 0xD_B8, 0xF5_3A, 0x0, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF))

		expect(broadcastAddressFromCIDR(`2001:db8:f53b::1:1/48`))
			.toStrictEqual(fromHextets(0x20_01, 0xD_B8, 0xF5_3B, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF))

		expect(broadcastAddressFromCIDR(`2001:db8:f531::1:1/44`))
			.toStrictEqual(fromHextets(0x20_01, 0xD_B8, 0xF5_3F, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF))

		expect(broadcastAddressFromCIDR(`2001:db8:f500::1/40`))
			.toStrictEqual(fromHextets(0x20_01, 0xD_B8, 0xF5_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF))

		expect(broadcastAddressFromCIDR(`2001:db8:f500::1%z/40`))
			.toStrictEqual(fromHextets(0x20_01, 0xD_B8, 0xF5_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF))

		expect(broadcastAddressFromCIDR(`2001:db9:f500::1/40`))
			.toStrictEqual(fromHextets(0x20_01, 0xD_B9, 0xF5_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF))

		expect(broadcastAddressFromCIDR(`2001:db9:f500::1%z/40`))
			.toStrictEqual(fromHextets(0x20_01, 0xD_B9, 0xF5_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF, 0xFF_FF))

		expect(broadcastAddressFromCIDR(`2001:db8:f53a::1/128`))
			.toStrictEqual(fromHextets(0x20_01, 0xD_B8, 0xF5_3A, 0, 0, 0, 0, 1))
	})
}
