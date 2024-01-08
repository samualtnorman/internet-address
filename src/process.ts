import * as IPv4 from "./IPv4"
import * as IPv6 from "./IPv6"

/** @returns Parsed address, automatically converted to IPv4 if it is an IPv4-mapped address. */
export function process(address: string): IPv4.IPv4 | IPv6.IPv6 | undefined {
	const ipv6 = IPv6.parse(address)

	return ipv6 ? IPv6.toIPv4(ipv6) || ipv6 : IPv4.parse(address)
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest

	test(`process()`, () => {
		expect(process(`8.8.8.8`)).toStrictEqual<IPv4.IPv4>(IPv4.fromBytes(8, 8, 8, 8))

		expect(process(`2001:db8:3312::1`))
			.toStrictEqual<IPv6.IPv6>(IPv6.fromHextets(0x2001, 0xDB8, 0x3312, 0, 0, 0, 0, 1))

		expect(process(`::ffff:192.168.1.1`)).toStrictEqual<IPv4.IPv4>(IPv4.fromBytes(192, 168, 1, 1))
		expect(process(`::ffff:192.168.1.1%z`)).toStrictEqual<IPv4.IPv4>(IPv4.fromBytes(192, 168, 1, 1))
		expect(process(`::8.8.8.8`)).toStrictEqual<IPv4.IPv4>(IPv4.fromBytes(8, 8, 8, 8))
	})
}
