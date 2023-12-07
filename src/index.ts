export type IPvXRangeDefaults = 'unicast' | 'unspecified' | 'multicast' | 'linkLocal' | 'loopback' | 'reserved';
export type IPv4Range = IPvXRangeDefaults | 'broadcast' | 'carrierGradeNat' | 'private';
export type IPv6Range = IPvXRangeDefaults | 'uniqueLocal' | 'ipv4Mapped' | 'rfc6145' | 'rfc6052' | '6to4' | 'teredo';

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
function expandIPv6(string: string, parts: number): { parts: number[]; zoneId: string | undefined; } | null {
	// More than one '::' means invalid adddress
	if (string.indexOf('::') !== string.lastIndexOf('::')) {
		return null;
	}

	let colonCount = 0;
	let lastColon = -1;
	let zoneId = (string.match(ipv6Regexes.zoneIndex) || [])[0];
	let replacement, replacementCount;

	// Remove zone index and save it for later
	if (zoneId) {
		zoneId = zoneId.substring(1);
		string = string.replace(/%.+$/, '');
	}

	// How many parts do we already have?
	while ((lastColon = string.indexOf(':', lastColon + 1)) >= 0) {
		colonCount++;
	}

	// 0::0 is two parts more than ::
	if (string.substr(0, 2) === '::') {
		colonCount--;
	}

	if (string.substr(-2, 2) === '::') {
		colonCount--;
	}

	// The following loop would hang if colonCount > parts
	if (colonCount > parts) {
		return null;
	}

	// replacement = ':' + '0:' * (parts - colonCount)
	replacementCount = parts - colonCount;
	replacement = ':';
	while (replacementCount--) {
		replacement += '0:';
	}

	// Insert the missing zeroes
	string = string.replace('::', replacement);

	// Trim any garbage which may be hanging around if :: was at the edge in
	// the source strin
	if (string[0] === ':') {
		string = string.slice(1);
	}

	if (string[string.length - 1] === ':') {
		string = string.slice(0, -1);
	}

	const partsArray = (function () {
		const refs = string.split(':');
		const results = [];

		for (const ref of refs) {
			results.push(parseInt(ref, 16));
		}

		return results;
	})();

	return {
		parts: partsArray,
		zoneId: zoneId
	};
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
	if (hexRegex.test(string)) {
		return parseInt(string, 16);
	}
	// While octal representation is discouraged by ECMAScript 3
	// and forbidden by ECMAScript 5, we silently allow it to
	// work only if the rest of the string has numbers less than 8.
	if (string[0] === '0' && !isNaN(parseInt(string[1]!, 10))) {
		if (octalRegex.test(string)) {
			return parseInt(string, 8);
		}

		throw Error(`ipaddr: cannot parse ${string} as octal`);
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
	// Constructs a new IPv4 address from an array of four octets
	// in network order (MSB first)
	// Verifies the input.
	constructor(public octets: Uint8Array) {
		if (octets.length !== 4)
			throw Error("ipaddr: ipv4 octet count should be 4")
	}

	static from4Bytes(byte0: number, byte1: number, byte2: number, byte3: number): IPv4 {
		return new IPv4(new Uint8Array([ byte0, byte1, byte2, byte3 ]))
	}

	// Special IPv4 address ranges.
	// See also https://en.wikipedia.org/wiki/Reserved_IP_addresses
	static SpecialRanges: RangeList<IPv4> = new Map([
		[ "unspecified", [ { ip: IPv4.from4Bytes(0, 0, 0, 0), bits: 8 } ] ],
		[ "broadcast", [ { ip: IPv4.from4Bytes(255, 255, 255, 255), bits: 32 } ] ],
		// RFC3171
		[ "multicast", [ { ip: IPv4.from4Bytes(224, 0, 0, 0), bits: 4 } ] ],
		// RFC3927
		[ "linkLocal", [ { ip: IPv4.from4Bytes(169, 254, 0, 0), bits: 16 } ] ],
		// RFC5735
		[ "loopback", [ { ip: IPv4.from4Bytes(127, 0, 0, 0), bits: 8 } ] ],
		// RFC6598
		[ "carrierGradeNat", [ { ip: IPv4.from4Bytes(100, 64, 0, 0), bits: 10 } ] ],
		// RFC1918
		[ "private", [
			{ ip: IPv4.from4Bytes(10, 0, 0, 0), bits: 8 },
			{ ip: IPv4.from4Bytes(172, 16, 0, 0), bits: 12 },
			{ ip: IPv4.from4Bytes(192, 168, 0, 0), bits: 16 }
		] ],
		// Reserved and testing-only ranges; RFCs 5735, 5737, 2544, 1700
		[ "reserved", [
			{ ip: IPv4.from4Bytes(192, 0, 0, 0), bits: 24 },
			{ ip: IPv4.from4Bytes(192, 0, 2, 0), bits: 24 },
			{ ip: IPv4.from4Bytes(192, 88, 99, 0), bits: 24 },
			{ ip: IPv4.from4Bytes(198, 18, 0, 0), bits: 15 },
			{ ip: IPv4.from4Bytes(198, 51, 100, 0), bits: 24 },
			{ ip: IPv4.from4Bytes(203, 0, 113, 0), bits: 24 },
			{ ip: IPv4.from4Bytes(240, 0, 0, 0), bits: 4 }
		] ]
	])

	/** Checks if this address matches other one within given CIDR range. */
	match(what: IPv4 | IPv6, bits: number): boolean {
		if (what instanceof IPv6) {
			throw Error('ipaddr: cannot match ipv4 address with non-ipv4 one');
		}

		return matchCIDR(this.octets, what.octets, 8, bits);
	}

	// returns a number of leading ones in IPv4 address, making sure that
	// the rest is a solid sequence of 0's (valid netmask)
	// returns either the CIDR length or null if mask is not valid
	prefixLengthFromSubnetMask(): number | null {
		let cidr = 0;
		// non-zero encountered stop scanning for zeroes
		let stop = false;
		// number of zeroes in octet
		const zerotable = {
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

		for (const octet of this.octets) {
			if (octet in zerotable) {
				const zeros = zerotable[octet as keyof typeof zerotable];
				if (stop && zeros !== 0) {
					return null;
				}

				if (zeros !== 8) {
					stop = true;
				}

				cidr += zeros;
			} else {
				return null;
			}
		}

		return 32 - cidr;
	}

	// Checks if the address corresponds to one of the special ranges.
	range(): IPv4Range {
		return subnetMatch(this, IPv4.SpecialRanges);
	}

	// Returns an array of byte-sized values in network order (MSB first)
	toByteArray(): number[] {
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
			const cidr = this.parseCIDR(addr);
			const ipInterfaceOctets = cidr[0].toByteArray();
			const subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]).toByteArray();
			const octets = [];
			let i = 0;
			while (i < 4) {
				// Broadcast address is bitwise OR between ip interface and inverted mask
				octets.push(parseInt(ipInterfaceOctets[i], 10) | parseInt(subnetMaskOctets[i], 10) ^ 255);
				i++;
			}

			return new this(octets);
		} catch (e) {
			throw Error('ipaddr: the address does not have IPv4 CIDR format');
		}
	}

	// Checks if a given string is formatted like IPv4 address.
	static isIPv4(addr: string): boolean {
		return this.parser(addr) !== null;
	}

	// Checks if a given string is a valid IPv4 address.
	static isValid(addr: string): boolean {
		try {
			new this(this.parser(addr));
			return true;
		} catch (e) {
			return false;
		}
	}

	// Checks if a given string is a full four-part IPv4 Address.
	static isValidFourPartDecimal(addr: string): boolean {
		if (IPv4.isValid(addr) && addr.match(/^(0|[1-9]\d*)(\.(0|[1-9]\d*)){3}$/)) {
			return true;
		} else {
			return false;
		}
	}

	// A utility function to return network address given the IPv4 interface and prefix length in CIDR notation
	static networkAddressFromCIDR(addr: string): IPv4 {
		let cidr, i, ipInterfaceOctets, octets, subnetMaskOctets;

		try {
			cidr = this.parseCIDR(addr);
			ipInterfaceOctets = cidr[0].toByteArray();
			subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]).toByteArray();
			octets = [];
			i = 0;
			while (i < 4) {
				// Network address is bitwise AND between ip interface and mask
				octets.push(parseInt(ipInterfaceOctets[i], 10) & parseInt(subnetMaskOctets[i], 10));
				i++;
			}

			return new this(octets);
		} catch (e) {
			throw Error('ipaddr: the address does not have IPv4 CIDR format');
		}
	}

	// Tries to parse and validate a string with IPv4 address.
	// Throws an error if it fails.
	static parse(addr: string): IPv4 {
		const parts = this.parser(addr);

		if (parts === null) {
			throw Error('ipaddr: string is not formatted like an IPv4 Address');
		}

		return this.from4Bytes(...parts);
	};

	// Parses the string as an IPv4 Address with CIDR Notation.
	static parseCIDR(addr: string): [IPv4, number] {
		let match;

		if ((match = addr.match(/^(.+)\/(\d+)$/))) {
			const maskLength = parseInt(match[2]);
			if (maskLength >= 0 && maskLength <= 32) {
				const parsed = [this.parse(match[1]), maskLength];
				Object.defineProperty(parsed, 'toString', {
					value: function () {
						return this.join('/');
					}
				});
				return parsed;
			}
		}

		throw Error('ipaddr: string is not formatted like an IPv4 CIDR range');
	};

	// Classful variants (like a.b, where a is an octet, and b is a 24-bit
	// value representing last three octets; this corresponds to a class C
	// address) are omitted due to classless nature of modern Internet.
	static parser(string: string): [ number, number, number, number ] | null {
		let match

		// parseInt recognizes all that octal & hexadecimal weirdness for us
		if ((match = string.match(ipv4Regexes.fourOctet))) {
			return [
				parseIntAuto(match[1]),
				parseIntAuto(match[2]),
				parseIntAuto(match[3]),
				parseIntAuto(match[4])
			]
		}

		if ((match = string.match(ipv4Regexes.longValue))) {
			const value = parseIntAuto(match[1]);

			if (value > 0xffffffff || value < 0)
				throw Error('ipaddr: address outside defined range')

			return [
				(value >> 24) & 0xff,
				(value >> 16) & 0xff,
				(value >> 8) & 0xff,
				value & 0xff
			]
		}

		if ((match = string.match(ipv4Regexes.twoOctet))) {
			const firstOctet = parseIntAuto(match[1])
			const lastOctets = parseIntAuto(match[2]);

			if (firstOctet > 0xff || firstOctet < 0 || lastOctets > 0xffffff || lastOctets < 0)
				throw Error('ipaddr: address outside defined range')

			return [ firstOctet, (lastOctets >> 16) & 0xff, (lastOctets >>  8) & 0xff, lastOctets & 0xff ]
		}

		if ((match = string.match(ipv4Regexes.threeOctet))) {
			const ref = match.slice(1, 5);
			const results = [];
			const firstOctet = parseIntAuto(ref[0]);
			const secondOctet = parseIntAuto(ref[1]);
			const lastOctets = parseIntAuto(ref[2]);

			if (
				firstOctet > 0xff || firstOctet < 0 || secondOctet > 0xff ||
				secondOctet < 0 || lastOctets > 0xffff || lastOctets < 0
			)
				throw Error('ipaddr: address outside defined range')

			return [
				firstOctet,
				secondOctet,
				(lastOctets >> 8) & 0xff,
				lastOctets & 0xff
			]
		}

		return null;
	}

	// A utility function to return subnet mask in IPv4 format given the prefix length
	static subnetMaskFromPrefixLength(prefix: number): IPv4 {
		prefix = parseInt(prefix);
		if (prefix < 0 || prefix > 32) {
			throw Error('ipaddr: invalid IPv4 prefix length');
		}

		const octets = [0, 0, 0, 0];
		let j = 0;
		const filledOctetCount = Math.floor(prefix / 8);

		while (j < filledOctetCount) {
			octets[j] = 255;
			j++;
		}

		if (filledOctetCount < 4) {
			octets[filledOctetCount] = Math.pow(2, prefix % 8) - 1 << 8 - (prefix % 8);
		}

		return new this(octets);
	};
}

