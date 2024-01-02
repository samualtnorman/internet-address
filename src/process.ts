import * as IPv4 from "./IPv4"
import * as IPv6 from "./IPv6"

/** @returns Parsed address, automatically converted to IPv4 if it is an IPv4-mapped address. */
export function process(address: string): IPv4.IPv4 | IPv6.IPv6 | undefined {
	const ipv6 = IPv6.parse(address)

	return ipv6 ? IPv6.toIPv4Address(ipv6) || ipv6 : IPv4.parse(address)
}
