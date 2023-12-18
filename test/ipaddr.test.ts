import { describe, expect, test } from "vitest"
import { IPv4, IPv6, parse, parseCIDR, process } from "../src"

describe("new IPv4()", () => {
	const u8View = new Uint8Array([ 167, 162, 196, 35 ])

	expect(new IPv4(u8View).octets).toBe(u8View)

	test("reject invalid Uint8Array", () =>
		expect(() => new IPv4(new Uint8Array([ 73, 81, 19, 189, 70 ]))).toThrow(Error)
	)
})

test("IPv4.fromBytes()", () =>
	expect(IPv4.fromBytes(149, 187, 3, 11).octets).toEqual(new Uint8Array([ 149, 187, 3, 11 ]))
)

test("IPv4.prototype.toString()", () =>
	expect((IPv4.fromBytes(143, 196, 224, 197)).toString()).toBe("143.196.224.197")
)

test("IPv4.prototype.toNormalizedString()", () =>
	expect((IPv4.fromBytes(40, 50, 136, 232)).toNormalizedString()).toBe("40.50.136.232")
)

test("IPv4.parseCIDR()", () =>
	expect((IPv4.parseCIDR("108.78.3.18/24"))).toEqual([ IPv4.fromBytes(108, 78, 3, 18), 24 ])
)

test("IPv4.parseCIDR().toString()", () =>
	expect((IPv4.parseCIDR("219.57.166.53/24")).toString()).toBe("219.57.166.53/24")
)

describe("IPv4.isIPv4()", () => {
	expect(IPv4.isIPv4("242.41.0247.0x23")).toBe(true)
	test("accept invalid IPv4", () => expect(IPv4.isIPv4("256.229.119.175")).toBe(true))
	test("detect non-IPv4 string", () => expect(IPv4.isIPv4("202.0x5A.foo.234")).toBe(false))
})

describe("IPv4.isValid()", () => {
	expect(IPv4.isValid("120.206.0370.0xCA")).toBe(true)
	test("detect invalid IPv4", () => expect(IPv4.isValid("256.163.10.46")).toBe(false))
	test("detect non-IPv4 string", () => expect(IPv4.isValid("113.0x34.foo.117")).toBe(false))
})

describe("IPv4.parse()", () => {
	test("standard format", () => expect(IPv4.parse("50.251.1.32").octets).toEqual(new Uint8Array([ 50, 251, 1, 32 ])))
	test("hex", () => expect(IPv4.parse("0x22.101.208.167").octets).toEqual(new Uint8Array([ 34, 101, 208, 167 ])))
	test("octal", () => expect(IPv4.parse("6.0373.46.63").octets).toEqual(new Uint8Array([ 6, 251, 46, 63 ])))
	test("long hex", () => expect(IPv4.parse("0xF6FB314C").octets).toEqual(new Uint8Array([ 246, 251, 49, 76 ])))
	test("long octal", () => expect(IPv4.parse("027227354757").octets).toEqual(new Uint8Array([ 186, 93, 217, 239 ])))
	test("long", () => expect(IPv4.parse("3512666314").octets).toEqual(new Uint8Array([ 209, 95, 8, 202 ])))
	test("3 parts", () => expect(IPv4.parse("172.178.1270").octets).toEqual(new Uint8Array([ 172, 178, 4, 246 ])))
	test("2 parts", () => expect(IPv4.parse("25.3367299").octets).toEqual(new Uint8Array([ 25, 51, 97, 131 ])))

	describe("reject invalid IPv4", () => {
		test("non-IPv4 string", () => expect(() => IPv4.parse("133.89.60.foo")).toThrow())

		describe("part out of range", () => {
			test("2 parts", () => expect(() => IPv4.parse("244.16777216")).toThrow())
			test("3 parts", () => expect(() => IPv4.parse("96.197.65536")).toThrow())
		})

		test("invalid octal", () => expect(() => IPv4.parse('86.08.13.97')).toThrow())
	})
})

IPv4.fromBytes(10, 5, 0, 1).match

test("IPv4.prototype.match()", () => {
	const address = IPv4.fromBytes(10, 5, 0, 1)

	expect(address.match(IPv4.fromBytes(0, 0, 0, 0), 0)).toBe(true)
	expect(address.match(IPv4.fromBytes(11, 0, 0, 0), 8)).toBe(false)
	expect(address.match(IPv4.fromBytes(10, 0, 0, 0), 8)).toBe(true)
	expect(address.match(IPv4.fromBytes(10, 0, 0, 1), 8)).toBe(true)
	expect(address.match(IPv4.fromBytes(10, 0, 0, 10), 8)).toBe(true)
	expect(address.match(IPv4.fromBytes(10, 5, 5, 0), 16)).toBe(true)
	expect(address.match(IPv4.fromBytes(10, 4, 5, 0), 16)).toBe(false)
	expect(address.match(IPv4.fromBytes(10, 4, 5, 0), 15)).toBe(true)
	expect(address.match(IPv4.fromBytes(10, 5, 0, 2), 32)).toBe(false)
	expect(address.match(address, 32)).toBe(true)
})

test("parseCIDR()", () => {
	expect(parseCIDR("1.2.3.4/24").toString()).toBe("1.2.3.4/24")
	expect(parseCIDR("::1%zone/24").toString()).toBe("::1%zone/24")
})

