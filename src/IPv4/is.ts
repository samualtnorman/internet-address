import type { IPv4 } from "../IPv4"

export const is = <TArrayBuffer extends ArrayBufferLike>(ip: Uint8Array<TArrayBuffer>): ip is IPv4<TArrayBuffer> => ip.length == 4

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`is()`, () => {
		expect(is(new Uint8Array([ 37, 187, 127, 176 ]))).toStrictEqual(true)
		expect(is(new Uint8Array())).toStrictEqual(false)
	})
}
