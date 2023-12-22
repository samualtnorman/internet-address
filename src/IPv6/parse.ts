import type { IPv6 } from "../IPv6"
import * as Hextets from "./Hextets"

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
