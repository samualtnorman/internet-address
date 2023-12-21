import { CIDR } from ".."
import { IPv6 } from "../IPv6"
import * as Common from "../internal"
import { type IPvXRangeDefaults } from "../internal"

export { range } from "./range"

declare const IPv4Tag: unique symbol

export type IPv4 = Uint8Array & { [IPv4Tag]: typeof IPv4Tag }
export type Range = IPvXRangeDefaults | "broadcast" | "carrierGradeNat" | "private"

export function fromUint8Array(u8View: Uint8Array): IPv4 {
	if (u8View.length != 4)
		throw Error(`Uint8Array should have a length of 4`)

	return u8View as IPv4
}

export const fromBytes = (byte0: number, byte1: number, byte2: number, byte3: number): IPv4 =>
	fromUint8Array(new Uint8Array([ byte0, byte1, byte2, byte3 ]))

export const is = (ip: any): ip is IPv4 => ip instanceof Uint8Array && ip.length == 4

/** @returns Broadcast address from CIDR or `undefined` if invalid. */
export function broadcastAddressFromCIDR(address: string): IPv4 | undefined {
	const cidr = parseCIDR(address)

	if (cidr) {
		const subnetMask = subnetMaskFromPrefixLength(cidr.bits)

		for (let index = 4; index--;)
			cidr.ip[index] |= subnetMask[index]! ^ 0xFF

		return cidr.ip
	}
}

/** Checks if a given string is a full four-part IPv4 Address. */
export const isValidFourPartDecimal = (address: string): boolean =>
	Boolean(/^(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*)){3}$/.test(address) && parse(address))

/** @returns Network address from CIDR or `undefined` if invalid. */
export function networkAddressFromCIDR(address: string): IPv4 | undefined {
	const cidr = parseCIDR(address)

	if (cidr) {
		const subnetMaskOctets = subnetMaskFromPrefixLength(cidr.bits)

		for (let index = 4; index--;)
			cidr.ip[index] &= subnetMaskOctets[index]!

		return cidr.ip
	}
}

/** Parses the string as an IPv4 Address with CIDR Notation. */
export function parseCIDR(address: string): CIDR<IPv4> | undefined {
	const match = /^(.+)\/(\d+)$/.exec(address)

	if (match) {
		const maskLength = Number(match[2])

		if (match[1] && maskLength >= 0 && maskLength <= 32) {
			const parsed = parse(match[1])

			if (parsed)
				return new CIDR(parsed, maskLength)
		}
	}
}

/** @returns Parsed IPv4 address or `undefined` if invalid. */
export function parse(string: string): IPv4 | undefined {
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
			return fromBytes(...bytes)
	} else if ((match = /^(\d+|0x[a-f\d]+)$/i.exec(string))) {
		const value = parseIntAuto(match[1]!)

		if (!isNaN(value) && value <= 0xFF_FF_FF_FF && value >= 0)
			return fromBytes((value >> 24) & 0xFF, (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF)
	} else if ((match = /^(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)$/i.exec(string))) {
		const firstOctet = parseIntAuto(match[1]!)
		const lastOctets = parseIntAuto(match[2]!)

		if (!isNaN(firstOctet) && !isNaN(lastOctets) && firstOctet <= 0xFF && firstOctet >= 0 &&
			lastOctets <= 0xFF_FF_FF && lastOctets >= 0
		)
			return fromBytes(firstOctet, (lastOctets >> 16) & 0xFF, (lastOctets >> 8) & 0xFF, lastOctets & 0xFF)
	} else if ((match = /^(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)\.(\d+|0x[a-f\d]+)$/i.exec(string))) {
		const firstOctet = parseIntAuto(match[1]!)
		const secondOctet = parseIntAuto(match[2]!)
		const lastOctets = parseIntAuto(match[3]!)

		if (!isNaN(firstOctet) && !isNaN(secondOctet) && !isNaN(lastOctets) &&
			firstOctet <= 0xFF && firstOctet >= 0 && secondOctet <= 0xFF &&
			secondOctet >= 0 && lastOctets <= 0xFF_FF && lastOctets >= 0
		)
			return fromBytes(firstOctet, secondOctet, (lastOctets >> 8) & 0xFF, lastOctets & 0xFF)
	}
}

/** @returns Subnet mask in IPv4 format given the prefix length */
export function subnetMaskFromPrefixLength(prefix: number): IPv4 {
	if (prefix < 0 || prefix > 32)
		throw Error(`Invalid IPv4 prefix length`)

	const octets: [ number, number, number, number ] = [ 0, 0, 0, 0 ]
	const filledOctetCount = Math.floor(prefix / 8)

	for (let index = filledOctetCount; index--;)
		octets[index] = 0xFF

	if (filledOctetCount < 4)
		octets[filledOctetCount] = (2 ** (prefix % 8)) - 1 << 8 - (prefix % 8)

	return fromBytes(...octets)
}

/** Checks if this address matches other one within given CIDR range. */
export const match = (addressA: IPv4, addressB: IPv4, bits: number): boolean =>
	Common.matchCIDR(addressA, addressB, 8, bits)

export const matchCIDR = (address: IPv4, cidr: CIDR<IPv4>): boolean => match(address, cidr.ip, cidr.bits)

/** returns a number of leading ones in IPv4 address, making sure that the rest is a solid sequence of zeros
  * (valid netmask)
  * @returns Either the CIDR length or `undefined` if mask is not valid */
export function prefixLengthFromSubnetMask(address: IPv4): number | undefined {
	let /** non-zero encountered stop scanning for zeros */ stop = false
	let cidr = 0

	for (let index = 4; index--;) {
		const zeros = { 0: 8, 128: 7, 192: 6, 224: 5, 240: 4, 248: 3, 252: 2, 254: 1, 255: 0 }[address[index]!]

		if (zeros == undefined || (stop && zeros != 0))
			return

		if (zeros != 8)
			stop = true

		cidr += zeros
	}

	return 32 - cidr
}

/** Converts this IPv4 address to an IPv4-mapped IPv6 address. */
export const toIPv4MappedAddress = (address: IPv4, zoneId?: string): IPv6 => IPv6.fromBytes(
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xFF, 0xFF, ...address as any as [ number, number, number, number ],
	zoneId
)

/** @returns The address in convenient, decimal-dotted format. */
export const toString = (address: IPv4): string => address.join(`.`)

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
