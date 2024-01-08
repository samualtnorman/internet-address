import type { Prefix } from "../IPv6"

export const numberIsPrefix = (number: number): number is Prefix => number >= 0 && number < 129

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`numberIsPrefix()`, () => {
		expect(numberIsPrefix(-1)).toBe(false)
		expect(numberIsPrefix(0)).toBe(true)
		expect(numberIsPrefix(128)).toBe(true)
		expect(numberIsPrefix(129)).toBe(false)
	})
}
