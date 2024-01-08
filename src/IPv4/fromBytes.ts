import type { IPv4 } from "../IPv4"
import { fromUint8Array } from "./fromUint8Array"

/** @returns `IPv4` from 4 bytes.
  * @example const address = IPv4.fromBytes(192, 168, 0, 1) */
export const fromBytes = (byte0: number, byte1: number, byte2: number, byte3: number): IPv4 =>
	fromUint8Array(new Uint8Array([ byte0, byte1, byte2, byte3 ]))

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`fromBytes()`, () =>
		expect(fromBytes(149, 187, 3, 11)).toStrictEqual(new Uint8Array([ 149, 187, 3, 11 ]))
	)
}
