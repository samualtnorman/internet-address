export type IPvXRangeDefaults = 'unicast' | 'unspecified' | 'multicast' | 'linkLocal' | 'loopback' | 'reserved';
export type IPv4Range = IPvXRangeDefaults | 'broadcast' | 'carrierGradeNat' | 'private';
export type IPv6Range = IPvXRangeDefaults | 'uniqueLocal' | 'ipv4Mapped' | 'rfc6145' | 'rfc6052' | '6to4' | 'teredo' | "benchmarking" | "amt" | "as112v6" | "deprecated" | "orchid2";

export type RangeList<T extends IPv4 | IPv6> = Map<T extends IPv4 ? IPv4Range : IPv6Range, { ip: T, bits: number }[]>

// A list of regular expressions that match arbitrary IPv4 addresses,
// for which a number of weird notations exist.
// Note that an address like 0010.0xa5.1.1 is considered legal.
const ipv4Part = '(0?\\d+|0x[a-f0-9]+)';
const ipv4Regexes = {
	fourOctet: new RegExp(`^${ipv4Part}\\.${ipv4Part}\\.${ipv4Part}\\.${ipv4Part}$`, 'i'),
	threeOctet: new RegExp(`^${ipv4Part}\\.${ipv4Part}\\.${ipv4Part}$`, 'i'),
	twoOctet: new RegExp(`^${ipv4Part}\\.${ipv4Part}$`, 'i'),
	longValue: new RegExp(`^${ipv4Part}$`, 'i')
};

// Regular Expression for checking Octal numbers
const octalRegex = new RegExp(`^0[0-7]+$`, 'i');
const hexRegex = new RegExp(`^0x[a-f0-9]+$`, 'i');

const zoneIndex = '%[0-9a-z]{1,}';

// IPv6-matching regular expressions.
// For IPv6, the task is simpler: it is enough to match the colon-delimited
// hexadecimal IPv6 and a transitional variant with dotted-decimal IPv4 at
// the end.
const ipv6Part = '(?:[0-9a-f]+::?)+';
const ipv6Regexes = {
	zoneIndex: new RegExp(zoneIndex, 'i'),
	'native': new RegExp(`^(::)?(${ipv6Part})?([0-9a-f]+)?(::)?(${zoneIndex})?$`, 'i'),
	deprecatedTransitional: new RegExp(`^(?:::)(${ipv4Part}\\.${ipv4Part}\\.${ipv4Part}\\.${ipv4Part}(${zoneIndex})?)$`, 'i'),
	transitional: new RegExp(`^((?:${ipv6Part})|(?:::)(?:${ipv6Part})?)${ipv4Part}\\.${ipv4Part}\\.${ipv4Part}\\.${ipv4Part}(${zoneIndex})?$`, 'i')
};

// Expand :: in an IPv6 address or address part consisting of `parts` groups.
function expandIPv6(string: string, parts: number): { parts: number[], zoneId: string | undefined } | null {
	// More than one '::' means invalid adddress
	if (string.includes("::", string.indexOf('::') + 1))
		return null

	let zoneId = string.match(ipv6Regexes.zoneIndex)?.[0]

	// Remove zone index and save it for later
	if (zoneId) {
		zoneId = zoneId.substring(1)
		string = string.replace(/%.+$/, "")
	}

	let /** How many parts do we already have? */ colonCount = string.match(/:/g)?.length ?? 0

	// 0::0 is two parts more than ::
	if (string.slice(0, 2) === "::")
		colonCount--

	if (string.slice(-2) === "::")
		colonCount--

	// The following loop would hang if colonCount > parts
	if (colonCount > parts)
		return null

	// Insert the missing zeroes
	string = string.replace('::', (':' + "0:".repeat(parts - colonCount)))

	// Trim any garbage which may be hanging around if :: was at the edge in
	// the source strin
	if (string[0] === ':')
		string = string.slice(1)

	if (string[string.length - 1] === ':')
		string = string.slice(0, -1)

	return { parts: string.split(':').map(hex => parseInt(hex, 16)), zoneId }
}

