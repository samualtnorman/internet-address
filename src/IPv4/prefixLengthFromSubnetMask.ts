import type { IPv4 } from "../IPv4"
import { fromBytes } from "./fromBytes"

/** returns a number of leading ones in IPv4 address, making sure that the rest is a solid sequence of zeros
  * (valid netmask)
  * @returns Either the CIDR length or `undefined` if mask is not valid */
export function prefixLengthFromSubnetMask(address: IPv4): number | undefined {
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

	return 32 - cidr
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`prefixLengthFromSubnetMask()`, () => {
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 255, 255))).toBe(32)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 255, 254))).toBe(31)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 255, 252))).toBe(30)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 255, 248))).toBe(29)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 255, 240))).toBe(28)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 255, 224))).toBe(27)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 255, 192))).toBe(26)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 255, 128))).toBe(25)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 255, 0))).toBe(24)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 254, 0))).toBe(23)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 252, 0))).toBe(22)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 248, 0))).toBe(21)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 240, 0))).toBe(20)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 224, 0))).toBe(19)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 192, 0))).toBe(18)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 128, 0))).toBe(17)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 255, 0, 0))).toBe(16)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 254, 0, 0))).toBe(15)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 252, 0, 0))).toBe(14)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 248, 0, 0))).toBe(13)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 240, 0, 0))).toBe(12)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 224, 0, 0))).toBe(11)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 192, 0, 0))).toBe(10)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 128, 0, 0))).toBe(9)
		expect(prefixLengthFromSubnetMask(fromBytes(255, 0, 0, 0))).toBe(8)
		expect(prefixLengthFromSubnetMask(fromBytes(254, 0, 0, 0))).toBe(7)
		expect(prefixLengthFromSubnetMask(fromBytes(252, 0, 0, 0))).toBe(6)
		expect(prefixLengthFromSubnetMask(fromBytes(248, 0, 0, 0))).toBe(5)
		expect(prefixLengthFromSubnetMask(fromBytes(240, 0, 0, 0))).toBe(4)
		expect(prefixLengthFromSubnetMask(fromBytes(224, 0, 0, 0))).toBe(3)
		expect(prefixLengthFromSubnetMask(fromBytes(192, 0, 0, 0))).toBe(2)
		expect(prefixLengthFromSubnetMask(fromBytes(128, 0, 0, 0))).toBe(1)
		expect(prefixLengthFromSubnetMask(fromBytes(0, 0, 0, 0))).toBe(0)
		expect(prefixLengthFromSubnetMask(fromBytes(192, 168, 255, 0))).toBeUndefined()
		expect(prefixLengthFromSubnetMask(fromBytes(255, 0, 255, 0))).toBeUndefined()
	})
}
