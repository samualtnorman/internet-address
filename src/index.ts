import * as IPv4 from "./IPv4"
import { IPv6, type IPv6Range } from "./IPv6"
import type { StringSuggest } from "./internal"

export type RangeList<T extends IPv4.IPv4 | IPv6> = Map<StringSuggest<T extends IPv4.IPv4 ? IPv4.Range : IPv6Range>, CIDR<T>[]>

export class CIDR<IP extends IPv4.IPv4 | IPv6> {
	constructor(public ip: IP, public bits: number) {}

	toString() {
		return `${IPv4.is(this.ip) ? IPv4.toString(this.ip) : this.ip.toString()}/${this.bits}`
	}
}

/** @returns Parsed address, automatically converted to IPv4 if it is an IPv4-mapped address. */
export function process(address: string): IPv4.IPv4 | IPv6 | undefined {
	const ipv6 = IPv6.parse(address)

	return ipv6?.toIPv4Address() || ipv6 || IPv4.parse(address)
}