test("IPv4.parseCIDR()", () => {
	const address = IPv4.fromBytes(10, 5, 0, 1)

	expect(address.match(...IPv4.parseCIDR("0.0.0.0/0"))).toBe(true)
	expect(address.match(...IPv4.parseCIDR("11.0.0.0/8"))).toBe(false)
	expect(address.match(...IPv4.parseCIDR("10.0.0.0/8"))).toBe(true)
	expect(address.match(...IPv4.parseCIDR("10.0.0.1/8"))).toBe(true)
	expect(address.match(...IPv4.parseCIDR("10.0.0.10/8"))).toBe(true)
	expect(address.match(...IPv4.parseCIDR("10.0.0.10/8"))).toBe(true)
	expect(address.match(...IPv4.parseCIDR("10.5.5.0/16"))).toBe(true)
	expect(address.match(...IPv4.parseCIDR("10.4.5.0/16"))).toBe(false)
	expect(address.match(...IPv4.parseCIDR("10.4.5.0/15"))).toBe(true)
	expect(address.match(...IPv4.parseCIDR("10.5.0.2/32"))).toBe(false)
	expect(address.match(...IPv4.parseCIDR("10.5.0.1/32"))).toBe(true)
	expect(() => IPv4.parseCIDR("10.5.0.1")).toThrow(Error)
	expect(() => IPv4.parseCIDR("0.0.0.0/-1")).toThrow(Error)
	expect(() => IPv4.parseCIDR("0.0.0.0/33")).toThrow(Error)
})

test("IPv4.prototype.range()", () => {
	expect(IPv4.fromBytes(0, 0, 0, 0).range()).toBe("unspecified")
	expect(IPv4.fromBytes(0, 1, 0, 0).range()).toBe("unspecified")
	expect(IPv4.fromBytes(10, 1, 0, 1).range()).toBe("private")
	expect(IPv4.fromBytes(100, 64, 0, 0).range()).toBe("carrierGradeNat")
	expect(IPv4.fromBytes(100, 127, 255, 255).range()).toBe("carrierGradeNat")
	expect(IPv4.fromBytes(192, 168, 2, 1).range()).toBe("private")
	expect(IPv4.fromBytes(224, 100, 0, 1).range()).toBe("multicast")
	expect(IPv4.fromBytes(169, 254, 15, 0).range()).toBe("linkLocal")
	expect(IPv4.fromBytes(127, 1, 1, 1).range()).toBe("loopback")
	expect(IPv4.fromBytes(255, 255, 255, 255).range()).toBe("broadcast")
	expect(IPv4.fromBytes(240, 1, 2, 3).range()).toBe("reserved")
	expect(IPv4.fromBytes(8, 8, 8, 8).range()).toBe("unicast")
})

describe("IPv4.isValidFourPartDecimal()", () => {
	expect(IPv4.isValidFourPartDecimal("0.0.0.0")).toBe(true)
	expect(IPv4.isValidFourPartDecimal("127.0.0.1")).toBe(true)
	expect(IPv4.isValidFourPartDecimal("192.168.1.1")).toBe(true)
	expect(IPv4.isValidFourPartDecimal("0xC0.168.1.1")).toBe(false)

	test("leading zeroes", () => {
		expect(IPv4.isValidFourPartDecimal("000000192.168.100.2")).toBe(false)
		expect(IPv4.isValidFourPartDecimal("192.0000168.100.2")).toBe(false)
	})

	test("trailing zeroes", () => {
		expect(IPv4.isValidFourPartDecimal("192.168.100.00000002")).toBe(false)
		expect(IPv4.isValidFourPartDecimal("192.168.100.20000000")).toBe(false)
	})
})

describe("new IPv6()", () => {
	const u16View = new Uint16Array([ 0x2001, 0xDB8, 0xF53A, 0, 0, 0, 0, 1 ])

	expect(new IPv6(u16View).hextets).toBe(u16View)

	test("reject invalid Uint16Array", () =>
		expect(() => new IPv6(new Uint16Array([ 51949, 17327, 14492, 12043, 34687, 33000, 19107 ]))).toThrow(Error)
	)
})

test("IPv6.fromBytes()", () =>
	expect(IPv6.fromBytes(58, 19, 11, 144, 148, 239, 218, 206, 117, 61, 108, 90, 134, 0, 148, 47).hextets)
		.toEqual(new Uint16Array([ 14867, 2960, 38127, 56014, 30013, 27738, 34304, 37935 ]))
)

test("IPv6.fromHextets()", () =>
	expect(IPv6.fromHextets(42760, 21232, 25849, 30266, 13260, 63680, 46381, 38566).hextets)
		.toEqual(new Uint16Array([ 42760, 21232, 25849, 30266, 13260, 63680, 46381, 38566 ]))
)

test("IPv6.prototype.toNormalizedString()", () => {
	expect(IPv6.fromHextets(0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1).toNormalizedString()).toBe("2001:db8:f53a:0:0:0:0:1")

	expect(IPv6.fromHextets(0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1, "utun0").toNormalizedString())
		.toBe("2001:db8:f53a:0:0:0:0:1%utun0")

	expect(parse("::ffff:192.168.1.1%eth0").toNormalizedString()).toBe("0:0:0:0:0:ffff:c0a8:101%eth0")
})