export class IPv6  {
	parts: number[]

	// Constructs an IPv6 address from an array of eight 16 - bit parts
	// or sixteen 8 - bit parts in network order(MSB first).
	// Throws an error if the input is invalid.
	constructor(parts: number[], public zoneId?: string) {
		let i, part;

		if (parts.length == 16) {
			this.parts = [];
			for (i = 0; i <= 14; i += 2) {
				this.parts.push((parts[i] << 8) | parts[i + 1]);
			}
		} else if (parts.length == 8) {
			this.parts = parts;
		} else
			throw Error('ipaddr: ipv6 part count should be 8 or 16')

		for (i = 0; i < this.parts.length; i++) {
			part = this.parts[i];
			if (!((0 <= part && part <= 0xffff))) {
				throw Error('ipaddr: ipv6 part should fit in 16 bits');
			}
		}
	}

	// Special IPv6 ranges
	static SpecialRanges = {
		// RFC4291, here and after
		unspecified: [new IPv6([0, 0, 0, 0, 0, 0, 0, 0]), 128],
		linkLocal: [new IPv6([0xfe80, 0, 0, 0, 0, 0, 0, 0]), 10],
		multicast: [new IPv6([0xff00, 0, 0, 0, 0, 0, 0, 0]), 8],
		loopback: [new IPv6([0, 0, 0, 0, 0, 0, 0, 1]), 128],
		uniqueLocal: [new IPv6([0xfc00, 0, 0, 0, 0, 0, 0, 0]), 7],
		ipv4Mapped: [new IPv6([0, 0, 0, 0, 0, 0xffff, 0, 0]), 96],
		// RFC6145
		rfc6145: [new IPv6([0, 0, 0, 0, 0xffff, 0, 0, 0]), 96],
		// RFC6052
		rfc6052: [new IPv6([0x64, 0xff9b, 0, 0, 0, 0, 0, 0]), 96],
		// RFC3056
		'6to4': [new IPv6([0x2002, 0, 0, 0, 0, 0, 0, 0]), 16],
		// RFC6052, RFC6146
		teredo: [new IPv6([0x2001, 0, 0, 0, 0, 0, 0, 0]), 32],
		// RFC4291
		reserved: [[new IPv6([0x2001, 0xdb8, 0, 0, 0, 0, 0, 0]), 32]],
		benchmarking: [new IPv6([0x2001, 0x2, 0, 0, 0, 0, 0, 0]), 48],
		amt: [new IPv6([0x2001, 0x3, 0, 0, 0, 0, 0, 0]), 32],
		as112v6: [new IPv6([0x2001, 0x4, 0x112, 0, 0, 0, 0, 0]), 48],
		deprecated: [new IPv6([0x2001, 0x10, 0, 0, 0, 0, 0, 0]), 28],
		orchid2: [new IPv6([0x2001, 0x20, 0, 0, 0, 0, 0, 0]), 28]
	};

