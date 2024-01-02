import { parse } from "./parse"

/** Checks if a given string is a full four-part IPv4 Address. */
export const isValidFourPartDecimal = (address: string): boolean =>
	Boolean(/^(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*)){3}$/.test(address) && parse(address))

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest

	describe(`isValidFourPartDecimal()`, () => {
		expect(isValidFourPartDecimal(`0.0.0.0`)).toBe(true)
		expect(isValidFourPartDecimal(`127.0.0.1`)).toBe(true)
		expect(isValidFourPartDecimal(`192.168.1.1`)).toBe(true)
		expect(isValidFourPartDecimal(`0xC0.168.1.1`)).toBe(false)

		test(`leading zeroes`, () => {
			expect(isValidFourPartDecimal(`000000192.168.100.2`)).toBe(false)
			expect(isValidFourPartDecimal(`192.0000168.100.2`)).toBe(false)
		})

		test(`trailing zeroes`, () => {
			expect(isValidFourPartDecimal(`192.168.100.00000002`)).toBe(false)
			expect(isValidFourPartDecimal(`192.168.100.20000000`)).toBe(false)
		})
	})
}