// A generic CIDR (Classless Inter-Domain Routing) RFC1518 range matcher.
function matchCIDR (first: { [index: number]: number, length: number }, second: { [index: number]: number, length: number }, partSize: number, cidrBits: number) {
	if (first.length !== second.length) {
		throw Error('ipaddr: cannot match CIDR for objects with different lengths');
	}

	let part = 0;
	let shift;

	while (cidrBits > 0) {
		shift = partSize - cidrBits;
		if (shift < 0) {
			shift = 0;
		}

		if (first[part]! >> shift !== second[part]! >> shift) {
			return false;
		}

		cidrBits -= partSize;
		part += 1;
	}

	return true;
}

function parseIntAuto (string: string) {
	// Hexadedimal base 16 (0x#)
	if (hexRegex.test(string))
		return parseInt(string, 16)

	// While octal representation is discouraged by ECMAScript 3
	// and forbidden by ECMAScript 5, we silently allow it to
	// work only if the rest of the string has numbers less than 8.
	if (string[0] === '0' && !isNaN(parseInt(string[1]!, 10))) {
		if (octalRegex.test(string))
			return parseInt(string, 8)

		throw Error(`ipaddr: cannot parse ${string} as octal`)
	}

	// Always include the base 10 radix!
	return parseInt(string, 10);
}

// TODO only used once, inline
function padPart (part: string, length: number) {
	while (part.length < length) {
		part = `0${part}`;
	}

	return part;
}

export class IPv4 {
	/** Constructs a new IPv4 address from an array of four octets
	  * in network order (MSB first)
	  * Verifies the input. */
	constructor(/** 4 bytes */ public octets: Uint8Array) {
		if (octets.length !== 4)
			throw Error("IPv4 octets should have a length of 4")
	}

	static fromBytes(byte0: number, byte1: number, byte2: number, byte3: number): IPv4 {
		return new IPv4(new Uint8Array([ byte0, byte1, byte2, byte3 ]))
	}

	// Special IPv4 address ranges.
	// See also https://en.wikipedia.org/wiki/Reserved_IP_addresses
	static SpecialRanges: RangeList<IPv4> = new Map([
		[ "unspecified", [ { ip: IPv4.fromBytes(0, 0, 0, 0), bits: 8 } ] ],
		[ "broadcast", [ { ip: IPv4.fromBytes(255, 255, 255, 255), bits: 32 } ] ],
		// RFC3171
		[ "multicast", [ { ip: IPv4.fromBytes(224, 0, 0, 0), bits: 4 } ] ],
		// RFC3927
		[ "linkLocal", [ { ip: IPv4.fromBytes(169, 254, 0, 0), bits: 16 } ] ],
		// RFC5735
		[ "loopback", [ { ip: IPv4.fromBytes(127, 0, 0, 0), bits: 8 } ] ],
		// RFC6598
		[ "carrierGradeNat", [ { ip: IPv4.fromBytes(100, 64, 0, 0), bits: 10 } ] ],
		// RFC1918
		[ "private", [
			{ ip: IPv4.fromBytes(10, 0, 0, 0), bits: 8 },
			{ ip: IPv4.fromBytes(172, 16, 0, 0), bits: 12 },
			{ ip: IPv4.fromBytes(192, 168, 0, 0), bits: 16 }
		] ],
		// Reserved and testing-only ranges; RFCs 5735, 5737, 2544, 1700
		[ "reserved", [
			{ ip: IPv4.fromBytes(192, 0, 0, 0), bits: 24 },
			{ ip: IPv4.fromBytes(192, 0, 2, 0), bits: 24 },
			{ ip: IPv4.fromBytes(192, 88, 99, 0), bits: 24 },
			{ ip: IPv4.fromBytes(198, 18, 0, 0), bits: 15 },
			{ ip: IPv4.fromBytes(198, 51, 100, 0), bits: 24 },
			{ ip: IPv4.fromBytes(203, 0, 113, 0), bits: 24 },
			{ ip: IPv4.fromBytes(240, 0, 0, 0), bits: 4 }
		] ]
	])

