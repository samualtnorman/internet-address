/* eslint-disable unicorn/throw-new-error, unicorn/prefer-spread, prefer-named-capture-group,
	regexp/no-unused-capturing-group, radix, unicorn/prevent-abbreviations */
// eslint-disable-next-line @typescript-eslint/ban-types
type StringSuggest<T> = (string & {}) | T

export type IPvXRangeDefaults = "unicast" | "unspecified" | "multicast" | "linkLocal" | "loopback" | "reserved"
export type IPv4Range = IPvXRangeDefaults | "broadcast" | "carrierGradeNat" | "private"
export type IPv6Range = IPvXRangeDefaults | "uniqueLocal" | "ipv4Mapped" | "rfc6145" | "rfc6052" | "6to4" | "teredo"

class CIDR<IP extends IPv4 | IPv6> {
	constructor(public ip: IP, public bits: number) {}

	toString() {
		return `${this.ip}/${this.bits}`
	}
}

export type RangeList<T extends IPv4 | IPv6> = Map<StringSuggest<T extends IPv4 ? IPv4Range : IPv6Range>, CIDR<T>[]>

// A list of regular expressions that match arbitrary IPv4 addresses,
// for which a number of weird notations exist.
// Note that an address like 0010.0xa5.1.1 is considered legal.

const ipv4Regexes = {
	fourOctet: /^(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)$/i,
	threeOctet: /^(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)$/i,
	twoOctet: /^(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)$/i,
	longValue: /^(\d+|0x[a-f\d]+)$/i
}

// Regular Expression for checking Octal numbers
const octalRegex = /^0[0-7]+$/
const hexRegex = /^0x[a-f\d]+$/i

// IPv6-matching regular expressions.
// For IPv6, the task is simpler: it is enough to match the colon-delimited
// hexadecimal IPv6 and a transitional variant with dotted-decimal IPv4 at
// the end.

const ipv6Regexes = {
	zoneIndex: /%[\da-z]+/i,
	native: /^(::)?((?:[\da-f]+::?)+)?([\da-f]+)?(::)?(%[\da-z]+)?$/i,
	deprecatedTransitional: /^::((\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)(%[\da-z]+)?)$/i,
	transitional: /^((?:[\da-f]+::?)+|::(?:[\da-f]+::?)*)(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)(%[\da-z]+)?$/i
}