test("IPv6.prototype.toFixedLengthString()", () =>
	expect(IPv6.fromHextets(0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1).toFixedLengthString())
		.toBe("2001:0db8:f53a:0000:0000:0000:0000:0001")
)

test("IPv6.prototype.toString()", () => {
	expect(IPv6.fromHextets(0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1).toString()).toBe("2001:db8:f53a::1")
	expect(IPv6.fromHextets(0, 0, 0, 0, 0, 0, 0, 0).toString()).toBe("::")
	expect(IPv6.fromHextets(0, 0, 0, 0, 0, 0, 0, 1).toString()).toBe("::1")
	expect(IPv6.fromHextets(0x2001, 0xdb8, 0, 0, 0, 0, 0, 0).toString()).toBe("2001:db8::")
	expect(IPv6.fromHextets(0, 0xff, 0, 0, 0, 0, 0, 0).toString()).toBe("0:ff::")
	expect(IPv6.fromHextets(0, 0, 0, 0, 0, 0, 0xff, 0).toString()).toBe("::ff:0")
	expect(IPv6.fromHextets(0, 0, 0xff, 0, 0, 0, 0, 0).toString()).toBe("0:0:ff::")
	expect(IPv6.fromHextets(0, 0, 0, 0, 0, 0xff, 0, 0).toString()).toBe("::ff:0:0")
	expect(IPv6.fromHextets(0, 0, 0, 0xff, 0xff, 0, 0, 0).toString()).toBe("::ff:ff:0:0:0")

	expect(IPv6.fromHextets(0x2001, 0xdb8, 0xff, 0xabc, 0xdef, 0x123b, 0x456c, 0x78d).toString())
		.toBe("2001:db8:ff:abc:def:123b:456c:78d")

	expect(IPv6.fromHextets(0x2001, 0xdb8, 0xff, 0xabc, 0, 0x123b, 0x456c, 0x78d).toString())
		.toBe("2001:db8:ff:abc:0:123b:456c:78d")

	expect(IPv6.fromHextets(0x2001, 0xdb8, 0xff, 0xabc, 0, 0, 0x456c, 0x78d).toString())
		.toBe("2001:db8:ff:abc::456c:78d")

	expect(IPv6.fromHextets(0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1, "utun0").toString()).toBe("2001:db8:f53a::1%utun0")
	expect(parse("::ffff:192.168.1.1%eth0").toString()).toBe("::ffff:c0a8:101%eth0")
	expect(parse("::ffff:192.168.1.1%2").toString()).toBe("::ffff:c0a8:101%2")
	expect(parse("::ffff:192.168.1.1%WAT").toString()).toBe("::ffff:c0a8:101%WAT")
	expect(parse("::ffff:192.168.1.1%sUp").toString()).toBe("::ffff:c0a8:101%sUp")
})

test("IPv6.parseCIDR()", () => {
	expect(IPv6.parseCIDR('0:0:0:0:0:0:0:0/64').toString()).toBe("::/64")
	expect(IPv6.parseCIDR('0:0:0:ff:ff:0:0:0/64').toString()).toBe("::ff:ff:0:0:0/64")

	expect(IPv6.parseCIDR('2001:db8:ff:abc:def:123b:456c:78d/64').toString())
		.toBe("2001:db8:ff:abc:def:123b:456c:78d/64")
})

// See https://tools.ietf.org/html/rfc5952#section-4
test("IPv6.prototype.toRFC5952String()", () => {
	expect((IPv6.fromHextets(8193, 3512, 62778, 0, 0, 0, 0, 1)).toRFC5952String()).toBe("2001:db8:f53a::1")
	expect(IPv6.fromHextets(0, 0, 0, 0, 0, 0, 0, 0).toRFC5952String()).toBe("::")
	expect(IPv6.fromHextets(0, 0, 0, 0, 0, 0, 0, 1).toRFC5952String()).toBe("::1")
	expect(IPv6.fromHextets(0x2001, 0xdb8, 0, 0, 0, 0, 0, 0).toRFC5952String()).toBe("2001:db8::")

	// longest set of zeroes gets collapsed (section 4.2.3)
	expect(IPv6.fromHextets(0, 0xff, 0, 0, 0, 0, 0, 0).toRFC5952String()).toBe("0:ff::")
	expect(IPv6.fromHextets(0, 0, 0, 0, 0, 0, 0xff, 0).toRFC5952String()).toBe("::ff:0")
	expect(IPv6.fromHextets(0, 0, 0xff, 0, 0, 0, 0, 0).toRFC5952String()).toBe("0:0:ff::")
	expect(IPv6.fromHextets(0, 0, 0, 0, 0, 0xff, 0, 0).toRFC5952String()).toBe("::ff:0:0")
	expect(IPv6.fromHextets(0x2001, 0, 0, 0, 0xff, 0, 0, 0).toRFC5952String()).toBe("2001::ff:0:0:0")
	expect(IPv6.fromHextets(0x2001, 0xdb8, 0xff, 0xabc, 0xdef, 0x123b, 0x456c, 0x78d).toRFC5952String()).toBe("2001:db8:ff:abc:def:123b:456c:78d")

	// don't shorten single 0s (section 4.2.2)
	expect(IPv6.fromHextets(0x2001, 0xdb8, 0xff, 0xabc, 0, 0x123b, 0x456c, 0x78d).toRFC5952String()).toBe("2001:db8:ff:abc:0:123b:456c:78d")
	expect(IPv6.fromHextets(0x2001, 0xdb8, 0xff, 0xabc, 0x78d, 0x123b, 0x456c, 0).toRFC5952String()).toBe("2001:db8:ff:abc:78d:123b:456c:0")
	expect(IPv6.fromHextets(0, 0xdb8, 0xff, 0xabc, 0x78d, 0x123b, 0x456c, 0x2001).toRFC5952String()).toBe("0:db8:ff:abc:78d:123b:456c:2001")

	expect(IPv6.fromHextets(0x2001, 0xdb8, 0xff, 0xabc, 0, 0, 0x456c, 0x78d).toRFC5952String()).toBe("2001:db8:ff:abc::456c:78d")
})