	// Checks if this address is an IPv4-mapped IPv6 address.
	isIPv4MappedAddress(): boolean {
		return this.range() === 'ipv4Mapped';
	};

	// Checks if this address matches other one within given CIDR range.
	match(what: IPv4 | IPv6 | [IPv4 | IPv6, number], bits?: number): boolean {
		let ref;

		if (bits === undefined) {
			ref = what;
			what = ref[0];
			bits = ref[1];
		}

		if (what.kind() !== 'ipv6') {
			throw Error('ipaddr: cannot match ipv6 address with non-ipv6 one');
		}

		return matchCIDR(this.parts, what.parts, 16, bits);
	};

	// returns a number of leading ones in IPv6 address, making sure that
	// the rest is a solid sequence of 0's (valid netmask)
	// returns either the CIDR length or null if mask is not valid
	prefixLengthFromSubnetMask(): number | null {
		let cidr = 0;
		// non-zero encountered stop scanning for zeroes
		let stop = false;
		// number of zeroes in octet
		const zerotable = {
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
		};
		let part, zeros;

		for (let i = 7; i >= 0; i -= 1) {
			part = this.parts[i];
			if (part in zerotable) {
				zeros = zerotable[part];
				if (stop && zeros !== 0) {
					return null;
				}

				if (zeros !== 16) {
					stop = true;
				}

				cidr += zeros;
			} else {
				return null;
			}
		}

		return 128 - cidr;
	};