// Expand :: in an IPv6 address or address part consisting of `parts` groups.
function expandIPv6(string: string, parts: number): { parts: number[], zoneId: string | undefined } | undefined {
	// More than one '::' means invalid adddress
	if (string.includes(`::`, string.indexOf(`::`) + 1))
		return

	let zoneId = ipv6Regexes.zoneIndex.exec(string)?.[0]

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

/** A generic CIDR (Classless Inter-Domain Routing) RFC1518 range matcher. */
function matchCIDR(first: { [index: number]: number, length: number }, second: { [index: number]: number, length: number }, partSize: number, cidrBits: number) {
	if (first.length != second.length)
		throw Error(`Cannot match CIDR for objects with different lengths`)

	for (let part = 0; cidrBits > 0; part += 1) {
		const shift = Math.max(partSize - cidrBits, 0)

		if (first[part]! >> shift != second[part]! >> shift)
			return false

		cidrBits -= partSize
	}

	return true
}

function parseIntAuto(string: string) {
	// Hexadedimal base 16 (0x#)
	if (hexRegex.test(string))
		return parseInt(string, 16)

	// While octal representation is discouraged by ECMAScript 3
	// and forbidden by ECMAScript 5, we silently allow it to
	// work only if the rest of the string has numbers less than 8.
	if (string[0] === `0` && !isNaN(parseInt(string[1]!, 10))) {
		if (octalRegex.test(string))
			return parseInt(string, 8)

		throw Error(`Cannot parse ${JSON.stringify(string)} as octal`)
	}

	// Always include the base 10 radix!
	return parseInt(string, 10)
}

export class IPv4 {
	/** Special IPv4 address ranges.
	  * @see https://en.wikipedia.org/wiki/Reserved_IP_addresses */
	static SpecialRanges: RangeList<IPv4> = new Map([
		[ `unspecified`, [ { ip: IPv4.fromBytes(0, 0, 0, 0), bits: 8 } ] ],
		[ `broadcast`, [ { ip: IPv4.fromBytes(255, 255, 255, 255), bits: 32 } ] ],
		// RFC3171
		[ `multicast`, [ { ip: IPv4.fromBytes(224, 0, 0, 0), bits: 4 } ] ],
		// RFC3927
		[ `linkLocal`, [ { ip: IPv4.fromBytes(169, 254, 0, 0), bits: 16 } ] ],
		// RFC5735
		[ `loopback`, [ { ip: IPv4.fromBytes(127, 0, 0, 0), bits: 8 } ] ],
		// RFC6598
		[ `carrierGradeNat`, [ { ip: IPv4.fromBytes(100, 64, 0, 0), bits: 10 } ] ],
		// RFC1918
		[ `private`, [
			{ ip: IPv4.fromBytes(10, 0, 0, 0), bits: 8 },
			{ ip: IPv4.fromBytes(172, 16, 0, 0), bits: 12 },
			{ ip: IPv4.fromBytes(192, 168, 0, 0), bits: 16 }
		] ],
		// Reserved and testing-only ranges; RFCs 5735, 5737, 2544, 1700
		[ `reserved`, [
			{ ip: IPv4.fromBytes(192, 0, 0, 0), bits: 24 },
			{ ip: IPv4.fromBytes(192, 0, 2, 0), bits: 24 },
			{ ip: IPv4.fromBytes(192, 88, 99, 0), bits: 24 },
			{ ip: IPv4.fromBytes(198, 18, 0, 0), bits: 15 },
			{ ip: IPv4.fromBytes(198, 51, 100, 0), bits: 24 },
			{ ip: IPv4.fromBytes(203, 0, 113, 0), bits: 24 },
			{ ip: IPv4.fromBytes(240, 0, 0, 0), bits: 4 }
		] ]
	])

	/** Constructs a new IPv4 address from an array of four octets
	  * in network order (MSB first)
	  * Verifies the input. */
	constructor(/** 4 bytes */ public readonly octets: Uint8Array) {
		if (octets.length !== 4)
			throw Error(`IPv4 octets should have a length of 4`)
	}

	static fromBytes(byte0: number, byte1: number, byte2: number, byte3: number): IPv4 {
		return new IPv4(new Uint8Array([ byte0, byte1, byte2, byte3 ]))
	}

	/** A utility function to return broadcast address given the IPv4 interface and prefix length in CIDR notation */
	static broadcastAddressFromCIDR(addr: string): IPv4 {
		try {
			const cidr = this.parseCIDR(addr)
			const ipInterfaceOctets = cidr.ip.toByteArray()
			const subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr.bits).toByteArray()

			return this.fromBytes(
				ipInterfaceOctets[0]! | (subnetMaskOctets[0]! ^ 255),
				ipInterfaceOctets[1]! | (subnetMaskOctets[1]! ^ 255),
				ipInterfaceOctets[2]! | (subnetMaskOctets[2]! ^ 255),
				ipInterfaceOctets[3]! | (subnetMaskOctets[3]! ^ 255)
			)
		} catch {
			throw Error(`The address does not have IPv4 CIDR format`)
		}
	}

	/** Checks if a given string is formatted like IPv4 address. */
	static isIPv4(address: string): boolean {
		return Boolean(this.parser(address))
	}

	/** Checks if a given string is a valid IPv4 address. */
	static isValid(addr: string): boolean {
		try {
			const parts = this.parser(addr)

			if (!parts)
				return false

			for (const part of parts) {
				if (part < 0 || part > 0xFF)
					return false
			}

			// TODO I'm pretty sure this can't throw making try catch unnecessary
			this.fromBytes(...parts)

			return true
		} catch {
			return false
		}
	}

	/** Checks if a given string is a full four-part IPv4 Address. */
	static isValidFourPartDecimal(addr: string): boolean {
		return IPv4.isValid(addr) && Boolean(/^(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*)){3}$/.test(addr))
	}

	/** A utility function to return network address given the IPv4 interface and prefix length in CIDR notation */
	static networkAddressFromCIDR(addr: string): IPv4 {
		try {
			const cidr = this.parseCIDR(addr)
			const ipInterfaceOctets = cidr.ip.toByteArray()
			const subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr.bits).toByteArray()

			return this.fromBytes(
				ipInterfaceOctets[0]! & subnetMaskOctets[0]!,
				ipInterfaceOctets[1]! & subnetMaskOctets[1]!,
				ipInterfaceOctets[2]! & subnetMaskOctets[2]!,
				ipInterfaceOctets[3]! & subnetMaskOctets[3]!
			)
		} catch {
			throw Error(`The address does not have IPv4 CIDR format`)
		}
	}

	/** Tries to parse and validate a string with IPv4 address.
	  * Throws an error if it fails. */
	static parse(addr: string): IPv4 {
		const parts = this.parser(addr)

		if (!parts)
			throw Error(`String is not formatted like an IPv4 Address`)

		return this.fromBytes(...parts)
	}

	/** Parses the string as an IPv4 Address with CIDR Notation. */
	static parseCIDR(address: string): CIDR<IPv4> {
		const match = /^(.+)\/(\d+)$/.exec(address)

		if (match) {
			const maskLength = Number(match[2])

			if (match[1] && maskLength >= 0 && maskLength <= 32)
				return new CIDR(this.parse(match[1]), maskLength)
		}

		throw Error(`String is not formatted like an IPv4 CIDR range`)
	}

	/** Classful variants (like a.b, where a is an octet, and b is a 24-bit
	  * value representing last three octets; this corresponds to a class C
	  * address) are omitted due to classless nature of modern Internet. */
	static parser(string: string): [ number, number, number, number ] | undefined {
		let match

		// parseInt recognizes all that octal & hexadecimal weirdness for us
		if ((match = ipv4Regexes.fourOctet.exec(string))) {
			return [
				parseIntAuto(match[1]!),
				parseIntAuto(match[2]!),
				parseIntAuto(match[3]!),
				parseIntAuto(match[4]!)
			]
		}

		if ((match = ipv4Regexes.longValue.exec(string))) {
			const value = parseIntAuto(match[1]!)

			if (value > 0xFF_FF_FF_FF || value < 0)
				throw Error(`Address part outside defined range`)

			return [ (value >> 24) & 0xFF, (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF ]
		}

		if ((match = ipv4Regexes.twoOctet.exec(string))) {
			const firstOctet = parseIntAuto(match[1]!)
			const lastOctets = parseIntAuto(match[2]!)

			if (firstOctet > 0xFF || firstOctet < 0 || lastOctets > 0xFF_FF_FF || lastOctets < 0)
				throw Error(`Address part outside defined range`)

			return [ firstOctet, (lastOctets >> 16) & 0xFF, (lastOctets >> 8) & 0xFF, lastOctets & 0xFF ]
		}

		if ((match = ipv4Regexes.threeOctet.exec(string))) {
			const firstOctet = parseIntAuto(match[1]!)
			const secondOctet = parseIntAuto(match[2]!)
			const lastOctets = parseIntAuto(match[3]!)

			if (
				firstOctet > 0xFF || firstOctet < 0 || secondOctet > 0xFF ||
				secondOctet < 0 || lastOctets > 0xFF_FF || lastOctets < 0
			)
				throw Error(`Address part outside defined range`)

			return [ firstOctet, secondOctet, (lastOctets >> 8) & 0xFF, lastOctets & 0xFF ]
		}
	}

	/** A utility function to return subnet mask in IPv4 format given the prefix length */
	static subnetMaskFromPrefixLength(prefix: number): IPv4 {
		if (prefix < 0 || prefix > 32)
			throw Error(`Invalid IPv4 prefix length`)

		const octets: [ number, number, number, number ] = [ 0, 0, 0, 0 ]
		const filledOctetCount = Math.floor(prefix / 8)

		for (let i = filledOctetCount; i--;)
			octets[i] = 255

		if (filledOctetCount < 4)
			octets[filledOctetCount] = (2 ** (prefix % 8)) - 1 << 8 - (prefix % 8)

		return this.fromBytes(...octets)
	}

	/** Checks if this address matches other one within given CIDR range. */
	match(what: IPv4, bits: number): boolean {
		return matchCIDR(this.octets, what.octets, 8, bits)
	}

	matchCIDR(cidr: CIDR<IPv4>): boolean {
		return this.match(cidr.ip, cidr.bits)
	}

	/** returns a number of leading ones in IPv4 address, making sure that the rest is a solid sequence of zeros
	  * (valid netmask)
	  * @returns Either the CIDR length or `undefined` if mask is not valid */
	prefixLengthFromSubnetMask(): number | undefined {
		const /** number of zeros in octet */ zerotable: Record<number, number> =
			{ 0: 8, 128: 7, 192: 6, 224: 5, 240: 4, 248: 3, 252: 2, 254: 1, 255: 0 }

		let /** non-zero encountered stop scanning for zeros */ stop = false
		let cidr = 0

		for (let i = 4; i--;) {
			const zeros = zerotable[this.octets[i]!]

			if (zeros == undefined || (stop && zeros != 0))
				return

			if (zeros != 8)
				stop = true

			cidr += zeros
		}

		return 32 - cidr
	}

	/** Checks if the address corresponds to one of the special ranges. */
	range(): StringSuggest<IPv4Range> {
		return subnetMatch(this, IPv4.SpecialRanges)
	}

	/** @returns An array of byte-sized values in network order (MSB first) */
	toByteArray(): Uint8Array {
		return this.octets.slice()
	}

	/** Converts this IPv4 address to an IPv4-mapped IPv6 address. */
	toIPv4MappedAddress(): IPv6 {
		return IPv6.parse(`::ffff:${this.toString()}`)
	}

	/** Symmetrical method strictly for aligning with the IPv6 methods. */
	toNormalizedString(): string {
		return this.toString()
	}

	/** @returns The address in convenient, decimal-dotted format. */
	toString(): string {
		return this.octets.join(`.`)
	}
}

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

		if ((match = ipv6Regexes.deprecatedTransitional.exec(string)))
			return this.parser(`::ffff:${match[1]}`)

		if (ipv6Regexes.native.test(string))
			return expandIPv6(string, 8)

		if ((match = ipv6Regexes.transitional.exec(string))) {
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

		for (let i = 0; i < filledHextetCount; i++)
			subnetMask.hextets[i] = 0xFF_FF

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

		for (let i = 8; i--;) {
			const zeros = zerotable[this.hextets[i]!]

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
		const regex = /((^|:)(0(:|$)){2,})/g
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

/** Try to parse an array in network order (MSB first) for IPv4 and IPv6. */
export function fromByteArray(bytes: number[]): IPv4 | IPv6 {
	if (bytes.length == 4)
		return IPv4.fromBytes(...bytes as [ number, number, number, number ])

	if (bytes.length == 16)
		return IPv6.fromBytes(...bytes as [ number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number ])

	throw Error(`The binary input is neither an IPv6 nor IPv4 address`)
}

/** Checks if the address is valid IP address. */
export function isValid(address: string): boolean {
	return IPv6.isValid(address) || IPv4.isValid(address)
}

/** Attempts to parse an IP Address, first through IPv6 then IPv4.
  * Throws an error if it could not be parsed. */
export function parse(address: string): IPv4 | IPv6 {
	if (IPv6.isValid(address))
		return IPv6.parse(address)

	if (IPv4.isValid(address))
		return IPv4.parse(address)

	throw Error(`The address has neither IPv6 nor IPv4 format`)
}

/** Attempt to parse CIDR notation, first through IPv6 then IPv4.
  * Throws an error if it could not be parsed. */
export function parseCIDR(mask: string): CIDR<IPv4 | IPv6> {
	try {
		return IPv6.parseCIDR(mask)
	} catch {
		try {
			return IPv4.parseCIDR(mask)
		} catch {
			throw Error(`The address has neither IPv6 nor IPv4 CIDR format`)
		}
	}
}

/** Parse an address and return plain IPv4 address if it is an IPv4-mapped address. */
export function process(address: string): IPv4 | IPv6 {
	const parsedAddress = parse(address)

	if (parsedAddress instanceof IPv6 && parsedAddress.isIPv4MappedAddress())
		return parsedAddress.toIPv4Address()

	return parsedAddress
}

/** A utility function to ease named range matching. See examples below.
  * rangeList can contain both IPv4 and IPv6 subnet entries and will not throw errors
  * on matching IPv4 addresses to IPv6 ranges or vice versa. */
export function subnetMatch<T extends IPv4 | IPv6>(
	address: T,
	rangeList: RangeList<T>,
	defaultName: StringSuggest<T extends IPv4 ? IPv4Range : IPv6Range> = `unicast`
): StringSuggest<T extends IPv4 ? IPv4Range : IPv6Range> {
	if (address instanceof IPv4) {
		for (const [ rangeName, rangeSubnets ] of rangeList) {
			for (const subnet of rangeSubnets) {
				if (subnet.ip instanceof IPv4 && address.match(subnet.ip, subnet.bits))
					return rangeName
			}
		}
	} else {
		for (const [ rangeName, rangeSubnets ] of rangeList) {
			for (const subnet of rangeSubnets) {
				if (subnet.ip instanceof IPv6 && address.match(subnet.ip, subnet.bits))
					return rangeName
			}
		}
	}

	return defaultName
}
