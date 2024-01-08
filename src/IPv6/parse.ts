import { IPv4 } from ".."
import type { IPv6 } from "../IPv6"
import * as Hextets from "./Hextets"
import { fromHextets } from "./fromHextets"

/** @returns An {@link IPv6} parsed from {@link string} or `undefined` if invalid. */
export function parse(string: string): IPv6 | undefined {
	if (!string.includes(`:`))
		return

	let match

	if ((match =
		/^::((\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)(%[\da-z]+)?)$/i.exec(string))
	)
		return parse(`::FFFF:${match[1]}`)

	if (/^(?:::)?(?:[\da-f]+::?)*[\da-f]*(?:::)?(?:%[\da-z]+)?$/i.test(string))
		return expandIPv6(string)

	if ((match =
		/^((?:[\da-f]+::?)+|::(?:[\da-f]+::?)*)(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)(%[\da-z]+)?$/i
			.exec(string))
	) {
		const address = expandIPv6(`${match[1]!.slice(0, -1)}:0:0${match[6] || ``}`)

		if (address) {
			const octets = [ parseInt(match[2]!), parseInt(match[3]!), parseInt(match[4]!), parseInt(match[5]!) ]

			if (octets.some(octet => octet < 0 || octet > 255))
				return

			const u8View = new Uint8Array(address.hextets.buffer)

			u8View[13] = octets[0]!
			u8View[12] = octets[1]!
			u8View[15] = octets[2]!
			u8View[14] = octets[3]!

			return address
		}
	}
}

/** Expand `::` in an IPv6 address or address part consisting of `parts` groups. */
function expandIPv6(string: string): IPv6 | undefined {
	// More than one '::' means invalid adddress
	if (!string.includes(`::`, string.indexOf(`::`) + 1)) {
		const zoneId = /%([\da-z]+)/i.exec(string)?.[1]
		const u16View = new Uint16Array(8)

		const [ left, right ] = (zoneId ? string.slice(0, -zoneId.length - 1) : string).split(`::`)
			.map(hextets => hextets ? hextets.split(`:`) : undefined)

		if ((left?.length ?? 0) + (right?.length ?? 0) < 9) {
			if (left) {
				for (const [ index, hextet ] of left.entries()) {
					if (hextet.length > 4)
						return

					const parsedInt = parseInt(hextet, 16)

					if (isNaN(parsedInt))
						return

					u16View[index] = parsedInt
				}
			}

			if (right) {
				for (const [ index, hextet ] of right.entries()) {
					if (hextet.length > 4)
						return

					const parsedInt = parseInt(hextet, 16)

					if (isNaN(parsedInt))
						return

					u16View[(8 - right.length) + index] = parsedInt
				}
			}

			return { hextets: Hextets.fromUint16Array(u16View), zoneId }
		}
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`parse()`, () => {
		expect(parse(`2001:db8:F53A:0:0:0:0:1`)).toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 1))
		expect(parse(`fe80::10`)).toStrictEqual(fromHextets(0xFE80, 0, 0, 0, 0, 0, 0, 0x10))
		expect(parse(`2001:db8:F53A::`)).toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 0))
		expect(parse(`::1`)).toStrictEqual(fromHextets(0, 0, 0, 0, 0, 0, 0, 1))
		expect(parse(`::8.8.8.8`)).toStrictEqual(fromHextets(0, 0, 0, 0, 0, 0xFFFF, 2056, 2056))
		expect(parse(`::`)).toStrictEqual(fromHextets(0, 0, 0, 0, 0, 0, 0, 0))
		expect(parse(`::%z`)).toStrictEqual(fromHextets(0, 0, 0, 0, 0, 0, 0, 0, `z`))
		expect(parse(`2001:db8:f53a::1%2`)).toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 1, `2`))
		expect(parse(`2001:db8:f53a::1%WAT`)).toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 1, `WAT`))
		expect(parse(`2001:db8:f53a::1%sUp`)).toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 1, `sUp`))
		expect(parse(`2001:db8:F53A::1`)).toStrictEqual(fromHextets(0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 1))
		expect(parse(`::ffff:192.168.1.1`)).toStrictEqual(IPv4.toIPv6(IPv4.fromBytes(192, 168, 1, 1)))
		expect(parse(`::ffff:192.168.1.1%z`)).toStrictEqual(IPv4.toIPv6(IPv4.fromBytes(192, 168, 1, 1), `z`))
		expect(parse(`::10.2.3.4`)).toStrictEqual(IPv4.toIPv6(IPv4.fromBytes(10, 2, 3, 4)))
		expect(parse(`::12.34.56.78%z`)).toStrictEqual(IPv4.toIPv6(IPv4.fromBytes(12, 34, 56, 78), `z`))
		expect(parse(`::1.1.1.1`)).toStrictEqual(fromHextets(0, 0, 0, 0, 0, 0xFFFF, 0x101, 0x101))
		expect(parse(`::1.2.3.4%z`)).toStrictEqual(IPv4.toIPv6(IPv4.fromBytes(1, 2, 3, 4), `z`))
		expect(parse(`fe80::0::1`)).toBeUndefined()
		expect(parse(`::some.nonsense`)).toBeUndefined()
		expect(parse(`200001::1`)).toBeUndefined()
		expect(parse(`::ffff:300.168.1.1`)).toBeUndefined()
		expect(parse(`::ffff:300.168.1.1:0`)).toBeUndefined()
		expect(parse(`fe80::foo`)).toBeUndefined()
		expect(parse(`fe80::%`)).toBeUndefined()
		expect(parse(`::ffff:222.1.41.9000`)).toBeUndefined()
		expect(parse(`2001:db8::F53A::1`)).toBeUndefined()
		expect(parse(`2002::2:`)).toBeUndefined()
		expect(parse(``)).toBeUndefined()
		expect(parse(`1`)).toBeUndefined()
		expect(parse(`::8:8:8:8:8:8:8:8:8`)).toBeUndefined()
		expect(parse(`::8:8:8:8:8:8:8:8:8%z`)).toBeUndefined()
	})
}
