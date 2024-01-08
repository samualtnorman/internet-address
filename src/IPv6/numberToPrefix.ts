import type { Prefix } from "../IPv6"
import { numberIsPrefix } from "./numberIsPrefix"

export function numberToPrefix(number: number): Prefix {
	if (numberIsPrefix(number))
		return number

	throw Error(`Mask length should be between 0 and 128 (inclusive), got ${number}`)
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`numberToPrefix()`, () => {
		expect(() => numberToPrefix(-1)).toThrowError()
		expect(numberToPrefix(0)).toBe(0)
		expect(numberToPrefix(128)).toBe(128)
		expect(() => numberToPrefix(129)).toThrowError()
	})
}