	// Checks if the address corresponds to one of the special ranges.
	range(): IPv6Range {
		return subnetMatch(this, this.SpecialRanges);
	};

	// Returns an array of byte-sized values in network order (MSB first)
	toByteArray(): number[] {
		let part;
		const bytes = [];
		const ref = this.parts;
		for (let i = 0; i < ref.length; i++) {
			part = ref[i];
			bytes.push(part >> 8);
			bytes.push(part & 0xff);
		}

		return bytes;
	};

	// Returns the address in expanded format with all zeroes included, like
	// 2001:0db8:0008:0066:0000:0000:0000:0001
	toFixedLengthString(): string {
		let addr
		const results = []

		for (const part of this.parts)
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

		const [ high, low ] = this.parts.slice(-2);

		return IPv4.from4Bytes(high >> 8, high & 0xff, low >> 8, low & 0xff);
	};

	// Returns the address in expanded format with all zeroes included, like
	// 2001:db8:8:66:0:0:0:1
	//
	// Deprecated: use toFixedLengthString() instead.
	toNormalizedString(): string {
		const addr = ((function () {
			const results = [];

			for (let i = 0; i < this.parts.length; i++) {
				results.push(this.parts[i].toString(16));
			}

			return results;
		}).call(this)).join(':');

		let suffix = '';

		if (this.zoneId) {
			suffix = `%${this.zoneId}`;
		}

		return addr + suffix;
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
	static broadcastAddressFromCIDR(addr: string): IPv4 {
		try {
			const cidr = this.parseCIDR(addr);
			const ipInterfaceOctets = cidr[0].toByteArray();
			const subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]).toByteArray();
			const octets = [];
			let i = 0;
			while (i < 16) {
				// Broadcast address is bitwise OR between ip interface and inverted mask
				octets.push(parseInt(ipInterfaceOctets[i], 10) | parseInt(subnetMaskOctets[i], 10) ^ 255);
				i++;
			}

			return new this(octets);
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
		if (typeof addr === 'string' && addr.indexOf(':') === -1) {
			return false;
		}

		try {
			const addr = this.parser(addr);
			new this(addr.parts, addr.zoneId);
			return true;
		} catch (e) {
			return false;
		}
	};