	/** Checks if this address matches other one within given CIDR range. */
	match(what: IPv4, bits: number): boolean {
		return matchCIDR(this.octets, what.octets, 8, bits)
	}

	/** returns a number of leading ones in IPv4 address, making sure that
	  * the rest is a solid sequence of 0's (valid netmask)
	  * returns either the CIDR length or null if mask is not valid */
	prefixLengthFromSubnetMask(): number | null {
		const /** number of zeroes in octet */ zerotable: Record<number, number> = {
			0: 8,
			128: 7,
			192: 6,
			224: 5,
			240: 4,
			248: 3,
			252: 2,
			254: 1,
			255: 0
		}

		let /** non-zero encountered stop scanning for zeroes */ stop = false
		let cidr = 0

		for (const octet of this.octets) {
			const zeros = zerotable[octet]

			if (zeros != undefined) {
				if (stop && zeros != 0)
					return null;

				if (zeros != 8)
					stop = true

				cidr += zeros
			} else
				return null
		}

		return 32 - cidr
	}

	// Checks if the address corresponds to one of the special ranges.
	range(): IPv4Range {
		return subnetMatch(this, IPv4.SpecialRanges);
	}

	/** Returns an array of byte-sized values in network order (MSB first) */
	toByteArray(): Uint8Array {
		return this.octets.slice();
	}

	// Converts this IPv4 address to an IPv4-mapped IPv6 address.
	toIPv4MappedAddress(): IPv6 {
		return IPv6.parse(`::ffff:${this.toString()}`);
	}

	// Symmetrical method strictly for aligning with the IPv6 methods.
	toNormalizedString(): string {
		return this.toString();
	}

	// Returns the address in convenient, decimal-dotted format.
	toString(): string {
		return this.octets.join('.');
	}

	// A utility function to return broadcast address given the IPv4 interface and prefix length in CIDR notation
	static broadcastAddressFromCIDR(addr: string): IPv4 {
		try {
			const cidr = this.parseCIDR(addr)
			const ipInterfaceOctets = cidr[0].toByteArray()
			const subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]).toByteArray()

