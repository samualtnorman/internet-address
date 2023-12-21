import { IPv4 } from "./IPv4"
import { CIDR, matchCIDR, subnetMatch, type IPvXRangeDefaults, type RangeList, type StringSuggest } from "./common"

export type IPv6Range = IPvXRangeDefaults | "uniqueLocal" | "ipv4Mapped" | "rfc6145" | "rfc6052" | "6to4" | "teredo"

export class IPv6 {
	constructor(
		/** 8 big-endian 16-bit unsigned integers */ public readonly hextets: Uint16Array,
		public zoneId?: string
	) {
		if (hextets.length != 8)
			throw Error(`Hextets Uint16Array must have a length of 8`)
	}

	static fromBytes(
		byte0: number, byte1: number, byte2: number, byte3: number, byte4: number, byte5: number, byte6: number,
		byte7: number, byte8: number, byte9: number, byte10: number, byte11: number, byte12: number, byte13: number,
		byte14: number, byte15: number, zoneId?: string
	) {
		return new this(new Uint16Array(new Uint8Array([
			byte1, byte0, byte3, byte2, byte5, byte4, byte7, byte6, byte9,
			byte8, byte11, byte10, byte13, byte12, byte15, byte14
		]).buffer), zoneId)
	}

	static fromHextets(
		hextet0: number, hextet1: number, hextet2: number, hextet3: number, hextet4: number, hextet5: number,
		hextet6: number, hextet7: number, zoneId?: string
	) {
		return new
			this(new Uint16Array([ hextet0, hextet1, hextet2, hextet3, hextet4, hextet5, hextet6, hextet7 ]), zoneId)
	}

	/** @returns Broadcast adress from parsed CIDR or `undefined` if invalid CIDR string */
	static broadcastAddressFromCIDR(address: string): IPv6 | undefined {
		const cidr = this.parseCIDR(address)

		if (cidr) {
			const subnetMask = this.subnetMaskFromPrefixLength(cidr.bits)

			cidr.ip.zoneId = undefined

			for (let index = 16; index--;)
				cidr.ip.hextets[index] |= subnetMask.hextets[index]! ^ 0xFF_FF

			return cidr.ip
		}
	}

	/** @returns Network address from parsed CIDR or `undefined` if invalid CIDR string */
	static networkAddressFromCIDR(address: string): IPv6 | undefined {
		const cidr = this.parseCIDR(address)

		if (cidr) {
			const subnetMask = this.subnetMaskFromPrefixLength(cidr.bits)

			cidr.ip.zoneId = undefined

			for (let index = 16; index--;)
				cidr.ip.hextets[index] &= subnetMask.hextets[index]!

			return cidr.ip
		}
	}

	/** @returns parsed `CIDR` or `undefined` if invalid */
	static parseCIDR(addr: string): CIDR<IPv6> | undefined {
		const match = /^(.+)\/(\d+)$/.exec(addr)

		if (match) {
			const maskLength = parseInt(match[2]!)

			if (maskLength >= 0 && maskLength <= 128) {
				const parsed = this.parse(match[1]!)

				if (parsed)
					return new CIDR(parsed, maskLength)
			}
		}
	}

	/** @returns Parsed IPv6 or `undefined` if invalid. */
	static parse(string: string): IPv6 | undefined {
		if (!string.includes(`:`))
			return

		let match

		if ((match =
			/^::((\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)(%[\da-z]+)?)$/i.exec(string))
		)
			return this.parse(`::FFFF:${match[1]}`)

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
	static subnetMaskFromPrefixLength(prefix: number): IPv6 {
		if (prefix < 0 || prefix > 128)
			throw Error(`Invalid IPv6 prefix length`)

		const subnetMask = this.fromHextets(0, 0, 0, 0, 0, 0, 0, 0)
		const filledHextetCount = Math.floor(prefix / 16)

		for (let index = 0; index < filledHextetCount; index++)
			subnetMask.hextets[index] = 0xFF_FF

		if (filledHextetCount < 32)
			subnetMask.hextets[filledHextetCount] = ((2 ** (prefix % 16)) - 1) << (16 - (prefix % 16))

		return subnetMask
	}

	/** Checks if this address is an IPv4-mapped IPv6 address. */
	isIPv4MappedAddress(): boolean {
		return this.range() == `ipv4Mapped`
	}

	/** Checks if this address matches other one within given CIDR range. */
	match(what: IPv6, bits: number): boolean {
		return matchCIDR(this.hextets, what.hextets, 16, bits)
	}

	matchCIDR(cidr: CIDR<IPv6>) {
		return this.match(cidr.ip, cidr.bits)
	}

	/** @returns Number of leading ones, making sure that the rest is a solid sequence of zeros (valid netmask)
	  * @returns Either the CIDR length or undefined if mask is not valid */
	prefixLengthFromSubnetMask(): number | undefined {
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
			}[this.hextets[index]!]

			if (zeros == undefined || (stop && zeros != 0))
				return

			if (zeros != 16)
				stop = true

			cidr += zeros
		}