test("parse()", () => {
	expect(parse("2001:db8:f53a::1%2").toString()).toBe("2001:db8:f53a::1%2")
	expect(parse("2001:db8:f53a::1%WAT").toString()).toBe("2001:db8:f53a::1%WAT")
	expect(parse("2001:db8:f53a::1%sUp").toString()).toBe("2001:db8:f53a::1%sUp")
	expect(() => parse("::some.nonsense")).toThrow()
	expect(parse("8.8.8.8")).toBeInstanceOf(IPv4)
	expect(parse("2001:db8:3312::1")).toBeInstanceOf(IPv6)
	expect(parse("2001:db8:3312::1%z")).toBeInstanceOf(IPv6)
})

test("IPv6.isIPv6()", () => {
	expect(IPv6.isIPv6("2001:db8:F53A::1")).toBe(true)
	expect(IPv6.isIPv6("200001::1")).toBe(true)
	expect(IPv6.isIPv6("::ffff:192.168.1.1")).toBe(true)
	expect(IPv6.isIPv6("::ffff:192.168.1.1%z")).toBe(true)
	expect(IPv6.isIPv6("::10.2.3.4")).toBe(true)
	expect(IPv6.isIPv6("::12.34.56.78%z")).toBe(true)
	expect(IPv6.isIPv6("::ffff:300.168.1.1")).toBe(false)
	expect(IPv6.isIPv6("::ffff:300.168.1.1:0")).toBe(false)
	expect(IPv6.isIPv6("fe80::foo")).toBe(false)
	expect(IPv6.isIPv6("fe80::%")).toBe(false)
})

test("IPv6.isValid()", () => {
	expect(IPv6.isValid("2001:db8:F53A::1")).toBe(true)
	expect(IPv6.isValid("200001::1")).toBe(false)
	expect(IPv6.isValid("::ffff:192.168.1.1")).toBe(true)
	expect(IPv6.isValid("::ffff:192.168.1.1%z")).toBe(true)
	expect(IPv6.isValid("::1.1.1.1")).toBe(true)
	expect(IPv6.isValid("::1.2.3.4%z")).toBe(true)
	expect(IPv6.isValid("::ffff:300.168.1.1")).toBe(false)
	expect(IPv6.isValid("::ffff:300.168.1.1:0")).toBe(false)
	expect(IPv6.isValid("::ffff:222.1.41.9000")).toBe(false)
	expect(IPv6.isValid("2001:db8::F53A::1")).toBe(false)
	expect(IPv6.isValid("fe80::foo")).toBe(false)
	expect(IPv6.isValid("fe80::%")).toBe(false)
	expect(IPv6.isValid("2002::2:")).toBe(false)
	expect(IPv6.isValid("::%z")).toBe(true)
	expect(IPv6.isValid("")).toBe(false)
})

test("IPv6.parse()", () => {
	expect(IPv6.parse("2001:db8:F53A:0:0:0:0:1").hextets)
		.toEqual(new Uint16Array([ 0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1 ]))

	expect(IPv6.parse("fe80::10").hextets).toEqual(new Uint16Array([ 0xfe80, 0, 0, 0, 0, 0, 0, 0x10 ]))
	expect(IPv6.parse("2001:db8:F53A::").hextets).toEqual(new Uint16Array([ 0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 0 ]))
	expect(IPv6.parse("::1").hextets).toEqual(new Uint16Array([ 0, 0, 0, 0, 0, 0, 0, 1 ]))
	expect(IPv6.parse("::8.8.8.8").hextets).toEqual(new Uint16Array([ 0, 0, 0, 0, 0, 0xffff, 2056, 2056 ]))
	expect(IPv6.parse("::").hextets).toEqual(new Uint16Array([ 0, 0, 0, 0, 0, 0, 0, 0 ]))
	expect(IPv6.parse("::%z").hextets).toEqual(new Uint16Array([ 0, 0, 0, 0, 0, 0, 0, 0 ]))
	expect(IPv6.parse("::%z").zoneId).toEqual("z")
	expect(() => IPv6.parse("fe80::0::1")).toThrow()
})

