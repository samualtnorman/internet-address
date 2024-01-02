import type { IPv4 } from "../IPv4"
import { fromBytes } from "./fromBytes"

/** @returns Subnet mask in IPv4 format given the prefix length */
export function subnetMaskFromPrefixLength(prefix: number): IPv4 {
	if (prefix < 0 || prefix > 32)
		throw Error(`Invalid IPv4 prefix length`)

	const octets: [ number, number, number, number ] = [ 0, 0, 0, 0 ]
	const filledOctetCount = Math.floor(prefix / 8)

	for (let index = filledOctetCount; index--;)
		octets[index] = 0xFF

	if (filledOctetCount < 4)
		octets[filledOctetCount] = (2 ** (prefix % 8)) - 1 << 8 - (prefix % 8)

	return fromBytes(...octets)
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`subnetMaskFromPrefixLength()`, () => {
		expect(subnetMaskFromPrefixLength(0)).toStrictEqual(fromBytes(0, 0, 0, 0))
		expect(subnetMaskFromPrefixLength(1)).toStrictEqual(fromBytes(128, 0, 0, 0))
		expect(subnetMaskFromPrefixLength(2)).toStrictEqual(fromBytes(192, 0, 0, 0))
		expect(subnetMaskFromPrefixLength(3)).toStrictEqual(fromBytes(224, 0, 0, 0))
		expect(subnetMaskFromPrefixLength(4)).toStrictEqual(fromBytes(240, 0, 0, 0))
		expect(subnetMaskFromPrefixLength(5)).toStrictEqual(fromBytes(248, 0, 0, 0))
		expect(subnetMaskFromPrefixLength(6)).toStrictEqual(fromBytes(252, 0, 0, 0))
		expect(subnetMaskFromPrefixLength(7)).toStrictEqual(fromBytes(254, 0, 0, 0))
		expect(subnetMaskFromPrefixLength(8)).toStrictEqual(fromBytes(255, 0, 0, 0))
		expect(subnetMaskFromPrefixLength(9)).toStrictEqual(fromBytes(255, 128, 0, 0))
		expect(subnetMaskFromPrefixLength(10)).toStrictEqual(fromBytes(255, 192, 0, 0))
		expect(subnetMaskFromPrefixLength(11)).toStrictEqual(fromBytes(255, 224, 0, 0))
		expect(subnetMaskFromPrefixLength(12)).toStrictEqual(fromBytes(255, 240, 0, 0))
		expect(subnetMaskFromPrefixLength(13)).toStrictEqual(fromBytes(255, 248, 0, 0))
		expect(subnetMaskFromPrefixLength(14)).toStrictEqual(fromBytes(255, 252, 0, 0))
		expect(subnetMaskFromPrefixLength(15)).toStrictEqual(fromBytes(255, 254, 0, 0))
		expect(subnetMaskFromPrefixLength(16)).toStrictEqual(fromBytes(255, 255, 0, 0))
		expect(subnetMaskFromPrefixLength(17)).toStrictEqual(fromBytes(255, 255, 128, 0))
		expect(subnetMaskFromPrefixLength(18)).toStrictEqual(fromBytes(255, 255, 192, 0))
		expect(subnetMaskFromPrefixLength(19)).toStrictEqual(fromBytes(255, 255, 224, 0))
		expect(subnetMaskFromPrefixLength(20)).toStrictEqual(fromBytes(255, 255, 240, 0))
		expect(subnetMaskFromPrefixLength(21)).toStrictEqual(fromBytes(255, 255, 248, 0))
		expect(subnetMaskFromPrefixLength(22)).toStrictEqual(fromBytes(255, 255, 252, 0))
		expect(subnetMaskFromPrefixLength(23)).toStrictEqual(fromBytes(255, 255, 254, 0))
		expect(subnetMaskFromPrefixLength(24)).toStrictEqual(fromBytes(255, 255, 255, 0))
		expect(subnetMaskFromPrefixLength(25)).toStrictEqual(fromBytes(255, 255, 255, 128))
		expect(subnetMaskFromPrefixLength(26)).toStrictEqual(fromBytes(255, 255, 255, 192))
		expect(subnetMaskFromPrefixLength(27)).toStrictEqual(fromBytes(255, 255, 255, 224))
		expect(subnetMaskFromPrefixLength(28)).toStrictEqual(fromBytes(255, 255, 255, 240))
		expect(subnetMaskFromPrefixLength(29)).toStrictEqual(fromBytes(255, 255, 255, 248))
		expect(subnetMaskFromPrefixLength(30)).toStrictEqual(fromBytes(255, 255, 255, 252))
		expect(subnetMaskFromPrefixLength(31)).toStrictEqual(fromBytes(255, 255, 255, 254))
		expect(subnetMaskFromPrefixLength(32)).toStrictEqual(fromBytes(255, 255, 255, 255))
	})
}