		return 128 - cidr
	}

	/** Checks if the address corresponds to one of the special ranges. */
	range(): StringSuggest<IPv6Range> {
		return subnetMatch(this, SpecialRanges)
	}

	// /** @returns An array of byte-sized values in network order (MSB first). */
	// toByteArray(): Uint8Array {
	// 	const u8View = new Uint8Array(this.hextets.buffer)

	// 	return new Uint8Array([
	// 		u8View[1]!, u8View[0]!, u8View[3]!, u8View[2]!, u8View[5]!, u8View[4]!, u8View[7]!, u8View[6]!, u8View[9]!,
	// 		u8View[8]!, u8View[11]!, u8View[10]!, u8View[13]!, u8View[12]!, u8View[15]!, u8View[14]!
	// 	])
	// }

	/** Returns the address in expanded format with all zeros included, like
	  * `2001:0db8:0008:0066:0000:0000:0000:0001`. */
	toFixedLengthString(): string {
		return [ ...this.hextets ].map(part => part.toString(16).padStart(4, `0`)).join(`:`) +
			(this.zoneId ? `%${this.zoneId}` : ``)
	}

	/** @returns IPv4 address of IPv4-mapped IPv6 address or `undefined` if it is not. */
	toIPv4Address(): IPv4 | undefined {
		if (this.isIPv4MappedAddress()) {
			const u8View = new Uint8Array(this.hextets.buffer)

			return IPv4.fromBytes(u8View[13]!, u8View[12]!, u8View[15]!, u8View[14]!)
		}
	}

	/** @returns The address in expanded format with all zeros included, like `2001:db8:8:66:0:0:0:1`.
	  * @deprecated Use {@link toFixedLengthString()} instead. */
	toNormalizedString(): string {
		return `${[ ...this.hextets ].map(hextet => hextet.toString(16)).join(`:`)}${
			this.zoneId ? `%${this.zoneId}` : ``}`
	}

	/** @returns The address in compact, human-readable format like `2001:db8:8:66::1` in line with RFC 5952.
	  * @see https://tools.ietf.org/html/rfc5952#section-4 */
	toString(): string {
		const regex = /(?:^|:)(?:0(?::|$)){2,}/g
		const string = this.toNormalizedString()
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

			return new IPv6(u16View, zoneId)
		}
	}
}

/** Special IPv6 ranges */
const SpecialRanges: RangeList<IPv6> = new Map([
	// RFC4291, here and after
	[ `unspecified`, [ { ip: IPv6.fromHextets(0, 0, 0, 0, 0, 0, 0, 0), bits: 128 } ] ],
	[ `linkLocal`, [ { ip: IPv6.fromHextets(0xFE_80, 0, 0, 0, 0, 0, 0, 0), bits: 10 } ] ],
	[ `multicast`, [ { ip: IPv6.fromHextets(0xFF_00, 0, 0, 0, 0, 0, 0, 0), bits: 8 } ] ],
	[ `loopback`, [ { ip: IPv6.fromHextets(0, 0, 0, 0, 0, 0, 0, 1), bits: 128 } ] ],
	[ `uniqueLocal`, [ { ip: IPv6.fromHextets(0xFC_00, 0, 0, 0, 0, 0, 0, 0), bits: 7 } ] ],
	[ `ipv4Mapped`, [ { ip: IPv6.fromHextets(0, 0, 0, 0, 0, 0xFF_FF, 0, 0), bits: 96 } ] ],
	// RFC6145
	[ `rfc6145`, [ { ip: IPv6.fromHextets(0, 0, 0, 0, 0xFF_FF, 0, 0, 0), bits: 96 } ] ],
	// RFC6052
	[ `rfc6052`, [ { ip: IPv6.fromHextets(0x64, 0xFF_9B, 0, 0, 0, 0, 0, 0), bits: 96 } ] ],
	// RFC3056
	[ `6to4`, [ { ip: IPv6.fromHextets(0x20_02, 0, 0, 0, 0, 0, 0, 0), bits: 16 } ] ],
	// RFC6052, RFC6146
	[ `teredo`, [ { ip: IPv6.fromHextets(0x20_01, 0, 0, 0, 0, 0, 0, 0), bits: 32 } ] ],
	// RFC4291
	[ `reserved`, [ { ip: IPv6.fromHextets(0x20_01, 0xD_B8, 0, 0, 0, 0, 0, 0), bits: 32 } ] ],
	[ `benchmarking`, [ { ip: IPv6.fromHextets(0x20_01, 0x2, 0, 0, 0, 0, 0, 0), bits: 48 } ] ],
	[ `amt`, [ { ip: IPv6.fromHextets(0x20_01, 0x3, 0, 0, 0, 0, 0, 0), bits: 32 } ] ],
	[ `as112v6`, [ { ip: IPv6.fromHextets(0x20_01, 0x4, 0x1_12, 0, 0, 0, 0, 0), bits: 48 } ] ],
	[ `deprecated`, [ { ip: IPv6.fromHextets(0x20_01, 0x10, 0, 0, 0, 0, 0, 0), bits: 28 } ] ],
	[ `orchid2`, [ { ip: IPv6.fromHextets(0x20_01, 0x20, 0, 0, 0, 0, 0, 0), bits: 28 } ] ]
])