			return this.fromBytes(
				ipInterfaceOctets[0]! | (subnetMaskOctets[0]! ^ 255),
				ipInterfaceOctets[1]! | (subnetMaskOctets[1]! ^ 255),
				ipInterfaceOctets[2]! | (subnetMaskOctets[2]! ^ 255),
				ipInterfaceOctets[3]! | (subnetMaskOctets[3]! ^ 255)
			)
		} catch (e) {
			throw Error('ipaddr: the address does not have IPv4 CIDR format')
		}
	}

	// Checks if a given string is formatted like IPv4 address.
	static isIPv4(address: string): boolean {
		return Boolean(this.parser(address))
	}

	// Checks if a given string is a valid IPv4 address.
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
		} catch (e) {
			return false
		}
	}

	/** Checks if a given string is a full four-part IPv4 Address. */
	static isValidFourPartDecimal(addr: string): boolean {
		return IPv4.isValid(addr) && Boolean(addr.match(/^(0|[1-9]\d*)(\.(0|[1-9]\d*)){3}$/))
	}

	/** A utility function to return network address given the IPv4 interface and prefix length in CIDR notation */
	static networkAddressFromCIDR(addr: string): IPv4 {
		try {
			const cidr = this.parseCIDR(addr);
			const ipInterfaceOctets = cidr[0].toByteArray();
			const subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]).toByteArray();

			return this.fromBytes(
				ipInterfaceOctets[0]! & subnetMaskOctets[0]!,
				ipInterfaceOctets[1]! & subnetMaskOctets[1]!,
				ipInterfaceOctets[2]! & subnetMaskOctets[2]!,
				ipInterfaceOctets[3]! & subnetMaskOctets[3]!
			)
		} catch (e) {
			throw Error("ipaddr: the address does not have IPv4 CIDR format")
		}
	}

	/** Tries to parse and validate a string with IPv4 address.
	  * Throws an error if it fails. */
	static parse(addr: string): IPv4 {
		const parts = this.parser(addr)

		if (!parts)
			throw Error("String is not formatted like an IPv4 Address")

		return this.fromBytes(...parts)
	};

	/** Parses the string as an IPv4 Address with CIDR Notation. */
	static parseCIDR(addr: string): [ IPv4, number ] {
		const match = addr.match(/^(.+)\/(\d+)$/)

		if (match) {
			const maskLength = Number(match[2])

			if (match[1] && maskLength >= 0 && maskLength <= 32) {
				return Object.defineProperty([ this.parse(match[1]), maskLength ], "toString", {
					value() {
						return this.join("/")
					}
				})
			}
		}

		throw Error("ipaddr: string is not formatted like an IPv4 CIDR range")
	}

	/** Classful variants (like a.b, where a is an octet, and b is a 24-bit
	  * value representing last three octets; this corresponds to a class C
	  * address) are omitted due to classless nature of modern Internet. */
	static parser(string: string): [ number, number, number, number ] | null {
		let match

		// parseInt recognizes all that octal & hexadecimal weirdness for us
		if ((match = string.match(ipv4Regexes.fourOctet))) {
			return [
				parseIntAuto(match[1]!),
				parseIntAuto(match[2]!),
				parseIntAuto(match[3]!),
				parseIntAuto(match[4]!)
			]
		}

		if ((match = string.match(ipv4Regexes.longValue))) {
			const value = parseIntAuto(match[1]!);

			if (value > 0xFF_FF_FF_FF || value < 0)
				throw Error("Address part outside defined range")

			return [ (value >> 24) & 0xFF, (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF ]
		}

		if ((match = string.match(ipv4Regexes.twoOctet))) {
			const firstOctet = parseIntAuto(match[1]!)
			const lastOctets = parseIntAuto(match[2]!);

			if (firstOctet > 0xff || firstOctet < 0 || lastOctets > 0xffffff || lastOctets < 0)
				throw Error("Address part outside defined range")

			return [ firstOctet, (lastOctets >> 16) & 0xff, (lastOctets >>  8) & 0xff, lastOctets & 0xff ]
		}

		if ((match = string.match(ipv4Regexes.threeOctet))) {
			const firstOctet = parseIntAuto(match[1]!);
			const secondOctet = parseIntAuto(match[2]!);
			const lastOctets = parseIntAuto(match[3]!);

			if (
				firstOctet > 0xff || firstOctet < 0 || secondOctet > 0xff ||
				secondOctet < 0 || lastOctets > 0xffff || lastOctets < 0
			)
				throw Error("Address part outside defined range")

			return [ firstOctet, secondOctet, (lastOctets >> 8) & 0xff, lastOctets & 0xff ]
		}

		return null
	}

	/** A utility function to return subnet mask in IPv4 format given the prefix length */
	static subnetMaskFromPrefixLength(prefix: number): IPv4 {
		if (prefix < 0 || prefix > 32)
			throw Error("ipaddr: invalid IPv4 prefix length")

		const octets: [ number, number, number, number ] = [ 0, 0, 0, 0 ]
		let j = 0;
		const filledOctetCount = Math.floor(prefix / 8);

		while (j < filledOctetCount) {
			octets[j] = 255;
			j++;
		}

		if (filledOctetCount < 4) {
			octets[filledOctetCount] = Math.pow(2, prefix % 8) - 1 << 8 - (prefix % 8);
		}

		return this.fromBytes(...octets);
	};
}

