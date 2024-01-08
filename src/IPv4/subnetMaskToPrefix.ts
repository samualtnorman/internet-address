import type { IPv4, Prefix } from "../IPv4"
import { fromBytes } from "./fromBytes"
import { numberToPrefix } from "./numberToPrefix"

/** returns a number of leading ones in IPv4 address, making sure that the rest is a solid sequence of zeros
  * (valid netmask)
  * @returns Either the CIDR length or `undefined` if mask is not valid */
export function subnetMaskToPrefix(address: IPv4): Prefix | undefined {
	let /** non-zero encountered stop scanning for zeros */ stop = false
	let cidr = 0

	for (let index = 4; index--;) {
		const zeros = { 0: 8, 128: 7, 192: 6, 224: 5, 240: 4, 248: 3, 252: 2, 254: 1, 255: 0 }[address[index]!]

		if (zeros == undefined || (stop && zeros != 0))
			return

		if (zeros != 8)
			stop = true

		cidr += zeros
	}

	return numberToPrefix(32 - cidr)
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`getSubnetMaskPrefixLength()`, () => {
		expect(subnetMaskToPrefix(fromBytes(255, 255, 255, 255))).toBe(32)
		expect(subnetMaskToPrefix(fromBytes(255, 255, 255, 254))).toBe(31)
		expect(subnetMaskToPrefix(fromBytes(255, 255, 255, 252))).toBe(30)
		expect(subnetMaskToPrefix(fromBytes(255, 255, 255, 248))).toBe(29)
		expect(subnetMaskToPrefix(fromBytes(255, 255, 255, 240))).toBe(28)
		expect(subnetMaskToPrefix(fromBytes(255, 255, 255, 224))).toBe(27)
		expect(subnetMaskToPrefix(fromBytes(255, 255, 255, 192))).toBe(26)
		expect(subnetMaskToPrefix(fromBytes(255, 255, 255, 128))).toBe(25)
		expect(subnetMaskToPrefix(fromBytes(255, 255, 255, 0))).toBe(24)
		expect(subnetMaskToPrefix(fromBytes(255, 255, 254, 0))).toBe(23)
		expect(subnetMaskToPrefix(fromBytes(255, 255, 252, 0))).toBe(22)
		expect(subnetMaskToPrefix(fromBytes(255, 255, 248, 0))).toBe(21)
		expect(subnetMaskToPrefix(fromBytes(255, 255, 240, 0))).toBe(20)
		expect(subnetMaskToPrefix(fromBytes(255, 255, 224, 0))).toBe(19)
		expect(subnetMaskToPrefix(fromBytes(255, 255, 192, 0))).toBe(18)
		expect(subnetMaskToPrefix(fromBytes(255, 255, 128, 0))).toBe(17)
		expect(subnetMaskToPrefix(fromBytes(255, 255, 0, 0))).toBe(16)
		expect(subnetMaskToPrefix(fromBytes(255, 254, 0, 0))).toBe(15)
		expect(subnetMaskToPrefix(fromBytes(255, 252, 0, 0))).toBe(14)
		expect(subnetMaskToPrefix(fromBytes(255, 248, 0, 0))).toBe(13)
		expect(subnetMaskToPrefix(fromBytes(255, 240, 0, 0))).toBe(12)
		expect(subnetMaskToPrefix(fromBytes(255, 224, 0, 0))).toBe(11)
		expect(subnetMaskToPrefix(fromBytes(255, 192, 0, 0))).toBe(10)
		expect(subnetMaskToPrefix(fromBytes(255, 128, 0, 0))).toBe(9)
		expect(subnetMaskToPrefix(fromBytes(255, 0, 0, 0))).toBe(8)
		expect(subnetMaskToPrefix(fromBytes(254, 0, 0, 0))).toBe(7)
		expect(subnetMaskToPrefix(fromBytes(252, 0, 0, 0))).toBe(6)
		expect(subnetMaskToPrefix(fromBytes(248, 0, 0, 0))).toBe(5)
		expect(subnetMaskToPrefix(fromBytes(240, 0, 0, 0))).toBe(4)
		expect(subnetMaskToPrefix(fromBytes(224, 0, 0, 0))).toBe(3)
		expect(subnetMaskToPrefix(fromBytes(192, 0, 0, 0))).toBe(2)
		expect(subnetMaskToPrefix(fromBytes(128, 0, 0, 0))).toBe(1)
		expect(subnetMaskToPrefix(fromBytes(0, 0, 0, 0))).toBe(0)
		expect(subnetMaskToPrefix(fromBytes(192, 168, 255, 0))).toBeUndefined()
		expect(subnetMaskToPrefix(fromBytes(255, 0, 255, 0))).toBeUndefined()
	})
}
