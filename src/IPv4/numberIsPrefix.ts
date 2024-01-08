import type { Prefix } from "../IPv4"

export const numberIsPrefix = (number: number): number is Prefix => number >= 0 && number < 33

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`numberIsPrefix()`, () => {
		expect(numberIsPrefix(-1)).toBe(false)
		expect(numberIsPrefix(0)).toBe(true)
		expect(numberIsPrefix(32)).toBe(true)
		expect(numberIsPrefix(33)).toBe(false)
	})
}