export class IPv6  {
	// /** Constructs an IPv6 address from an array of eight 16 - bit parts
	//   * or sixteen 8 - bit parts in network order(MSB first).
	//   * Throws an error if the input is invalid. */
	// constructor(parts: number[], public zoneId?: string) {
	// 	if (parts.length == 16) {
	// 		this.parts = new Uint16Array([
	// 			(parts[0]! << 8) | parts[1]!,
	// 			(parts[2]! << 8) | parts[3]!,
	// 			(parts[4]! << 8) | parts[5]!,
	// 			(parts[6]! << 8) | parts[7]!,
	// 			(parts[8]! << 8) | parts[9]!,
	// 			(parts[10]! << 8) | parts[11]!,
	// 			(parts[12]! << 8) | parts[13]!,
	// 			(parts[14]! << 8) | parts[15]!
	// 		])
	// 	} else if (parts.length == 8) {
	// 		this.parts = new Uint16Array(parts)
	// 	} else
	// 		throw Error('ipaddr: ipv6 part count should be 8 or 16')
	// }

	constructor(
		/** 8 big-endian 16-bit unsigned integers */ public hextets: Uint16Array,
		public zoneId?: string
	) {
		if (hextets.length != 8)
			throw Error("hextets Uint16Array must have a length of 8")
	}

	static fromBytes(
		byte0: number, byte1: number, byte2: number, byte3: number, byte4: number, byte5: number, byte6: number,
		byte7: number, byte8: number, byte9: number, byte10: number, byte11: number, byte12: number, byte13: number,
		byte14: number, byte15: number, zoneId?: string
	) {
		return new this(new Uint16Array(new Uint8Array([
			byte1,
			byte0,
			byte3,
			byte2,
			byte5,
			byte4,
			byte7,
			byte6,
			byte9,
			byte8,
			byte11,
			byte10,
			byte13,
			byte12,
			byte15,
			byte14,
		]).buffer), zoneId)
	}

	static fromHextets(
		hextet0: number, hextet1: number, hextet2: number, hextet3: number, hextet4: number, hextet5: number,
		hextet6: number, hextet7: number, zoneId?: string
	) {
		return new this(new Uint16Array([ hextet0, hextet1, hextet2, hextet3, hextet4, hextet5, hextet6, hextet7 ]), zoneId)
	}

	// Special IPv6 ranges
	static SpecialRanges: RangeList<IPv6> = new Map([
		// RFC4291, here and after
		[ "unspecified", [ { ip: this.fromHextets(0, 0, 0, 0, 0, 0, 0, 0), bits: 128 } ] ],
		[ "linkLocal", [ { ip: this.fromHextets(0xfe80, 0, 0, 0, 0, 0, 0, 0), bits: 10 } ] ],
		[ "multicast", [ { ip: this.fromHextets(0xff00, 0, 0, 0, 0, 0, 0, 0), bits: 8 } ] ],
		[ "loopback", [ { ip: this.fromHextets(0, 0, 0, 0, 0, 0, 0, 1), bits: 128 } ] ],
		[ "uniqueLocal", [ { ip: this.fromHextets(0xfc00, 0, 0, 0, 0, 0, 0, 0), bits: 7 } ] ],
		[ "ipv4Mapped", [ { ip: this.fromHextets(0, 0, 0, 0, 0, 0xffff, 0, 0), bits: 96 } ] ],
		// RFC6145
		[ "rfc6145", [ { ip: this.fromHextets(0, 0, 0, 0, 0xffff, 0, 0, 0), bits: 96 } ] ],
		// RFC6052
		[ "rfc6052", [ { ip: this.fromHextets(0x64, 0xff9b, 0, 0, 0, 0, 0, 0), bits: 96 } ] ],
		// RFC3056
		[ "6to4", [ { ip: this.fromHextets(0x2002, 0, 0, 0, 0, 0, 0, 0), bits: 16 } ] ],
		// RFC6052, RFC6146
		[ "teredo", [ { ip: this.fromHextets(0x2001, 0, 0, 0, 0, 0, 0, 0), bits: 32 } ] ],
		// RFC4291
		[ "reserved", [ { ip: this.fromHextets(0x2001, 0xdb8, 0, 0, 0, 0, 0, 0), bits: 32 } ] ],
		[ "benchmarking", [ { ip: this.fromHextets(0x2001, 0x2, 0, 0, 0, 0, 0, 0), bits: 48 } ] ],
		[ "amt", [ { ip: this.fromHextets(0x2001, 0x3, 0, 0, 0, 0, 0, 0), bits: 32 } ] ],
		[ "as112v6", [ { ip: this.fromHextets(0x2001, 0x4, 0x112, 0, 0, 0, 0, 0), bits: 48 } ] ],
		[ "deprecated", [ { ip: this.fromHextets(0x2001, 0x10, 0, 0, 0, 0, 0, 0), bits: 28 } ] ],
		[ "orchid2", [ { ip: this.fromHextets(0x2001, 0x20, 0, 0, 0, 0, 0, 0), bits: 28 } ] ]
	])

