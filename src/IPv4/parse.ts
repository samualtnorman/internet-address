import type { IPv4 } from "../IPv4"
import { fromBytes } from "./fromBytes"

/** @returns Parsed IPv4 address or `undefined` if invalid. */
export function parse(string: string): IPv4 | undefined {
	let match

	// parseInt recognizes all that octal & hexadecimal weirdness for us
	if ((match = /^(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)$/i.exec(string))) {
		const bytes: [ number, number, number, number ] = [
			parseIntAuto(match[1]!),
			parseIntAuto(match[2]!),
			parseIntAuto(match[3]!),
			parseIntAuto(match[4]!)
		]

		if (bytes.every(byte => !isNaN(byte) && byte >= 0 && byte <= 0xFF))
			return fromBytes(...bytes)
	} else if ((match = /^(\d+|0x[a-f\d]+)$/i.exec(string))) {
		const value = parseIntAuto(match[1]!)

		if (!isNaN(value) && value <= 0xFF_FF_FF_FF && value >= 0)
			return fromBytes((value >> 24) & 0xFF, (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF)
	} else if ((match = /^(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)$/i.exec(string))) {
		const firstOctet = parseIntAuto(match[1]!)
		const lastOctets = parseIntAuto(match[2]!)

		if (!isNaN(firstOctet) && !isNaN(lastOctets) && firstOctet <= 0xFF && firstOctet >= 0 &&
			lastOctets <= 0xFF_FF_FF && lastOctets >= 0
		)
			return fromBytes(firstOctet, (lastOctets >> 16) & 0xFF, (lastOctets >> 8) & 0xFF, lastOctets & 0xFF)
	} else if ((match = /^(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)$/i.exec(string))) {
		const firstOctet = parseIntAuto(match[1]!)
		const secondOctet = parseIntAuto(match[2]!)
		const lastOctets = parseIntAuto(match[3]!)

		if (!isNaN(firstOctet) && !isNaN(secondOctet) && !isNaN(lastOctets) &&
			firstOctet <= 0xFF && firstOctet >= 0 && secondOctet <= 0xFF &&
			secondOctet >= 0 && lastOctets <= 0xFF_FF && lastOctets >= 0
		)
			return fromBytes(firstOctet, secondOctet, (lastOctets >> 8) & 0xFF, lastOctets & 0xFF)
	}
}

function parseIntAuto(string: string): number {
	// Hexadedimal base 16 (0x#)
	if (/^0x[a-f\d]+$/i.test(string))
		return parseInt(string, 16)

	// While octal representation is discouraged by ECMAScript 3
	// and forbidden by ECMAScript 5, we silently allow it to
	// work only if the rest of the string has numbers less than 8.
	if (string[0] === `0` && !isNaN(parseInt(string[1]!, 10))) {
		if (/^0[0-7]+$/.test(string))
			return parseInt(string, 8)

		return NaN
	}

	// Always include the base 10 radix!
	return parseInt(string, 10)
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest

	describe(`parse()`, () => {
		test(`standard format`, () => expect(parse(`50.251.1.32`)).toStrictEqual(fromBytes(50, 251, 1, 32)))
		test(`hex`, () => expect(parse(`0x22.101.208.167`)).toStrictEqual(fromBytes(0x22, 101, 208, 167)))
		test(`octal`, () => expect(parse(`6.0373.46.63`)).toStrictEqual(fromBytes(6, 0o373, 46, 63)))
		test(`long hex`, () => expect(parse(`0xF6FB314C`)).toStrictEqual(fromBytes(0xF6, 0xFB, 0x31, 0x4C)))
		test(`long octal`, () => expect(parse(`027227354757`)).toStrictEqual(fromBytes(186, 93, 217, 239)))
		test(`long`, () => expect(parse(`3512666314`)).toStrictEqual(fromBytes(209, 95, 8, 202)))
		test(`3 parts`, () => expect(parse(`172.178.1270`)).toStrictEqual(fromBytes(172, 178, 4, 246)))
		test(`2 parts`, () => expect(parse(`25.3367299`)).toStrictEqual(fromBytes(25, 51, 97, 131)))

		describe(`reject invalid IPv4`, () => {
			test(`non-IPv4 string`, () => expect(parse(`133.89.60.foo`)).toBeUndefined())

			describe(`part out of range`, () => {
				test(`2 parts`, () => expect(parse(`244.16777216`)).toBeUndefined())
				test(`3 parts`, () => expect(parse(`96.197.65536`)).toBeUndefined())
			})

			test(`invalid octal`, () => expect(parse(`86.08.13.97`)).toBeUndefined())
		})
	})
}
