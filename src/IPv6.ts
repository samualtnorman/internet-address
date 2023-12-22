import { CIDR, type RangeList } from "."
import * as IPv4 from "./IPv4"
import * as Internal from "./internal"
import { type IPvXRangeDefaults, type StringSuggest } from "./internal"
import { subnetMatch } from "./subnetMatch"

export type IPv6Range = IPvXRangeDefaults | "uniqueLocal" | "ipv4Mapped" | "rfc6145" | "rfc6052" | "6to4" | "teredo"

/** Does not exist at runtime, just for faking nominal typing in typescript. */
declare const HextetsTag: unique symbol

/** Eight big-endian 16-bit unsigned integers. */
export type Hextets = Uint16Array & { [HextetsTag]: typeof HextetsTag }

/** @returns Whether the {@link uint16Array} has a length of 8. */
export const isHextets = (uint16Array: Uint16Array): uint16Array is Hextets => uint16Array.length == 8

/** @returns A {@link Hextets} object from {@link uint16Array}.
  * @throws If {@link uint16Array} does not have a length of 8. */
export function hextetsFromUint16Array(uint16Array: Uint16Array): Hextets {
	if (isHextets(uint16Array))
		return uint16Array

	throw Error(`Uint16Array must have a length of 8`)
}

/** An IPv6 address. */
export type IPv6 = { hextets: Hextets, zoneId: string | undefined }

/** @returns An {@link IPv6} object from a series of bytes and an optional {@link zoneId}. */
export const fromBytes = (
	byte0: number, byte1: number, byte2: number, byte3: number, byte4: number, byte5: number, byte6: number,
	byte7: number, byte8: number, byte9: number, byte10: number, byte11: number, byte12: number, byte13: number,
	byte14: number, byte15: number, zoneId?: string
): IPv6 => ({
	hextets: hextetsFromUint16Array(new Uint16Array(new Uint16Array([
		byte1, byte0, byte3, byte2, byte5, byte4, byte7, byte6, byte9,
		byte8, byte11, byte10, byte13, byte12, byte15, byte14
	]).buffer)),
	zoneId
})

/** @returns An {@link IPv6} object from a series of hextets and an optional {@link zoneId}. */
export const fromHextets = (
	hextet0: number, hextet1: number, hextet2: number, hextet3: number, hextet4: number, hextet5: number,
	hextet6: number, hextet7: number, zoneId?: string
): IPv6 => ({
	hextets: hextetsFromUint16Array(
		new Uint16Array([ hextet0, hextet1, hextet2, hextet3, hextet4, hextet5, hextet6, hextet7 ])
	),
	zoneId
})

/** @returns Broadcast adress from parsed CIDR or `undefined` if invalid CIDR string */
export function broadcastAddressFromCIDR(address: string): IPv6 | undefined {
	const cidr = parseCIDR(address)

	if (cidr) {
		const subnetMask = subnetMaskFromPrefixLength(cidr.bits)

		cidr.ip.zoneId = undefined

		for (let index = 16; index--;)
			cidr.ip.hextets[index] |= subnetMask.hextets[index]! ^ 0xFF_FF

		return cidr.ip
	}
}

/** @returns Network address from parsed CIDR or `undefined` if invalid CIDR string */
export function networkAddressFromCIDR(address: string): IPv6 | undefined {
	const cidr = parseCIDR(address)

	if (cidr) {
		const subnetMask = subnetMaskFromPrefixLength(cidr.bits)

		cidr.ip.zoneId = undefined

		for (let index = 16; index--;)
			cidr.ip.hextets[index] &= subnetMask.hextets[index]!

		return cidr.ip
	}
}

/** @returns parsed `CIDR` or `undefined` if invalid */
export function parseCIDR(addr: string): CIDR<IPv6> | undefined {
	const match = /^(.+)\/(\d+)$/.exec(addr)

	if (match) {
		const maskLength = parseInt(match[2]!)

		if (maskLength >= 0 && maskLength <= 128) {
			const parsed = parse(match[1]!)

			if (parsed)
				return new CIDR(parsed, maskLength)
		}
	}
}

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

/** A utility function to return subnet mask in IPv6 format given the prefix length */
export function subnetMaskFromPrefixLength(prefix: number): IPv6 {
	if (prefix < 0 || prefix > 128)
		throw Error(`Invalid IPv6 prefix length`)

	const subnetMask = fromHextets(0, 0, 0, 0, 0, 0, 0, 0)
	const filledHextetCount = Math.floor(prefix / 16)

	for (let index = 0; index < filledHextetCount; index++)
		subnetMask.hextets[index] = 0xFF_FF

	if (filledHextetCount < 32)
		subnetMask.hextets[filledHextetCount] = ((2 ** (prefix % 16)) - 1) << (16 - (prefix % 16))

	return subnetMask
}

// TODO decide whether to remove this
/** Checks if this address is an IPv4-mapped IPv6 address. */
export function isIPv4MappedAddress(ipv6: IPv6): boolean {
	return range(ipv6) == `ipv4Mapped`
}

/** Checks if this address matches other one within given CIDR range. */
export function match(ipv6A: IPv6, ipv6B: IPv6, bits: number): boolean {
	return Internal.matchCIDR(ipv6A.hextets, ipv6B.hextets, 16, bits)
}

export function matchCIDR(ipv6: IPv6, cidr: CIDR<IPv6>) {
	return match(ipv6, cidr.ip, cidr.bits)
}

/** @returns Number of leading ones, making sure that the rest is a solid sequence of zeros (valid netmask)
  * @returns Either the CIDR length or undefined if mask is not valid */