	// Checks if this address is an IPv4-mapped IPv6 address.
	isIPv4MappedAddress(): boolean {
		return this.range() === 'ipv4Mapped';
	};

	// Checks if this address matches other one within given CIDR range.
	match(what: IPv6, bits: number): boolean {
		return matchCIDR(this.hextets, what.hextets, 16, bits);
	};

	// returns a number of leading ones in IPv6 address, making sure that
	// the rest is a solid sequence of 0's (valid netmask)
	// returns either the CIDR length or null if mask is not valid
	prefixLengthFromSubnetMask(): number | null {
		const /** number of zeroes in octet */ zerotable: Record<number, number> = {
			0: 16,
			32768: 15,
			49152: 14,
			57344: 13,
			61440: 12,
			63488: 11,
			64512: 10,
			65024: 9,
			65280: 8,
			65408: 7,
			65472: 6,
			65504: 5,
			65520: 4,
			65528: 3,
			65532: 2,
			65534: 1,
			65535: 0
		}

		let /** non-zero encountered stop scanning for zeroes */ stop = false
		let cidr = 0

		for (const part in this.hextets) {
			const zeros = zerotable[part]

			if (zeros != undefined) {
				if (stop && zeros !== 0)
					return null

				if (zeros !== 16)
					stop = true

				cidr += zeros
			} else
				return null
		}

		return 128 - cidr
	};


	// Checks if the address corresponds to one of the special ranges.
	range(): IPv6Range {
		return subnetMatch(this, IPv6.SpecialRanges)
	}

	/** Returns an array of byte-sized values in network order (MSB first) */
	toByteArray(): Uint8Array {
		return new Uint8Array(this.hextets.buffer)
	};

	// Returns the address in expanded format with all zeroes included, like
	// 2001:0db8:0008:0066:0000:0000:0000:0001
	toFixedLengthString(): string {
		let addr
		const results = []

		for (const part of this.hextets)
			results.push(padPart(part.toString(16), 4))

		addr = results.join(':')

		let suffix = '';

		if (this.zoneId)
			suffix = `%${this.zoneId}`

		return addr + suffix
	}

	// Converts this address to IPv4 address if it is an IPv4-mapped IPv6 address.
	// Throws an error otherwise.
	toIPv4Address(): IPv4 {
		if (!this.isIPv4MappedAddress())
			throw Error('ipaddr: trying to convert a generic ipv6 address to ipv4')

		const u8View = new Uint8Array(this.hextets.buffer)

		return IPv4.fromBytes(
			u8View[13]!,
			u8View[12]!,
			u8View[15]!,
			u8View[14]!
		)
	}

	/** Returns the address in expanded format with all zeroes included, like `2001:db8:8:66:0:0:0:1`
	  *
	  * @deprecated use toFixedLengthString() instead. */
	toNormalizedString(): string {
		return `${[ ...this.hextets ].map(hextet => hextet.toString(16)).join(':')}${
			this.zoneId ? `%${this.zoneId}` : ""}`
	};

