import * as IPv4 from "./IPv4"
import * as IPv6 from "./IPv6"
import type { StringSuggest } from "./internal"

export type CIDR<IP extends IPv4.IPv4 | IPv6.IPv6> = { ip: IP, maskLength: number }

export type RangeList<T extends IPv4.IPv4 | IPv6.IPv6> =
	Map<StringSuggest<T extends IPv4.IPv4 ? IPv4.Range : IPv6.Range>, CIDR<T>[]>

export const toString = <T extends IPv4.IPv4 | IPv6.IPv6>(cidr: CIDR<T>): string =>
	`${IPv4.is(cidr.ip) ? IPv4.toString(cidr.ip) : IPv6.toString(cidr.ip)}/${cidr.maskLength}`