test("IPv6.prototype.match()", () => {
	const address = IPv6.parse("2001:db8:f53a::1")

	expect(address.match(IPv6.parse("::"), 0)).toBe(true)
	expect(address.match(IPv6.parse("2001:db8:f53a::1:1"), 64)).toBe(true)
	expect(address.match(IPv6.parse("2001:db8:f53b::1:1"), 48)).toBe(false)
	expect(address.match(IPv6.parse("2001:db8:f531::1:1"), 44)).toBe(true)
	expect(address.match(IPv6.parse("2001:db8:f500::1"), 40)).toBe(true)
	expect(address.match(IPv6.parse("2001:db8:f500::1%z"), 40)).toBe(true)
	expect(address.match(IPv6.parse("2001:db9:f500::1"), 40)).toBe(false)
	expect(address.match(IPv6.parse("2001:db9:f500::1%z"), 40)).toBe(false)
	expect(address.match(address, 128)).toBe(true)
})

test("IPv6.parseCIDR()", () => {
	const address = IPv6.parse("2001:db8:f53a::1")

	expect(address.match(...IPv6.parseCIDR("::/0"))).toBe(true)
	expect(address.match(...IPv6.parseCIDR("2001:db8:f53a::1:1/64"))).toBe(true)
	expect(address.match(...IPv6.parseCIDR("2001:db8:f53b::1:1/48"))).toBe(false)
	expect(address.match(...IPv6.parseCIDR("2001:db8:f531::1:1/44"))).toBe(true)
	expect(address.match(...IPv6.parseCIDR("2001:db8:f500::1/40"))).toBe(true)
	expect(address.match(...IPv6.parseCIDR("2001:db8:f500::1%z/40"))).toBe(true)
	expect(address.match(...IPv6.parseCIDR("2001:db9:f500::1/40"))).toBe(false)
	expect(address.match(...IPv6.parseCIDR("2001:db9:f500::1%z/40"))).toBe(false)
	expect(address.match(...IPv6.parseCIDR("2001:db8:f53a::1/128"))).toBe(true)
	expect(() => IPv6.parseCIDR("2001:db8:f53a::1")).toThrow()
	expect(() => IPv6.parseCIDR("2001:db8:f53a::1/-1")).toThrow()
	expect(() => IPv6.parseCIDR("2001:db8:f53a::1/129")).toThrow()
})

test("IPv4.prototype.toIPv4MappedAddress()", () => {
	const address = IPv4.parse("77.88.21.11")
	const mappedAddress = address.toIPv4MappedAddress()

	expect(mappedAddress.hextets).toEqual(new Uint16Array([ 0, 0, 0, 0, 0, 0xffff, 0x4d58, 0x150b ]))
	expect(mappedAddress.toIPv4Address().octets).toEqual(address.octets)
})

test("IPv6.prototype.toIPv4Address()", () => {
	expect(() => IPv6.parse("2001:db8::1").toIPv4Address()).toThrow()
})

test("IPv6.prototype.range()", () => {
	expect(IPv6.parse("::").range()).toBe("unspecified")
	expect(IPv6.parse("fe80::1234:5678:abcd:0123").range()).toBe("linkLocal")
	expect(IPv6.parse("ff00::1234").range()).toBe("multicast")
	expect(IPv6.parse("::1").range()).toBe("loopback")
	expect(IPv6.parse("fc00::").range()).toBe("uniqueLocal")
	expect(IPv6.parse("::ffff:192.168.1.10").range()).toBe("ipv4Mapped")
	expect(IPv6.parse("::ffff:0:192.168.1.10").range()).toBe("rfc6145")
	expect(IPv6.parse("2002:1f63:45e8::1").range()).toBe("6to4")
	expect(IPv6.parse("2001::4242").range()).toBe("teredo")
	expect(IPv6.parse("2001:2::").range()).toBe("benchmarking")
	expect(IPv6.parse("2001:3::").range()).toBe("amt")
	expect(IPv6.parse("2001:4:112::").range()).toBe("as112v6")
	expect(IPv6.parse("2001:10::").range()).toBe("deprecated")
	expect(IPv6.parse("2001:20::").range()).toBe("orchid2")
	expect(IPv6.parse("2001:db8::3210").range()).toBe("reserved")
	expect(IPv6.parse("2001:470:8:66::1").range()).toBe("unicast")
	expect(IPv6.parse("2001:470:8:66::1%z").range()).toBe("unicast")
})

test("process()", () => {
	expect(process("8.8.8.8")).toBeInstanceOf(IPv4)
	expect(process("2001:db8:3312::1")).toBeInstanceOf(IPv6)
	expect(process("::ffff:192.168.1.1")).toBeInstanceOf(IPv4)
	expect(process("::ffff:192.168.1.1%z")).toBeInstanceOf(IPv4)
	expect(process("::8.8.8.8")).toBeInstanceOf(IPv4)
})

test("IPv{4,6}.prototype.toByteArray()", () => {
	expect(parse("1.2.3.4").toByteArray()).toEqual(new Uint8Array([ 0x1, 0x2, 0x3, 0x4 ]))

	expect(parse("2a00:1450:8007::68").toByteArray()).toEqual(
		new Uint8Array([ 42, 0x00, 0x14, 0x50, 0x80, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x68 ])
	)
})

// it('correctly parses 1 as an IPv4 address', () => {
// 	assert.equal(ipaddr.IPv6.isValid('1'), false);
// 	assert.equal(ipaddr.IPv4.isValid('1'), true);
// 	assert.deepEqual(new ipaddr.IPv4([0, 0, 0, 1]), ipaddr.parse('1'));
// })