	// Returns the address in compact, human-readable format like
	// 2001:db8:8:66::1
	// in line with RFC 5952 (see https://tools.ietf.org/html/rfc5952#section-4)
	toRFC5952String(): string {
		const regex = /((^|:)(0(:|$)){2,})/g;
		const string = this.toNormalizedString();
		let bestMatchIndex = 0;
		let bestMatchLength = -1;
		let match;

		while ((match = regex.exec(string))) {
			if (match[0].length > bestMatchLength) {
				bestMatchIndex = match.index;
				bestMatchLength = match[0].length;
			}
		}

		if (bestMatchLength < 0) {
			return string;
		}

		return `${string.substring(0, bestMatchIndex)}::${string.substring(bestMatchIndex + bestMatchLength)}`;
	};

	// Returns the address in compact, human-readable format like
	// 2001:db8:8:66::1
	// Calls toRFC5952String under the hood.
	toString(): string {
		return this.toRFC5952String();
	};

	// A utility function to return broadcast address given the IPv6 interface and prefix length in CIDR notation
	static broadcastAddressFromCIDR(addr: string): IPv6 {
		try {
			const cidr = this.parseCIDR(addr);
			const ipInterfaceOctets = cidr[0].toByteArray();
			const subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]).toByteArray();

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
				ipInterfaceOctets[15]! | (subnetMaskOctets[15]! ^ 255),
			)
		} catch (e) {
			throw Error(`ipaddr: the address does not have IPv6 CIDR format (${e})`);
		}
	};

	// Checks if a given string is formatted like IPv6 address.
	static isIPv6(addr: string): boolean {
		return this.parser(addr) !== null;
	};

	// Checks to see if string is a valid IPv6 Address
	static isValid(addr: string): boolean {
		// Since IPv6.isValid is always called first, this shortcut
		// provides a substantial performance gain.
		if (addr.indexOf(':') == -1)
			return false

		try {
			const parsedAddress = this.parser(addr)

			if (!parsedAddress)
				return false

			new this(new Uint16Array(parsedAddress.parts), parsedAddress.zoneId)

			return true;
		} catch (e) {
			return false;
		}
	};

	// A utility function to return network address given the IPv6 interface and prefix length in CIDR notation
	static networkAddressFromCIDR(addr: string): IPv6 {
		try {
			const cidr = this.parseCIDR(addr)
			const ipInterfaceOctets = cidr[0].toByteArray()
			const subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]).toByteArray()

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
		} catch (e) {
			throw Error(`ipaddr: the address does not have IPv6 CIDR format`, { cause: e });
		}
	}

	/** Tries to parse and validate a string with IPv6 address.
	  * Throws an error if it fails. */
	static parse(addr: string): IPv6 {
		const parsedAddress = this.parser(addr)

		if (parsedAddress === null)
			throw Error("ipaddr: string is not formatted like an IPv6 Address")

		return new this(new Uint16Array(parsedAddress.parts), parsedAddress.zoneId)
	}

	static parseCIDR(addr: string): [ IPv6, number ] {
		const match = addr.match(/^(.+)\/(\d+)$/)

		if (match) {
			const maskLength = parseInt(match[2]!)

			if (maskLength >= 0 && maskLength <= 128) {
				return Object.defineProperty([ this.parse(match[1]!), maskLength ], "toString", {
					value() {
						return this.join("/")
					}
				})
			}
		}

		throw Error("ipaddr: string is not formatted like an IPv6 CIDR range")
	};

	/** Parse an IPv6 address. */
	static parser(string: string): { parts: number[]; zoneId: string | undefined; } | null {
		let match

		if ((match = string.match(ipv6Regexes.deprecatedTransitional)))
			return this.parser(`::ffff:${match[1]}`)

		if (ipv6Regexes.native.test(string))
			return expandIPv6(string, 8)

		if ((match = string.match(ipv6Regexes.transitional))) {
			const addr = expandIPv6(match[1]!.slice(0, -1) + (match[6] || ''), 6)!

			if (addr.parts) {
				const octets = [
					parseInt(match[2]!),
					parseInt(match[3]!),
					parseInt(match[4]!),
					parseInt(match[5]!)
				]

				for (const octet of octets) {
					if (octet < 0 || octet > 255)
						return null
				}

				addr.parts.push((octets[0]! << 8) | octets[1]!)
				addr.parts.push((octets[2]! << 8) | octets[3]!)

				return { parts: addr.parts, zoneId: addr.zoneId }
			}
		}

		return null
	}

	/** A utility function to return subnet mask in IPv6 format given the prefix length */
	static subnetMaskFromPrefixLength(prefix: number): IPv6 {
		if (prefix < 0 || prefix > 128)
			throw Error("ipaddr: invalid IPv6 prefix length")

		const subnetMask = this.fromHextets(0, 0, 0, 0, 0, 0, 0, 0)
		const filledHextetCount = Math.floor(prefix / 16)

		for (let i = 0; i < filledHextetCount; i++)
			subnetMask.hextets[i] = 0xFF_FF

		if (filledHextetCount < 32)
			subnetMask.hextets[filledHextetCount] = ((2 ** (prefix % 16)) - 1) << (16 - (prefix % 16))

		return subnetMask
	}
}