export function prefixLengthFromSubnetMask(ipv6: IPv6): number | undefined {
	let /** non-zero encountered stop scanning for zeros */ stop = false
	let cidr = 0

	for (let index = 8; index--;) {
		const zeros = {
			0: 16,
			32_768: 15,
			49_152: 14,
			57_344: 13,
			61_440: 12,
			63_488: 11,
			64_512: 10,
			65_024: 9,
			65_280: 8,
			65_408: 7,
			65_472: 6,
			65_504: 5,
			65_520: 4,
			65_528: 3,
			65_532: 2,
			65_534: 1,
			65_535: 0
		}[ipv6.hextets[index]!]

		if (zeros == undefined || (stop && zeros != 0))
			return

		if (zeros != 16)
			stop = true

		cidr += zeros
	}

	return 128 - cidr
}

/** Checks if the address corresponds to one of the special ranges. */
export function range(ipv6: IPv6): StringSuggest<IPv6Range> {
	return subnetMatch(ipv6, SpecialRanges)
}

/** Returns the address in expanded format with all zeros included, like
  * `2001:0db8:0008:0066:0000:0000:0000:0001`. */
export function toFixedLengthString(ipv6: IPv6): string {
	return [ ...ipv6.hextets ].map(part => part.toString(16).padStart(4, `0`)).join(`:`) +
		(ipv6.zoneId ? `%${ipv6.zoneId}` : ``)
}

/** @returns IPv4 address of IPv4-mapped IPv6 address or `undefined` if it is not. */
export function toIPv4Address(ipv6: IPv6): IPv4.IPv4 | undefined {
	if (isIPv4MappedAddress(ipv6)) {
		const u8View = new Uint8Array(ipv6.hextets.buffer)

		return IPv4.fromBytes(u8View[13]!, u8View[12]!, u8View[15]!, u8View[14]!)
	}
}

/** @returns The address in expanded format with all zeros included, like `2001:db8:8:66:0:0:0:1`.
  * @deprecated Use {@link toFixedLengthString()} instead. */
export function toNormalizedString(ipv6: IPv6): string {
	return `${[ ...ipv6.hextets ].map(hextet => hextet.toString(16)).join(`:`)}${
		ipv6.zoneId ? `%${ipv6.zoneId}` : ``}`
}

/** @returns The address in compact, human-readable format like `2001:db8:8:66::1` in line with RFC 5952.
  * @see https://tools.ietf.org/html/rfc5952#section-4 */
export function toString(ipv6: IPv6): string {
	const regex = /(?:^|:)(?:0(?::|$)){2,}/g
	const string = toNormalizedString(ipv6)
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

			return { hextets: hextetsFromUint16Array(u16View), zoneId }
		}
	}
}

/** Special IPv6 ranges */
const SpecialRanges: RangeList<IPv6> = new Map([
	// RFC4291, here and after
	[ `unspecified`, [ { ip: fromHextets(0, 0, 0, 0, 0, 0, 0, 0), bits: 128 } ] ],
	[ `linkLocal`, [ { ip: fromHextets(0xFE_80, 0, 0, 0, 0, 0, 0, 0), bits: 10 } ] ],
	[ `multicast`, [ { ip: fromHextets(0xFF_00, 0, 0, 0, 0, 0, 0, 0), bits: 8 } ] ],
	[ `loopback`, [ { ip: fromHextets(0, 0, 0, 0, 0, 0, 0, 1), bits: 128 } ] ],
	[ `uniqueLocal`, [ { ip: fromHextets(0xFC_00, 0, 0, 0, 0, 0, 0, 0), bits: 7 } ] ],
	[ `ipv4Mapped`, [ { ip: fromHextets(0, 0, 0, 0, 0, 0xFF_FF, 0, 0), bits: 96 } ] ],
	// RFC6145
	[ `rfc6145`, [ { ip: fromHextets(0, 0, 0, 0, 0xFF_FF, 0, 0, 0), bits: 96 } ] ],
	// RFC6052
	[ `rfc6052`, [ { ip: fromHextets(0x64, 0xFF_9B, 0, 0, 0, 0, 0, 0), bits: 96 } ] ],
	// RFC3056
	[ `6to4`, [ { ip: fromHextets(0x20_02, 0, 0, 0, 0, 0, 0, 0), bits: 16 } ] ],
	// RFC6052, RFC6146
	[ `teredo`, [ { ip: fromHextets(0x20_01, 0, 0, 0, 0, 0, 0, 0), bits: 32 } ] ],
	// RFC4291
	[ `reserved`, [ { ip: fromHextets(0x20_01, 0xD_B8, 0, 0, 0, 0, 0, 0), bits: 32 } ] ],
	[ `benchmarking`, [ { ip: fromHextets(0x20_01, 0x2, 0, 0, 0, 0, 0, 0), bits: 48 } ] ],
	[ `amt`, [ { ip: fromHextets(0x20_01, 0x3, 0, 0, 0, 0, 0, 0), bits: 32 } ] ],
	[ `as112v6`, [ { ip: fromHextets(0x20_01, 0x4, 0x1_12, 0, 0, 0, 0, 0), bits: 48 } ] ],
	[ `deprecated`, [ { ip: fromHextets(0x20_01, 0x10, 0, 0, 0, 0, 0, 0), bits: 28 } ] ],
	[ `orchid2`, [ { ip: fromHextets(0x20_01, 0x20, 0, 0, 0, 0, 0, 0), bits: 28 } ] ]
])
