import { IPv4 } from "./IPv4"
import { CIDR, matchCIDR, type IPvXRangeDefaults, type RangeList, type StringSuggest, subnetMatch } from "./common"

export type IPv6Range = IPvXRangeDefaults | "uniqueLocal" | "ipv4Mapped" | "rfc6145" | "rfc6052" | "6to4" | "teredo"

export class IPv6 {
	/** Special IPv6 ranges */
	static SpecialRanges: RangeList<IPv6> = new Map([
		// RFC4291, here and after
		[ `unspecified`, [ { ip: this.fromHextets(0, 0, 0, 0, 0, 0, 0, 0), bits: 128 } ] ],
		[ `linkLocal`, [ { ip: this.fromHextets(0xFE_80, 0, 0, 0, 0, 0, 0, 0), bits: 10 } ] ],
		[ `multicast`, [ { ip: this.fromHextets(0xFF_00, 0, 0, 0, 0, 0, 0, 0), bits: 8 } ] ],
		[ `loopback`, [ { ip: this.fromHextets(0, 0, 0, 0, 0, 0, 0, 1), bits: 128 } ] ],
		[ `uniqueLocal`, [ { ip: this.fromHextets(0xFC_00, 0, 0, 0, 0, 0, 0, 0), bits: 7 } ] ],
		[ `ipv4Mapped`, [ { ip: this.fromHextets(0, 0, 0, 0, 0, 0xFF_FF, 0, 0), bits: 96 } ] ],
		// RFC6145
		[ `rfc6145`, [ { ip: this.fromHextets(0, 0, 0, 0, 0xFF_FF, 0, 0, 0), bits: 96 } ] ],
		// RFC6052
		[ `rfc6052`, [ { ip: this.fromHextets(0x64, 0xFF_9B, 0, 0, 0, 0, 0, 0), bits: 96 } ] ],
		// RFC3056
		[ `6to4`, [ { ip: this.fromHextets(0x20_02, 0, 0, 0, 0, 0, 0, 0), bits: 16 } ] ],
		// RFC6052, RFC6146
		[ `teredo`, [ { ip: this.fromHextets(0x20_01, 0, 0, 0, 0, 0, 0, 0), bits: 32 } ] ],
		// RFC4291
		[ `reserved`, [ { ip: this.fromHextets(0x20_01, 0xD_B8, 0, 0, 0, 0, 0, 0), bits: 32 } ] ],
		[ `benchmarking`, [ { ip: this.fromHextets(0x20_01, 0x2, 0, 0, 0, 0, 0, 0), bits: 48 } ] ],
		[ `amt`, [ { ip: this.fromHextets(0x20_01, 0x3, 0, 0, 0, 0, 0, 0), bits: 32 } ] ],
		[ `as112v6`, [ { ip: this.fromHextets(0x20_01, 0x4, 0x1_12, 0, 0, 0, 0, 0), bits: 48 } ] ],
		[ `deprecated`, [ { ip: this.fromHextets(0x20_01, 0x10, 0, 0, 0, 0, 0, 0), bits: 28 } ] ],
		[ `orchid2`, [ { ip: this.fromHextets(0x20_01, 0x20, 0, 0, 0, 0, 0, 0), bits: 28 } ] ]
	])

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
		return new this(new Uint16Array([ hextet0, hextet1, hextet2, hextet3, hextet4, hextet5, hextet6, hextet7 ]), zoneId)
	}

	/** A utility function to return broadcast address given the IPv6 interface and prefix length in CIDR notation */
	static broadcastAddressFromCIDR(addr: string): IPv6 {
		try {
			const cidr = this.parseCIDR(addr)
			const ipInterfaceOctets = cidr.ip.toByteArray()
			const subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr.bits).toByteArray()

			return this.fromBytes(
				ipInterfaceOctets[0]! | (subnetMaskOctets[0]! ^ 255),
				ipInterfaceOctets[1]! | (subnetMaskOctets[1]! ^ 255),
				ipInterfaceOctets[2]! | (subnetMaskOctets[2]! ^ 255),
				ipInterfaceOctets[3]! | (subnetMaskOctets[3]! ^ 255),
				ipInterfaceOctets[4]! | (subnetMaskOctets[4]! ^ 255),
				ipInterfaceOctets[5]! | (subnetMaskOctets[5]! ^ 255),
				ipInterfaceOctets[6]! | (subnetMaskOctets[6]! ^ 255),
				ipInterfaceOctets[7]! | (subnetMaskOctets[7]! ^ 255),
				ipInterfaceOctets[8]! | (subnetMaskOctets[8]! ^ 255),
				ipInterfaceOctets[9]! | (subnetMaskOctets[9]! ^ 255),
				ipInterfaceOctets[10]! | (subnetMaskOctets[10]! ^ 255),
				ipInterfaceOctets[11]! | (subnetMaskOctets[11]! ^ 255),
				ipInterfaceOctets[12]! | (subnetMaskOctets[12]! ^ 255),
				ipInterfaceOctets[13]! | (subnetMaskOctets[13]! ^ 255),
				ipInterfaceOctets[14]! | (subnetMaskOctets[14]! ^ 255),
				ipInterfaceOctets[15]! | (subnetMaskOctets[15]! ^ 255)
			)
		} catch (error) {
			throw Error(`The address does not have IPv6 CIDR format (${error})`)
		}
	}

	/** Checks if a given string is formatted like IPv6 address. */
	static isIPv6(addr: string): boolean {
		return Boolean(this.parser(addr))
	}

	/** Checks to see if string is a valid IPv6 Address. */
	static isValid(addr: string): boolean {
		// Since IPv6.isValid is always called first, this shortcut
		// provides a substantial performance gain.
		if (!addr.includes(`:`))
			return false

		try {
			const parsedAddress = this.parser(addr)

			if (!parsedAddress)
				return false

			for (const part of parsedAddress.parts) {
				if (part < 0 || part > 0xFF_FF)
					return false
			}

			// eslint-disable-next-line no-new
			new this(new Uint16Array(parsedAddress.parts), parsedAddress.zoneId)

			return true
		} catch {
			return false
		}
	}

	/** A utility function to return network address given the IPv6 interface and prefix length in CIDR notation. */
	static networkAddressFromCIDR(addr: string): IPv6 {
		try {
			const cidr = this.parseCIDR(addr)
			const ipInterfaceOctets = cidr.ip.toByteArray()
			const subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr.bits).toByteArray()

			// Network address is bitwise AND between ip interface and mask
			return this.fromBytes(
				ipInterfaceOctets[0]! & subnetMaskOctets[0]!,
				ipInterfaceOctets[1]! & subnetMaskOctets[1]!,
				ipInterfaceOctets[2]! & subnetMaskOctets[2]!,
				ipInterfaceOctets[3]! & subnetMaskOctets[3]!,
				ipInterfaceOctets[4]! & subnetMaskOctets[4]!,
				ipInterfaceOctets[5]! & subnetMaskOctets[5]!,
				ipInterfaceOctets[6]! & subnetMaskOctets[6]!,
				ipInterfaceOctets[7]! & subnetMaskOctets[7]!,
				ipInterfaceOctets[8]! & subnetMaskOctets[8]!,
				ipInterfaceOctets[9]! & subnetMaskOctets[9]!,
				ipInterfaceOctets[10]! & subnetMaskOctets[10]!,
				ipInterfaceOctets[11]! & subnetMaskOctets[11]!,
				ipInterfaceOctets[12]! & subnetMaskOctets[12]!,
				ipInterfaceOctets[13]! & subnetMaskOctets[13]!,
				ipInterfaceOctets[14]! & subnetMaskOctets[14]!,
				ipInterfaceOctets[15]! & subnetMaskOctets[15]!
			)
		} catch (error) {
			throw Error(`The address does not have IPv6 CIDR format`, { cause: error })
		}
	}

	/** Tries to parse and validate a string with IPv6 address.
	  * Throws an error if it fails. */
	static parse(addr: string): IPv6 {
		const parsedAddress = this.parser(addr)

		if (!parsedAddress)
			throw Error(`String is not formatted like an IPv6 Address`)

		return new this(new Uint16Array(parsedAddress.parts), parsedAddress.zoneId)
	}

	static parseCIDR(addr: string): CIDR<IPv6> {
		const match = /^(.+)\/(\d+)$/.exec(addr)

		if (match) {
			const maskLength = parseInt(match[2]!)

			if (maskLength >= 0 && maskLength <= 128)
				return new CIDR(this.parse(match[1]!), maskLength)
		}

		throw Error(`String is not formatted like an IPv6 CIDR range`)
	}

	/** Parse an IPv6 address. */
	static parser(string: string): { parts: number[], zoneId: string | undefined } | undefined {
		let match

		if ((match = /^::((\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)(%[\da-z]+)?)$/i.exec(string)))
			return this.parser(`::ffff:${match[1]}`)

		if (/^(?:::)?(?:[\da-f]+::?)*[\da-f]*(?:::)?(?:%[\da-z]+)?$/i.test(string))
			return expandIPv6(string, 8)

		if ((match = /^((?:[\da-f]+::?)+|::(?:[\da-f]+::?)*)(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)(%[\da-z]+)?$/i.exec(string))) {
			const address = expandIPv6(match[1]!.slice(0, -1) + (match[6] || ``), 6)!

			if (address.parts) {
				const octets = [ parseInt(match[2]!), parseInt(match[3]!), parseInt(match[4]!), parseInt(match[5]!) ]

				for (const octet of octets) {
					if (octet < 0 || octet > 255)
						return
				}

				address.parts.push((octets[0]! << 8) | octets[1]!, (octets[2]! << 8) | octets[3]!)

				return { parts: address.parts, zoneId: address.zoneId }
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
		const /** number of zeros in octet */ zerotable: Record<number, number> = {
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
		}

		let /** non-zero encountered stop scanning for zeros */ stop = false
		let cidr = 0

		for (let index = 8; index--;) {
			const zeros = zerotable[this.hextets[index]!]

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
		return subnetMatch(this, IPv6.SpecialRanges)
	}

	/** @returns An array of byte-sized values in network order (MSB first). */
	toByteArray(): Uint8Array {
		const u8View = new Uint8Array(this.hextets.buffer)

		return new Uint8Array([
			u8View[1]!, u8View[0]!, u8View[3]!, u8View[2]!, u8View[5]!, u8View[4]!, u8View[7]!, u8View[6]!, u8View[9]!,
			u8View[8]!, u8View[11]!, u8View[10]!, u8View[13]!, u8View[12]!, u8View[15]!, u8View[14]!
		])
	}

	/** Returns the address in expanded format with all zeros included, like
	  * `2001:0db8:0008:0066:0000:0000:0000:0001`. */
	toFixedLengthString(): string {
		return [ ...this.hextets ].map(part => part.toString(16).padStart(4, `0`)).join(`:`) +
			(this.zoneId ? `%${this.zoneId}` : ``)
	}

	/** Converts this address to IPv4 address if it is an IPv4-mapped IPv6 address.
	  * Throws an error otherwise. */
	toIPv4Address(): IPv4 {
		if (!this.isIPv4MappedAddress())
			throw Error(`Trying to convert a generic ipv6 address to ipv4`)

		const u8View = new Uint8Array(this.hextets.buffer)

		return IPv4.fromBytes(u8View[13]!, u8View[12]!, u8View[15]!, u8View[14]!)
	}

	/** @returns The address in expanded format with all zeros included, like `2001:db8:8:66:0:0:0:1`.
	  * @deprecated Use {@link toFixedLengthString()} instead. */
	toNormalizedString(): string {
		return `${[ ...this.hextets ].map(hextet => hextet.toString(16)).join(`:`)}${
			this.zoneId ? `%${this.zoneId}` : ``}`
	}

	/** @returns The address in compact, human-readable format like `2001:db8:8:66::1` in line with RFC 5952.
	  * @see https://tools.ietf.org/html/rfc5952#section-4 */
	toRFC5952String(): string {
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

		return `${string.slice(0, Math.max(0, bestMatchIndex))}::${string.slice(Math.max(0, bestMatchIndex + bestMatchLength))}`
	}

	/** @returns The address in compact, human-readable format like `2001:db8:8:66::1`. */
	toString(): string {
		return this.toRFC5952String()
	}
}

/** Expand :: in an IPv6 address or address part consisting of `parts` groups. */
function expandIPv6(string: string, parts: number): { parts: number[], zoneId: string | undefined } | undefined {
	// More than one '::' means invalid adddress
	if (string.includes(`::`, string.indexOf(`::`) + 1))
		return

	let zoneId = /%[\da-z]+/i.exec(string)?.[0]

	// Remove zone index and save it for later
	if (zoneId) {
		zoneId = zoneId.slice(1)
		string = string.replace(/%.+$/, ``)
	}

	let /** How many parts do we already have? */ colonCount = string.match(/:/g)?.length ?? 0

	// 0::0 is two parts more than ::
	if (string.slice(0, 2) == `::`)
		colonCount--

	if (string.slice(-2) == `::`)
		colonCount--

	// The following loop would hang if colonCount > parts
	if (colonCount > parts)
		return

	// Insert the missing zeros
	string = string.replace(`::`, `:${`0:`.repeat(parts - colonCount)}`)

	// Trim any garbage which may be hanging around if :: was at the edge in
	// the source strin
	if (string[0] == `:`)
		string = string.slice(1)

	if (string.at(-1) == `:`)
		string = string.slice(0, -1)

	return { parts: string.split(`:`).map(hex => parseInt(hex, 16)), zoneId }
}
