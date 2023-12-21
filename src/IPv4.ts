import { IPv6 } from "./IPv6"
import { CIDR, matchCIDR, subnetMatch, type IPvXRangeDefaults, type RangeList, type StringSuggest } from "./common"

export type IPv4Range = IPvXRangeDefaults | "broadcast" | "carrierGradeNat" | "private"

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

	/** @returns Broadcast address from CIDR or `undefined` if invalid. */
	static broadcastAddressFromCIDR(addr: string): IPv4 | undefined {
		const cidr = this.parseCIDR(addr)

		if (cidr) {
			const subnetMask = this.subnetMaskFromPrefixLength(cidr.bits)

			for (let index = 4; index--;)
				cidr.ip.octets[index] |= subnetMask.octets[index]! ^ 0xFF

			return cidr.ip
		}
	}

	/** Checks if a given string is formatted like IPv4 address. */
	static isIPv4(address: string): boolean {
		return Boolean(this.parser(address))
	}

	/** Checks if a given string is a valid IPv4 address. */
	static isValid(address: string): boolean {
		return Boolean(this.parser(address))
	}

	/** Checks if a given string is a full four-part IPv4 Address. */
	static isValidFourPartDecimal(addr: string): boolean {
		return IPv4.isValid(addr) && Boolean(/^(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*)){3}$/.test(addr))
	}

	/** @returns Network address from CIDR or `undefined` if invalid. */
	static networkAddressFromCIDR(addr: string): IPv4 | undefined {
		const cidr = this.parseCIDR(addr)

		if (cidr) {
			const subnetMaskOctets = this.subnetMaskFromPrefixLength(cidr.bits)

			for (let index = 4; index--;)
				cidr.ip.octets[index] &= subnetMaskOctets.octets[index]!

			return cidr.ip
		}
	}

	/** @returns Parsed IPv4 address or `undefined` if invalid. */
	static parse(addr: string): IPv4 | undefined {
		return this.parser(addr)
	}

	/** Parses the string as an IPv4 Address with CIDR Notation. */
	static parseCIDR(address: string): CIDR<IPv4> | undefined {
		const match = /^(.+)\/(\d+)$/.exec(address)

		if (match) {
			const maskLength = Number(match[2])

			if (match[1] && maskLength >= 0 && maskLength <= 32) {
				const parsed = this.parse(match[1])

				if (parsed)
					return new CIDR(parsed, maskLength)
			}
		}
	}

	/** Classful variants (like a.b, where a is an octet, and b is a 24-bit
	  * value representing last three octets; this corresponds to a class C
	  * address) are omitted due to classless nature of modern Internet. */
	static parser(string: string): IPv4 | undefined {
		let match

		// parseInt recognizes all that octal & hexadecimal weirdness for us
		if ((match = /^(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)$/i.exec(string))) {
			const bytes: [ number, number, number, number ] = [
				parseIntAuto(match[1]!),
				parseIntAuto(match[2]!),
				parseIntAuto(match[3]!),
				parseIntAuto(match[4]!)
			]

			if (bytes.every(byte => !isNaN(byte) && byte >= 0 && byte <= 0xFF))
				return IPv4.fromBytes(...bytes)
		} else if ((match = /^(\d+|0x[a-f\d]+)$/i.exec(string))) {
			const value = parseIntAuto(match[1]!)

			if (!isNaN(value) && value <= 0xFF_FF_FF_FF && value >= 0)
				return IPv4.fromBytes((value >> 24) & 0xFF, (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF)
		} else if ((match = /^(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)$/i.exec(string))) {
			const firstOctet = parseIntAuto(match[1]!)
			const lastOctets = parseIntAuto(match[2]!)

			if (!isNaN(firstOctet) && !isNaN(lastOctets) && firstOctet <= 0xFF && firstOctet >= 0 &&
				lastOctets <= 0xFF_FF_FF && lastOctets >= 0
			) {
				return IPv4
					.fromBytes(firstOctet, (lastOctets >> 16) & 0xFF, (lastOctets >> 8) & 0xFF, lastOctets & 0xFF)
			}
		} else if ((match = /^(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)$/i.exec(string))) {
			const firstOctet = parseIntAuto(match[1]!)
			const secondOctet = parseIntAuto(match[2]!)
			const lastOctets = parseIntAuto(match[3]!)

			if (!isNaN(firstOctet) && !isNaN(secondOctet) && !isNaN(lastOctets) &&
				firstOctet <= 0xFF && firstOctet >= 0 && secondOctet <= 0xFF &&
				secondOctet >= 0 && lastOctets <= 0xFF_FF && lastOctets >= 0
			)
				return IPv4.fromBytes(firstOctet, secondOctet, (lastOctets >> 8) & 0xFF, lastOctets & 0xFF)
		}
	}

	/** A utility function to return subnet mask in IPv4 format given the prefix length */
	static subnetMaskFromPrefixLength(prefix: number): IPv4 {
		if (prefix < 0 || prefix > 32)
			throw Error(`Invalid IPv4 prefix length`)

		const octets: [ number, number, number, number ] = [ 0, 0, 0, 0 ]
		const filledOctetCount = Math.floor(prefix / 8)

		for (let index = filledOctetCount; index--;)
			octets[index] = 255

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
		let /** non-zero encountered stop scanning for zeros */ stop = false
		let cidr = 0

		for (let index = 4; index--;) {
			const zeros = { 0: 8, 128: 7, 192: 6, 224: 5, 240: 4, 248: 3, 252: 2, 254: 1, 255: 0 }[this.octets[index]!]

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
		return IPv6.fromBytes(
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xFF, 0xFF, ...this.octets as any as [ number, number, number, number ]
		)
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

function parseIntAuto(string: string): number {
	// Hexadedimal base 16 (0x#)
	if (/^0x[a-f\d]+$/i.test(string))
		return parseInt(string, 16)

	// While octal representation is discouraged by ECMAScript 3
	// and forbidden by ECMAScript 5, we silently allow it to
	// work only if the rest of the string has numbers less than 8.
	if (string[0] === `0` && !isNaN(parseInt(string[1]!, 10))) {
		if (/^0[0-7]+$/.test(string))
			return parseInt(string, 8)

		return NaN
	}

	// Always include the base 10 radix!
	return parseInt(string, 10)
}