// it('correctly detects IPv4 and IPv6 CIDR addresses', () => {
// 	assert.deepEqual(
// 		[ipaddr.IPv6.parse('fc00::'), 64],
// 		ipaddr.parseCIDR('fc00::/64')
// 	);
// 	assert.deepEqual(
// 		[ipaddr.IPv4.parse('1.2.3.4'), 5],
// 		ipaddr.parseCIDR('1.2.3.4/5')
// 	);
// })

// it('does not consider a very large or very small number a valid IP address', () => {
// 	assert.equal(ipaddr.isValid('4999999999'), false);
// 	assert.equal(ipaddr.isValid('-1'), false);
// })

// it('does not hang on ::8:8:8:8:8:8:8:8:8', () => {
// 	assert.equal(ipaddr.IPv6.isValid('::8:8:8:8:8:8:8:8:8'), false);
// 	assert.equal(ipaddr.IPv6.isValid('::8:8:8:8:8:8:8:8:8%z'), false);
// })

// it('subnetMatch does not fail on empty range', () => {
// 	ipaddr.subnetMatch(new ipaddr.IPv4([1, 2, 3, 4]), {}, false);
// 	ipaddr.subnetMatch(new ipaddr.IPv4([1, 2, 3, 4]), { subnet: [] }, false);
// })

// it('subnetMatch returns default subnet on empty range', () => {
// 	assert.equal(ipaddr.subnetMatch(new ipaddr.IPv4([1, 2, 3, 4]), {}, false), false);
// 	assert.equal(ipaddr.subnetMatch(new ipaddr.IPv4([1, 2, 3, 4]), { subnet: [] }, false), false);
// })

// it('subnetMatch does not fail on IPv4 when looking for IPv6', () => {
// 	let rangelist = { subnet6: ipaddr.parseCIDR('fe80::/64') };
// 	assert.equal(ipaddr.subnetMatch(new ipaddr.IPv4([1, 2, 3, 4]), rangelist, false), false);
// })

// it('subnetMatch does not fail on IPv6 when looking for IPv4', () => {
// 	let rangelist = { subnet4: ipaddr.parseCIDR('1.2.3.0/24') };
// 	assert.equal(ipaddr.subnetMatch(new ipaddr.IPv6([0xfe80, 0, 0, 0, 0, 0, 0, 1]), rangelist, false), false);
// })

// it('subnetMatch can use a hybrid IPv4/IPv6 range list', () => {
// 	let rangelist = { dual64: [ipaddr.parseCIDR('1.2.4.0/24'), ipaddr.parseCIDR('2001:1:2:3::/64')] };
// 	assert.equal(ipaddr.subnetMatch(new ipaddr.IPv4([1, 2, 4, 1]), rangelist, false), 'dual64');
// 	assert.equal(ipaddr.subnetMatch(new ipaddr.IPv6([0x2001, 1, 2, 3, 0, 0, 0, 1]), rangelist, false), 'dual64');
// })

// it('is able to determine IP address type from byte array input', () => {
// 	assert.equal(ipaddr.fromByteArray([0x7f, 0, 0, 1]).kind(), 'ipv4');
// 	assert.equal(ipaddr.fromByteArray([0x20, 0x01, 0xd, 0xb8, 0xf5, 0x3a, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]).kind(), 'ipv6');
// 	assert.throws(() => {
// 		ipaddr.fromByteArray([1]);
// 	});
// })

