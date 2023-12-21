import { parse as parseIPv4 } from "./IPv4"
import { IPv6 } from "./IPv6"

export * as IPv4 from "./IPv4"

declare const IPv4Tag: unique symbol

export type IPv4 = Uint8Array & { [IPv4Tag]: typeof IPv4Tag }

/** @returns Parsed address, automatically converted to IPv4 if it is an IPv4-mapped address. */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export function process(address: string): import(".").IPv4 | IPv6 | undefined {
	const ipv6 = IPv6.parse(address)

	return ipv6?.toIPv4Address() || ipv6 || parseIPv4(address)
}
