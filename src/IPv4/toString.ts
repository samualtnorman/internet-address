import type { IPv4 } from "../IPv4"
import { fromBytes } from "./fromBytes"

export const enum PartFormat { Decimal, Octal, UpperHexadecimal, LowerHexadecimal }

export type Format = [ PartFormat, PartFormat, PartFormat, PartFormat ] | [ PartFormat, PartFormat, PartFormat ] |
	[ PartFormat, PartFormat ] | [ PartFormat ]

/** @param address The IPv4 address.
  * @param format How the IPv4 address should be formatted. Defaults to 4 decimal parts.
  * @returns The formatted address as a string. */
export const toString = (
	address: IPv4,
	format: Format = [ PartFormat.Decimal, PartFormat.Decimal, PartFormat.Decimal, PartFormat.Decimal ]
): string => format.map((partFormat, index) => {
	let part = address[index++]!

	if (index == format.length) {
		for (; index < 4; index++)
			part = (part * 256) + address[index]!
	}

	return partFormat == PartFormat.Decimal ?
		String(part)
	: partFormat == PartFormat.Octal ?
		`0${part.toString(8)}`
	: partFormat == PartFormat.UpperHexadecimal ?
		`0x${part.toString(16).toUpperCase()}`
	: `0x${part.toString(16)}`
}).join(`.`)

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`toString()`, () => {
		expect(toString(fromBytes(143, 196, 224, 197))).toBe(`143.196.224.197`)
		expect(toString(fromBytes(40, 50, 136, 232))).toBe(`40.50.136.232`)

		expect(toString(
			fromBytes(79, 10, 221, 165),
			[ PartFormat.Decimal, PartFormat.Decimal, PartFormat.Decimal, PartFormat.Decimal ]
		)).toBe(`79.10.221.165`)

		expect(toString(
			fromBytes(44, 246, 104, 125),
			[ PartFormat.Octal, PartFormat.Octal, PartFormat.Octal, PartFormat.Octal ]
		)).toBe(`054.0366.0150.0175`)

		expect(toString(
			fromBytes(76, 6, 32, 183),
			[ PartFormat.Octal, PartFormat.Decimal, PartFormat.Octal, PartFormat.Decimal ]
		)).toBe(`0114.6.040.183`)

		expect(toString(fromBytes(193, 87, 128, 225), [ PartFormat.Decimal, PartFormat.Decimal, PartFormat.Decimal ]))
			.toBe(`193.87.32993`)

		expect(toString(fromBytes(38, 14, 141, 142), [ PartFormat.Octal, PartFormat.Octal, PartFormat.Octal ]))
			.toBe(`046.016.0106616`)

		expect(toString(fromBytes(127, 236, 220, 233), [ PartFormat.Octal, PartFormat.Decimal, PartFormat.Octal ]))
			.toBe(`0177.236.0156351`)

		expect(toString(fromBytes(195, 198, 207, 99), [ PartFormat.Decimal, PartFormat.Decimal ])).toBe(`195.13029219`)
		expect(toString(fromBytes(67, 150, 162, 94), [ PartFormat.Octal, PartFormat.Octal ])).toBe(`0103.045521136`)
		expect(toString(fromBytes(123, 101, 84, 2), [ PartFormat.Octal, PartFormat.Decimal ])).toBe(`0173.6640642`)
		expect(toString(fromBytes(217, 39, 234, 145), [ PartFormat.Decimal ])).toBe(`3643271825`)
		expect(toString(fromBytes(172, 164, 134, 169), [ PartFormat.Octal ])).toBe(`025451103251`)

		expect(toString(
			fromBytes(160, 189, 42, 121),
			[ PartFormat.UpperHexadecimal, PartFormat.UpperHexadecimal ]
		)).toBe(`0xA0.0xBD2A79`)

		expect(toString(
			fromBytes(160, 189, 42, 121),
			[ PartFormat.LowerHexadecimal, PartFormat.LowerHexadecimal ]
		)).toBe(`0xa0.0xbd2a79`)
	})
}