// it('prefixLengthFromSubnetMask returns proper CIDR notation for standard IPv4 masks', () => {
// 	assert.equal(ipaddr.IPv4.parse('255.255.255.255').prefixLengthFromSubnetMask(), 32);
// 	assert.equal(ipaddr.IPv4.parse('255.255.255.254').prefixLengthFromSubnetMask(), 31);
// 	assert.equal(ipaddr.IPv4.parse('255.255.255.252').prefixLengthFromSubnetMask(), 30);
// 	assert.equal(ipaddr.IPv4.parse('255.255.255.248').prefixLengthFromSubnetMask(), 29);
// 	assert.equal(ipaddr.IPv4.parse('255.255.255.240').prefixLengthFromSubnetMask(), 28);
// 	assert.equal(ipaddr.IPv4.parse('255.255.255.224').prefixLengthFromSubnetMask(), 27);
// 	assert.equal(ipaddr.IPv4.parse('255.255.255.192').prefixLengthFromSubnetMask(), 26);
// 	assert.equal(ipaddr.IPv4.parse('255.255.255.128').prefixLengthFromSubnetMask(), 25);
// 	assert.equal(ipaddr.IPv4.parse('255.255.255.0').prefixLengthFromSubnetMask(), 24);
// 	assert.equal(ipaddr.IPv4.parse('255.255.254.0').prefixLengthFromSubnetMask(), 23);
// 	assert.equal(ipaddr.IPv4.parse('255.255.252.0').prefixLengthFromSubnetMask(), 22);
// 	assert.equal(ipaddr.IPv4.parse('255.255.248.0').prefixLengthFromSubnetMask(), 21);
// 	assert.equal(ipaddr.IPv4.parse('255.255.240.0').prefixLengthFromSubnetMask(), 20);
// 	assert.equal(ipaddr.IPv4.parse('255.255.224.0').prefixLengthFromSubnetMask(), 19);
// 	assert.equal(ipaddr.IPv4.parse('255.255.192.0').prefixLengthFromSubnetMask(), 18);
// 	assert.equal(ipaddr.IPv4.parse('255.255.128.0').prefixLengthFromSubnetMask(), 17);
// 	assert.equal(ipaddr.IPv4.parse('255.255.0.0').prefixLengthFromSubnetMask(), 16);
// 	assert.equal(ipaddr.IPv4.parse('255.254.0.0').prefixLengthFromSubnetMask(), 15);
// 	assert.equal(ipaddr.IPv4.parse('255.252.0.0').prefixLengthFromSubnetMask(), 14);
// 	assert.equal(ipaddr.IPv4.parse('255.248.0.0').prefixLengthFromSubnetMask(), 13);
// 	assert.equal(ipaddr.IPv4.parse('255.240.0.0').prefixLengthFromSubnetMask(), 12);
// 	assert.equal(ipaddr.IPv4.parse('255.224.0.0').prefixLengthFromSubnetMask(), 11);
// 	assert.equal(ipaddr.IPv4.parse('255.192.0.0').prefixLengthFromSubnetMask(), 10);
// 	assert.equal(ipaddr.IPv4.parse('255.128.0.0').prefixLengthFromSubnetMask(), 9);
// 	assert.equal(ipaddr.IPv4.parse('255.0.0.0').prefixLengthFromSubnetMask(), 8);
// 	assert.equal(ipaddr.IPv4.parse('254.0.0.0').prefixLengthFromSubnetMask(), 7);
// 	assert.equal(ipaddr.IPv4.parse('252.0.0.0').prefixLengthFromSubnetMask(), 6);
// 	assert.equal(ipaddr.IPv4.parse('248.0.0.0').prefixLengthFromSubnetMask(), 5);
// 	assert.equal(ipaddr.IPv4.parse('240.0.0.0').prefixLengthFromSubnetMask(), 4);
// 	assert.equal(ipaddr.IPv4.parse('224.0.0.0').prefixLengthFromSubnetMask(), 3);
// 	assert.equal(ipaddr.IPv4.parse('192.0.0.0').prefixLengthFromSubnetMask(), 2);
// 	assert.equal(ipaddr.IPv4.parse('128.0.0.0').prefixLengthFromSubnetMask(), 1);
// 	assert.equal(ipaddr.IPv4.parse('0.0.0.0').prefixLengthFromSubnetMask(), 0);
// 	// negative cases
// 	assert.equal(ipaddr.IPv4.parse('192.168.255.0').prefixLengthFromSubnetMask(), null);
// 	assert.equal(ipaddr.IPv4.parse('255.0.255.0').prefixLengthFromSubnetMask(), null);
// })

// it('prefixLengthFromSubnetMask returns proper CIDR notation for standard IPv6 masks', () => {
// 	assert.equal(ipaddr.IPv6.parse('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff').prefixLengthFromSubnetMask(), 128);
// 	assert.equal(ipaddr.IPv6.parse('ffff:ffff:ffff:ffff::').prefixLengthFromSubnetMask(), 64);
// 	assert.equal(ipaddr.IPv6.parse('ffff:ffff:ffff:ff80::').prefixLengthFromSubnetMask(), 57);
// 	assert.equal(ipaddr.IPv6.parse('ffff:ffff:ffff::').prefixLengthFromSubnetMask(), 48);
// 	assert.equal(ipaddr.IPv6.parse('ffff:ffff:ffff::%z').prefixLengthFromSubnetMask(), 48);
// 	assert.equal(ipaddr.IPv6.parse('::').prefixLengthFromSubnetMask(), 0);
// 	assert.equal(ipaddr.IPv6.parse('::%z').prefixLengthFromSubnetMask(), 0);
// 	// negative cases
// 	assert.equal(ipaddr.IPv6.parse('2001:db8::').prefixLengthFromSubnetMask(), null);
// 	assert.equal(ipaddr.IPv6.parse('ffff:0:0:ffff::').prefixLengthFromSubnetMask(), null);
// 	assert.equal(ipaddr.IPv6.parse('ffff:0:0:ffff::%z').prefixLengthFromSubnetMask(), null);
// })

// it('subnetMaskFromPrefixLength returns correct IPv4 subnet mask given prefix length', () => {

// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(0), '0.0.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(1), '128.0.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(2), '192.0.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(3), '224.0.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(4), '240.0.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(5), '248.0.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(6), '252.0.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(7), '254.0.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(8), '255.0.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(9), '255.128.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(10), '255.192.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(11), '255.224.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(12), '255.240.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(13), '255.248.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(14), '255.252.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(15), '255.254.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(16), '255.255.0.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(17), '255.255.128.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(18), '255.255.192.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(19), '255.255.224.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(20), '255.255.240.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(21), '255.255.248.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(22), '255.255.252.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(23), '255.255.254.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(24), '255.255.255.0');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(25), '255.255.255.128');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(26), '255.255.255.192');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(27), '255.255.255.224');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(28), '255.255.255.240');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(29), '255.255.255.248');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(30), '255.255.255.252');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(31), '255.255.255.254');
// 	assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(32), '255.255.255.255');
// })

