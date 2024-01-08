import type { IPv6, Prefix } from "../IPv6"
import { fromHextets } from "./fromHextets"

/** A utility function to return subnet mask in IPv6 format given the prefix length */
export function prefixToSubnetMask(prefix: Prefix): IPv6 {
	const subnetMask = fromHextets(0, 0, 0, 0, 0, 0, 0, 0)
	const filledHextetCount = Math.floor(prefix / 16)

	for (let index = 0; index < filledHextetCount; index++)
		subnetMask.hextets[index] = 0xFFFF

	if (filledHextetCount < 32)
		subnetMask.hextets[filledHextetCount] = ((2 ** (prefix % 16)) - 1) << (16 - (prefix % 16))

	return subnetMask
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`prefixToSubnetMask()`, () => {
		expect(prefixToSubnetMask(128))
			.toStrictEqual(fromHextets(0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF))

		expect(prefixToSubnetMask(112))
			.toStrictEqual(fromHextets(0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0))

		expect(prefixToSubnetMask(96))
			.toStrictEqual(fromHextets(0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0, 0))

		expect(prefixToSubnetMask(72))
			.toStrictEqual(fromHextets(0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFF00, 0, 0, 0))

		expect(prefixToSubnetMask(64))
			.toStrictEqual(fromHextets(0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0, 0, 0, 0))

		expect(prefixToSubnetMask(48))
			.toStrictEqual(fromHextets(0xFFFF, 0xFFFF, 0xFFFF, 0, 0, 0, 0, 0))

		expect(prefixToSubnetMask(32))
			.toStrictEqual(fromHextets(0xFFFF, 0xFFFF, 0, 0, 0, 0, 0, 0))

		expect(prefixToSubnetMask(16))
			.toStrictEqual(fromHextets(0xFFFF, 0, 0, 0, 0, 0, 0, 0))

		expect(prefixToSubnetMask(8))
			.toStrictEqual(fromHextets(0xFF00, 0, 0, 0, 0, 0, 0, 0))

		expect(prefixToSubnetMask(4))
			.toStrictEqual(fromHextets(0xF000, 0, 0, 0, 0, 0, 0, 0))

		expect(prefixToSubnetMask(2))
			.toStrictEqual(fromHextets(0xC000, 0, 0, 0, 0, 0, 0, 0))

		expect(prefixToSubnetMask(1))
			.toStrictEqual(fromHextets(0x8000, 0, 0, 0, 0, 0, 0, 0))

		expect(prefixToSubnetMask(0))
			.toStrictEqual(fromHextets(0, 0, 0, 0, 0, 0, 0, 0))
	})
}
