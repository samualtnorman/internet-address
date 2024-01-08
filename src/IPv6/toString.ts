import type { IPv6 } from "../IPv6"
import { fromHextets } from "./fromHextets"

/** @returns The address in compact, human-readable format like `2001:db8:8:66::1` in line with RFC 5952.
  * @see https://tools.ietf.org/html/rfc5952#section-4 */
export function toString(ipv6: IPv6): string {
	const regex = /(?:^|:)(?:0(?::|$)){2,}/g

	const string =
		`${[ ...ipv6.hextets ].map(hextet => hextet.toString(16)).join(`:`)}${ipv6.zoneId ? `%${ipv6.zoneId}` : ``}`

	let bestMatchIndex = 0
	let bestMatchLength = -1
	let match

	while ((match = regex.exec(string))) {
		if (match[0].length > bestMatchLength) {
			bestMatchIndex = match.index
			bestMatchLength = match[0].length
		}
	}

	if (bestMatchLength < 0)
		return string

	return `${string.slice(0, Math.max(0, bestMatchIndex))}::${
		string.slice(Math.max(0, bestMatchIndex + bestMatchLength))}`
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`toString()`, () => {
		expect(toString(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 1))).toBe(`2001:db8:f53a::1`)
		expect(toString(fromHextets(0, 0, 0, 0, 0, 0, 0, 0))).toBe(`::`)
		expect(toString(fromHextets(0, 0, 0, 0, 0, 0, 0, 1))).toBe(`::1`)
		expect(toString(fromHextets(0x2001, 0xDB8, 0, 0, 0, 0, 0, 0))).toBe(`2001:db8::`)
		expect(toString(fromHextets(0, 0xFF, 0, 0, 0, 0, 0, 0))).toBe(`0:ff::`)
		expect(toString(fromHextets(0, 0, 0, 0, 0, 0, 0xFF, 0))).toBe(`::ff:0`)
		expect(toString(fromHextets(0, 0, 0xFF, 0, 0, 0, 0, 0))).toBe(`0:0:ff::`)
		expect(toString(fromHextets(0, 0, 0, 0, 0, 0xFF, 0, 0))).toBe(`::ff:0:0`)
		expect(toString(fromHextets(0, 0, 0, 0xFF, 0xFF, 0, 0, 0))).toBe(`::ff:ff:0:0:0`)

		expect(toString(fromHextets(0x2001, 0xDB8, 0xFF, 0xABC, 0xDEF, 0x123B, 0x456C, 0x78D)))
			.toBe(`2001:db8:ff:abc:def:123b:456c:78d`)

		expect(toString(fromHextets(0x2001, 0xDB8, 0xFF, 0xABC, 0, 0x123B, 0x456C, 0x78D)))
			.toBe(`2001:db8:ff:abc:0:123b:456c:78d`)

		expect(toString(fromHextets(0x2001, 0xDB8, 0xFF, 0xABC, 0, 0, 0x456C, 0x78D)))
			.toBe(`2001:db8:ff:abc::456c:78d`)

		expect(toString(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 1, `utun0`))).toBe(`2001:db8:f53a::1%utun0`)
		expect(toString(fromHextets(0, 0, 0, 0, 0, 0xFFFF, 0xC0A8, 0x101, `eth0`))).toBe(`::ffff:c0a8:101%eth0`)
		expect(toString(fromHextets(0, 0, 0, 0, 0, 0xFFFF, 0xC0A8, 0x101, `2`))).toBe(`::ffff:c0a8:101%2`)
		expect(toString(fromHextets(0, 0, 0, 0, 0, 0xFFFF, 0xC0A8, 0x101, `WAT`))).toBe(`::ffff:c0a8:101%WAT`)
		expect(toString(fromHextets(0, 0, 0, 0, 0, 0xFFFF, 0xC0A8, 0x101, `sUp`))).toBe(`::ffff:c0a8:101%sUp`)
		expect(toString(fromHextets(8193, 3512, 62_778, 0, 0, 0, 0, 1))).toBe(`2001:db8:f53a::1`)
		expect(toString(fromHextets(0x2001, 0, 0, 0, 0xFF, 0, 0, 0))).toBe(`2001::ff:0:0:0`)

		expect(toString(fromHextets(0x2001, 0xDB8, 0xFF, 0xABC, 0x78D, 0x123B, 0x456C, 0)))
			.toBe(`2001:db8:ff:abc:78d:123b:456c:0`)

		expect(toString(fromHextets(0, 0xDB8, 0xFF, 0xABC, 0x78D, 0x123B, 0x456C, 0x2001)))
			.toBe(`0:db8:ff:abc:78d:123b:456c:2001`)
	})
}
