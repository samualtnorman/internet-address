import type { IPv4 } from "../IPv4"
import type { Prefix } from "../IPv6"
import { fromBytes } from "./fromBytes"

/** @returns Subnet mask in IPv4 format given the prefix length */
export function prefixToSubnetMask(prefix: Prefix): IPv4 {
	const address = fromBytes(0, 0, 0, 0)
	const filledOctetCount = Math.floor(prefix / 8)

	for (let index = filledOctetCount; index--;)
		address[index] = 0xFF

	if (filledOctetCount < 4)
		address[filledOctetCount] = (2 ** (prefix % 8)) - 1 << 8 - (prefix % 8)

	return address
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`subnetMaskFromPrefixLength()`, () => {
		expect(prefixToSubnetMask(0)).toStrictEqual(fromBytes(0, 0, 0, 0))
		expect(prefixToSubnetMask(1)).toStrictEqual(fromBytes(128, 0, 0, 0))
		expect(prefixToSubnetMask(2)).toStrictEqual(fromBytes(192, 0, 0, 0))
		expect(prefixToSubnetMask(3)).toStrictEqual(fromBytes(224, 0, 0, 0))
		expect(prefixToSubnetMask(4)).toStrictEqual(fromBytes(240, 0, 0, 0))
		expect(prefixToSubnetMask(5)).toStrictEqual(fromBytes(248, 0, 0, 0))
		expect(prefixToSubnetMask(6)).toStrictEqual(fromBytes(252, 0, 0, 0))
		expect(prefixToSubnetMask(7)).toStrictEqual(fromBytes(254, 0, 0, 0))
		expect(prefixToSubnetMask(8)).toStrictEqual(fromBytes(255, 0, 0, 0))
		expect(prefixToSubnetMask(9)).toStrictEqual(fromBytes(255, 128, 0, 0))
		expect(prefixToSubnetMask(10)).toStrictEqual(fromBytes(255, 192, 0, 0))
		expect(prefixToSubnetMask(11)).toStrictEqual(fromBytes(255, 224, 0, 0))
		expect(prefixToSubnetMask(12)).toStrictEqual(fromBytes(255, 240, 0, 0))
		expect(prefixToSubnetMask(13)).toStrictEqual(fromBytes(255, 248, 0, 0))
		expect(prefixToSubnetMask(14)).toStrictEqual(fromBytes(255, 252, 0, 0))
		expect(prefixToSubnetMask(15)).toStrictEqual(fromBytes(255, 254, 0, 0))
		expect(prefixToSubnetMask(16)).toStrictEqual(fromBytes(255, 255, 0, 0))
		expect(prefixToSubnetMask(17)).toStrictEqual(fromBytes(255, 255, 128, 0))
		expect(prefixToSubnetMask(18)).toStrictEqual(fromBytes(255, 255, 192, 0))
		expect(prefixToSubnetMask(19)).toStrictEqual(fromBytes(255, 255, 224, 0))
		expect(prefixToSubnetMask(20)).toStrictEqual(fromBytes(255, 255, 240, 0))
		expect(prefixToSubnetMask(21)).toStrictEqual(fromBytes(255, 255, 248, 0))
		expect(prefixToSubnetMask(22)).toStrictEqual(fromBytes(255, 255, 252, 0))
		expect(prefixToSubnetMask(23)).toStrictEqual(fromBytes(255, 255, 254, 0))
		expect(prefixToSubnetMask(24)).toStrictEqual(fromBytes(255, 255, 255, 0))
		expect(prefixToSubnetMask(25)).toStrictEqual(fromBytes(255, 255, 255, 128))
		expect(prefixToSubnetMask(26)).toStrictEqual(fromBytes(255, 255, 255, 192))
		expect(prefixToSubnetMask(27)).toStrictEqual(fromBytes(255, 255, 255, 224))
		expect(prefixToSubnetMask(28)).toStrictEqual(fromBytes(255, 255, 255, 240))
		expect(prefixToSubnetMask(29)).toStrictEqual(fromBytes(255, 255, 255, 248))
		expect(prefixToSubnetMask(30)).toStrictEqual(fromBytes(255, 255, 255, 252))
		expect(prefixToSubnetMask(31)).toStrictEqual(fromBytes(255, 255, 255, 254))
		expect(prefixToSubnetMask(32)).toStrictEqual(fromBytes(255, 255, 255, 255))
	})
}