// Try to parse an array in network order (MSB first) for IPv4 and IPv6
export function fromByteArray(bytes: number[]): IPv4 | IPv6 {
	if (bytes.length === 4)
		return IPv4.fromBytes(...bytes as [ number, number, number, number ])

	if (bytes.length === 16)
		return IPv6.fromBytes(...bytes as [ number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number ])

	throw Error("ipaddr: the binary input is neither an IPv6 nor IPv4 address")
}

// Checks if the address is valid IP address
export function isValid(addr: string): boolean {
	return IPv6.isValid(addr) || IPv4.isValid(addr);
}


// Attempts to parse an IP Address, first through IPv6 then IPv4.
// Throws an error if it could not be parsed.
export function parse(addr: string): IPv4 | IPv6 {
	if (IPv6.isValid(addr)) {
		return IPv6.parse(addr);
	} else if (IPv4.isValid(addr)) {
		return IPv4.parse(addr);
	} else {
		throw Error('ipaddr: the address has neither IPv6 nor IPv4 format');
	}
}

// Attempt to parse CIDR notation, first through IPv6 then IPv4.
// Throws an error if it could not be parsed.
export function parseCIDR(mask: string): [IPv4 | IPv6, number] {
	try {
		return IPv6.parseCIDR(mask);
	} catch (e) {
		try {
			return IPv4.parseCIDR(mask);
		} catch (e2) {
			throw Error('ipaddr: the address has neither IPv6 nor IPv4 CIDR format');
		}
	}
}

// Parse an address and return plain IPv4 address if it is an IPv4-mapped address
export function process(addr: string): IPv4 | IPv6 {
	const parsedAddr = parse(addr);

	if (parsedAddr instanceof IPv6 && parsedAddr.isIPv4MappedAddress()) {
		return parsedAddr.toIPv4Address();
	} else {
		return parsedAddr;
	}
}

// An utility function to ease named range matching. See examples below.
// rangeList can contain both IPv4 and IPv6 subnet entries and will not throw errors
// on matching IPv4 addresses to IPv6 ranges or vice versa.
export function subnetMatch<T extends IPv4 | IPv6>(addr: T, rangeList: RangeList<T>, defaultName: T extends IPv4 ? IPv4Range : IPv6Range = 'unicast'): T extends IPv4 ? IPv4Range : IPv6Range {
	if (addr instanceof IPv4) {
		for (const [ rangeName, rangeSubnets ] of rangeList) {
			for (const subnet of rangeSubnets) {
				if (subnet.ip instanceof IPv4 && addr.match(subnet.ip, subnet.bits))
					return rangeName
			}
		}
	} else {
		for (const [ rangeName, rangeSubnets ] of rangeList) {
			for (const subnet of rangeSubnets) {
				if (subnet.ip instanceof IPv6 && addr.match(subnet.ip, subnet.bits))
					return rangeName
			}
		}
	}

	return defaultName
}