	// A utility function to return network address given the IPv6 interface and prefix length in CIDR notation
	static networkAddressFromCIDR(addr: string): IPv6 {
		let cidr, i, ipInterfaceOctets, octets, subnetMaskOctets;

		try {
			cidr = this.parseCIDR(addr);
			ipInterfaceOctets = cidr[0].toByteArray();
			subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr[1]).toByteArray();
			octets = [];
			i = 0;
			while (i < 16) {
				// Network address is bitwise AND between ip interface and mask
				octets.push(parseInt(ipInterfaceOctets[i], 10) & parseInt(subnetMaskOctets[i], 10));
				i++;
			}

			return new this(octets);
		} catch (e) {
			throw Error(`ipaddr: the address does not have IPv6 CIDR format (${e})`);
		}
	};

	// Tries to parse and validate a string with IPv6 address.
	// Throws an error if it fails.
	static parse(addr: string): IPv6 {
		const addr = this.parser(addr);

		if (addr.parts === null) {
			throw Error('ipaddr: string is not formatted like an IPv6 Address');
		}

		return new this(addr.parts, addr.zoneId);
	};

	static parseCIDR(addr: string): [IPv6, number] {
		let maskLength, match, parsed;

		if ((match = addr.match(/^(.+)\/(\d+)$/))) {
			maskLength = parseInt(match[2]);
			if (maskLength >= 0 && maskLength <= 128) {
				parsed = [this.parse(match[1]), maskLength];
				Object.defineProperty(parsed, 'toString', {
					value: function () {
						return this.join('/');
					}
				});
				return parsed;
			}
		}

		throw Error('ipaddr: string is not formatted like an IPv6 CIDR range');
	};

	// Parse an IPv6 address.
	static parser(string: string) {
		let addr, i, match, octet, octets, zoneId;

		if ((match = string.match(ipv6Regexes.deprecatedTransitional))) {
			return this.parser(`::ffff:${match[1]}`);
		}
		if (ipv6Regexes.native.test(string)) {
			return expandIPv6(string, 8);
		}
		if ((match = string.match(ipv6Regexes.transitional))) {
			zoneId = match[6] || '';
			addr = expandIPv6(match[1].slice(0, -1) + zoneId, 6);
			if (addr.parts) {
				octets = [
					parseInt(match[2]),
					parseInt(match[3]),
					parseInt(match[4]),
					parseInt(match[5])
				];
				for (i = 0; i < octets.length; i++) {
					octet = octets[i];
					if (!((0 <= octet && octet <= 255))) {
						return null;
					}
				}

				addr.parts.push(octets[0] << 8 | octets[1]);
				addr.parts.push(octets[2] << 8 | octets[3]);
				return {
					parts: addr.parts,
					zoneId: addr.zoneId
				};
			}
		}

		return null;
	};

	// A utility function to return subnet mask in IPv6 format given the prefix length
	static subnetMaskFromPrefixLength(prefix: number): IPv6 {
		if (prefix < 0 || prefix > 128) {
			throw Error('ipaddr: invalid IPv6 prefix length');
		}

		const octets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		let j = 0;
		const filledOctetCount = Math.floor(prefix / 8);

		while (j < filledOctetCount) {
			octets[j] = 255;
			j++;
		}

		if (filledOctetCount < 16) {
			octets[filledOctetCount] = Math.pow(2, prefix % 8) - 1 << 8 - (prefix % 8);
		}

		return new this(octets);
	};
}

// Try to parse an array in network order (MSB first) for IPv4 and IPv6
export function fromByteArray(bytes: number[]): IPv4 | IPv6 {
	const length = bytes.length;

	if (length === 4) {
		return new IPv4(bytes);
	} else if (length === 16) {
		return new IPv6(bytes);
	} else {
		throw Error('ipaddr: the binary input is neither an IPv6 nor IPv4 address');
	}
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
	for (const [ rangeName, rangeSubnets ] of rangeList) {
		for (const subnet of rangeSubnets) {
			if (addr.constructor === subnet.ip.constructor && addr.match(subnet.ip, subnet.bits)) {
				return rangeName;
			}
		}
	}

	return defaultName;
}