// it('subnetMaskFromPrefixLength returns correct IPv6 subnet mask given prefix length', () => {
// 	assert.equal(ipaddr.IPv6.subnetMaskFromPrefixLength(128), 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
// 	assert.equal(ipaddr.IPv6.subnetMaskFromPrefixLength(112), 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:0');
// 	assert.equal(ipaddr.IPv6.subnetMaskFromPrefixLength(96),  'ffff:ffff:ffff:ffff:ffff:ffff::');
// 	assert.equal(ipaddr.IPv6.subnetMaskFromPrefixLength(72),  'ffff:ffff:ffff:ffff:ff00::');
// 	assert.equal(ipaddr.IPv6.subnetMaskFromPrefixLength(64),  'ffff:ffff:ffff:ffff::');
// 	assert.equal(ipaddr.IPv6.subnetMaskFromPrefixLength(48),  'ffff:ffff:ffff::');
// 	assert.equal(ipaddr.IPv6.subnetMaskFromPrefixLength(32),  'ffff:ffff::');
// 	assert.equal(ipaddr.IPv6.subnetMaskFromPrefixLength(16),  'ffff::');
// 	assert.equal(ipaddr.IPv6.subnetMaskFromPrefixLength(8),   'ff00::');
// 	assert.equal(ipaddr.IPv6.subnetMaskFromPrefixLength(4),   'f000::');
// 	assert.equal(ipaddr.IPv6.subnetMaskFromPrefixLength(2),   'c000::');
// 	assert.equal(ipaddr.IPv6.subnetMaskFromPrefixLength(1),   '8000::');
// 	assert.equal(ipaddr.IPv6.subnetMaskFromPrefixLength(0),   '::');
// })

// it('broadcastAddressFromCIDR returns correct IPv4 broadcast address', () => {
// 	assert.equal(ipaddr.IPv4.broadcastAddressFromCIDR('172.0.0.1/24'), '172.0.0.255');
// 	assert.equal(ipaddr.IPv4.broadcastAddressFromCIDR('172.0.0.1/26'), '172.0.0.63');
// })

// it('networkAddressFromCIDR returns correct IPv4 network address', () => {
// 	assert.equal(ipaddr.IPv4.networkAddressFromCIDR('172.0.0.1/24'), '172.0.0.0');
// 	assert.equal(ipaddr.IPv4.networkAddressFromCIDR('172.0.0.1/5'), '168.0.0.0');
// })

// it('networkAddressFromCIDR returns correct IPv6 network address', () => {
// 	assert.equal(ipaddr.IPv6.networkAddressFromCIDR('::/0'),                  '::');
// 	assert.equal(ipaddr.IPv6.networkAddressFromCIDR('2001:db8:f53a::1:1/64'), '2001:db8:f53a::');
// 	assert.equal(ipaddr.IPv6.networkAddressFromCIDR('2001:db8:f53b::1:1/48'), '2001:db8:f53b::');
// 	assert.equal(ipaddr.IPv6.networkAddressFromCIDR('2001:db8:f531::1:1/44'), '2001:db8:f530::');
// 	assert.equal(ipaddr.IPv6.networkAddressFromCIDR('2001:db8:f500::1/40'),   '2001:db8:f500::');
// 	assert.equal(ipaddr.IPv6.networkAddressFromCIDR('2001:db8:f500::1%z/40'), '2001:db8:f500::');
// 	assert.equal(ipaddr.IPv6.networkAddressFromCIDR('2001:db9:f500::1/40'),   '2001:db9:f500::');
// 	assert.equal(ipaddr.IPv6.networkAddressFromCIDR('2001:db9:f500::1%z/40'), '2001:db9:f500::');
// 	assert.equal(ipaddr.IPv6.networkAddressFromCIDR('2001:db8:f53a::1/128'),  '2001:db8:f53a::1');
// })

// it('broadcastAddressFromCIDR returns correct IPv6 broadcast address', () => {
// 	assert.equal(ipaddr.IPv6.broadcastAddressFromCIDR('::/0'),                  'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
// 	assert.equal(ipaddr.IPv6.broadcastAddressFromCIDR('2001:db8:f53a::1:1/64'), '2001:db8:f53a:0:ffff:ffff:ffff:ffff');
// 	assert.equal(ipaddr.IPv6.broadcastAddressFromCIDR('2001:db8:f53b::1:1/48'), '2001:db8:f53b:ffff:ffff:ffff:ffff:ffff');
// 	assert.equal(ipaddr.IPv6.broadcastAddressFromCIDR('2001:db8:f531::1:1/44'), '2001:db8:f53f:ffff:ffff:ffff:ffff:ffff');
// 	assert.equal(ipaddr.IPv6.broadcastAddressFromCIDR('2001:db8:f500::1/40'),   '2001:db8:f5ff:ffff:ffff:ffff:ffff:ffff');
// 	assert.equal(ipaddr.IPv6.broadcastAddressFromCIDR('2001:db8:f500::1%z/40'), '2001:db8:f5ff:ffff:ffff:ffff:ffff:ffff');
// 	assert.equal(ipaddr.IPv6.broadcastAddressFromCIDR('2001:db9:f500::1/40'),   '2001:db9:f5ff:ffff:ffff:ffff:ffff:ffff');
// 	assert.equal(ipaddr.IPv6.broadcastAddressFromCIDR('2001:db9:f500::1%z/40'), '2001:db9:f5ff:ffff:ffff:ffff:ffff:ffff');
// 	assert.equal(ipaddr.IPv6.broadcastAddressFromCIDR('2001:db8:f53a::1/128'),  '2001:db8:f53a::1');
// })
