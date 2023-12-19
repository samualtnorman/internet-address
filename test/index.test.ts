import { describe, expect, test } from "vitest"
import { IPv4, IPv6, RangeList, fromByteArray, isValid, parse, parseCIDR, process, subnetMatch } from "../src"

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
	expect((IPv4.parseCIDR("108.78.3.18/24"))).toEqual({ ip: IPv4.fromBytes(108, 78, 3, 18), bits: 24 })
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
	expect(IPv4.isValid("1")).toBe(true)
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

		test("invalid octal", () => expect(() => IPv4.parse("86.08.13.97")).toThrow())
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
	expect(parseCIDR("fc00::/64")).toEqual({ ip: IPv6.parse("fc00::"), bits: 64 })
	expect(parseCIDR("1.2.3.4/5")).toEqual({ ip: IPv4.parse("1.2.3.4"), bits: 5 })
})

test("IPv4.parseCIDR()", () => {
	const address = IPv4.fromBytes(10, 5, 0, 1)

	expect(address.matchCIDR(IPv4.parseCIDR("0.0.0.0/0"))).toBe(true)
	expect(address.matchCIDR(IPv4.parseCIDR("11.0.0.0/8"))).toBe(false)
	expect(address.matchCIDR(IPv4.parseCIDR("10.0.0.0/8"))).toBe(true)
	expect(address.matchCIDR(IPv4.parseCIDR("10.0.0.1/8"))).toBe(true)
	expect(address.matchCIDR(IPv4.parseCIDR("10.0.0.10/8"))).toBe(true)
	expect(address.matchCIDR(IPv4.parseCIDR("10.0.0.10/8"))).toBe(true)
	expect(address.matchCIDR(IPv4.parseCIDR("10.5.5.0/16"))).toBe(true)
	expect(address.matchCIDR(IPv4.parseCIDR("10.4.5.0/16"))).toBe(false)
	expect(address.matchCIDR(IPv4.parseCIDR("10.4.5.0/15"))).toBe(true)
	expect(address.matchCIDR(IPv4.parseCIDR("10.5.0.2/32"))).toBe(false)
	expect(address.matchCIDR(IPv4.parseCIDR("10.5.0.1/32"))).toBe(true)
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
	expect(IPv6.parseCIDR("0:0:0:0:0:0:0:0/64").toString()).toBe("::/64")
	expect(IPv6.parseCIDR("0:0:0:ff:ff:0:0:0/64").toString()).toBe("::ff:ff:0:0:0/64")

	expect(IPv6.parseCIDR("2001:db8:ff:abc:def:123b:456c:78d/64").toString())
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
	expect(parse("1")).toEqual(IPv4.fromBytes(0, 0, 0, 1))
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
	expect(IPv6.isValid("1")).toBe(false)
	expect(IPv6.isValid("::8:8:8:8:8:8:8:8:8")).toBe(false)
	expect(IPv6.isValid("::8:8:8:8:8:8:8:8:8%z")).toBe(false)
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

	expect(address.matchCIDR(IPv6.parseCIDR("::/0"))).toBe(true)
	expect(address.matchCIDR(IPv6.parseCIDR("2001:db8:f53a::1:1/64"))).toBe(true)
	expect(address.matchCIDR(IPv6.parseCIDR("2001:db8:f53b::1:1/48"))).toBe(false)
	expect(address.matchCIDR(IPv6.parseCIDR("2001:db8:f531::1:1/44"))).toBe(true)
	expect(address.matchCIDR(IPv6.parseCIDR("2001:db8:f500::1/40"))).toBe(true)
	expect(address.matchCIDR(IPv6.parseCIDR("2001:db8:f500::1%z/40"))).toBe(true)
	expect(address.matchCIDR(IPv6.parseCIDR("2001:db9:f500::1/40"))).toBe(false)
	expect(address.matchCIDR(IPv6.parseCIDR("2001:db9:f500::1%z/40"))).toBe(false)
	expect(address.matchCIDR(IPv6.parseCIDR("2001:db8:f53a::1/128"))).toBe(true)
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

test("isValid()", () => {
	expect(isValid("4999999999")).toBe(false)
	expect(isValid("-1")).toBe(false)
})

test("subnetMatch()", () => {
	expect(subnetMatch(IPv4.fromBytes(1, 2, 3, 4), new Map, "foo")).toBe("foo")
	expect(subnetMatch(IPv4.fromBytes(1, 2, 3, 4), new Map([ [ "subnet", [] ] ]), "bar")).toBe("bar")

	expect(subnetMatch(IPv4.fromBytes(1, 2, 3, 4), new Map([ [ "subnet6", [ parseCIDR("fe80::/64") ] ] ]), "foo")).
		toBe("foo")

	expect(subnetMatch(
		IPv6.fromHextets(0xFE80, 0, 0, 0, 0, 0, 0, 1), new Map([ [ "subnet4", [ parseCIDR("1.2.3.0/24") ] ] ]),
		"foo"
	)).toBe("foo")

	const rangeList: RangeList<IPv4 | IPv6> =
		new Map([ [ "dual64", [ parseCIDR("1.2.4.0/24"), parseCIDR("2001:1:2:3::/64") ] ] ])

	expect(subnetMatch(IPv4.fromBytes(1, 2, 4, 1), rangeList, "foo")).toBe("dual64")
	expect(subnetMatch(IPv6.fromHextets(0x2001, 1, 2, 3, 0, 0, 0, 1), rangeList, "foo")).toBe("dual64")
})

test("fromByteArray()", () => {
	expect(fromByteArray([ 0x7f, 0, 0, 1 ])).instanceOf(IPv4)
	expect(fromByteArray([ 0x20, 0x01, 0xd, 0xb8, 0xf5, 0x3a, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ])).instanceOf(IPv6)
	expect(() => fromByteArray([ 1 ])).toThrow()
})

test("IPv4.prototype.prefixLengthFromSubnetMask()", () => {
	expect(IPv4.parse("255.255.255.255").prefixLengthFromSubnetMask()).toBe(32)
	expect(IPv4.parse("255.255.255.254").prefixLengthFromSubnetMask()).toBe(31)
	expect(IPv4.parse("255.255.255.252").prefixLengthFromSubnetMask()).toBe(30)
	expect(IPv4.parse("255.255.255.248").prefixLengthFromSubnetMask()).toBe(29)
	expect(IPv4.parse("255.255.255.240").prefixLengthFromSubnetMask()).toBe(28)
	expect(IPv4.parse("255.255.255.224").prefixLengthFromSubnetMask()).toBe(27)
	expect(IPv4.parse("255.255.255.192").prefixLengthFromSubnetMask()).toBe(26)
	expect(IPv4.parse("255.255.255.128").prefixLengthFromSubnetMask()).toBe(25)
	expect(IPv4.parse("255.255.255.0").prefixLengthFromSubnetMask()).toBe(24)
	expect(IPv4.parse("255.255.254.0").prefixLengthFromSubnetMask()).toBe(23)
	expect(IPv4.parse("255.255.252.0").prefixLengthFromSubnetMask()).toBe(22)
	expect(IPv4.parse("255.255.248.0").prefixLengthFromSubnetMask()).toBe(21)
	expect(IPv4.parse("255.255.240.0").prefixLengthFromSubnetMask()).toBe(20)
	expect(IPv4.parse("255.255.224.0").prefixLengthFromSubnetMask()).toBe(19)
	expect(IPv4.parse("255.255.192.0").prefixLengthFromSubnetMask()).toBe(18)
	expect(IPv4.parse("255.255.128.0").prefixLengthFromSubnetMask()).toBe(17)
	expect(IPv4.parse("255.255.0.0").prefixLengthFromSubnetMask()).toBe(16)
	expect(IPv4.parse("255.254.0.0").prefixLengthFromSubnetMask()).toBe(15)
	expect(IPv4.parse("255.252.0.0").prefixLengthFromSubnetMask()).toBe(14)
	expect(IPv4.parse("255.248.0.0").prefixLengthFromSubnetMask()).toBe(13)
	expect(IPv4.parse("255.240.0.0").prefixLengthFromSubnetMask()).toBe(12)
	expect(IPv4.parse("255.224.0.0").prefixLengthFromSubnetMask()).toBe(11)
	expect(IPv4.parse("255.192.0.0").prefixLengthFromSubnetMask()).toBe(10)
	expect(IPv4.parse("255.128.0.0").prefixLengthFromSubnetMask()).toBe(9)
	expect(IPv4.parse("255.0.0.0").prefixLengthFromSubnetMask()).toBe(8)
	expect(IPv4.parse("254.0.0.0").prefixLengthFromSubnetMask()).toBe(7)
	expect(IPv4.parse("252.0.0.0").prefixLengthFromSubnetMask()).toBe(6)
	expect(IPv4.parse("248.0.0.0").prefixLengthFromSubnetMask()).toBe(5)
	expect(IPv4.parse("240.0.0.0").prefixLengthFromSubnetMask()).toBe(4)
	expect(IPv4.parse("224.0.0.0").prefixLengthFromSubnetMask()).toBe(3)
	expect(IPv4.parse("192.0.0.0").prefixLengthFromSubnetMask()).toBe(2)
	expect(IPv4.parse("128.0.0.0").prefixLengthFromSubnetMask()).toBe(1)
	expect(IPv4.parse("0.0.0.0").prefixLengthFromSubnetMask()).toBe(0)
	expect(IPv4.parse("192.168.255.0").prefixLengthFromSubnetMask()).toBe(null)
	expect(IPv4.parse("255.0.255.0").prefixLengthFromSubnetMask()).toBe(null)
})

test("IPv6.prototype.prefixLengthFromSubnetMask()", () => {
	expect(IPv6.parse("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff").prefixLengthFromSubnetMask()).toBe(128)
	expect(IPv6.parse("ffff:ffff:ffff:ffff::").prefixLengthFromSubnetMask()).toBe(64)
	expect(IPv6.parse("ffff:ffff:ffff:ff80::").prefixLengthFromSubnetMask()).toBe(57)
	expect(IPv6.parse("ffff:ffff:ffff::").prefixLengthFromSubnetMask()).toBe(48)
	expect(IPv6.parse("ffff:ffff:ffff::%z").prefixLengthFromSubnetMask()).toBe(48)
	expect(IPv6.parse("::").prefixLengthFromSubnetMask()).toBe(0)
	expect(IPv6.parse("::%z").prefixLengthFromSubnetMask()).toBe(0)
	expect(IPv6.parse("2001:db8::").prefixLengthFromSubnetMask()).toBe(null)
	expect(IPv6.parse("ffff:0:0:ffff::").prefixLengthFromSubnetMask()).toBe(null)
	expect(IPv6.parse("ffff:0:0:ffff::%z").prefixLengthFromSubnetMask()).toBe(null)
})

test("IPv4.subnetMaskFromPrefixLength()", () => {
	expect(IPv4.subnetMaskFromPrefixLength(0)).toEqual(IPv4.parse("0.0.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(1)).toEqual(IPv4.parse("128.0.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(2)).toEqual(IPv4.parse("192.0.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(3)).toEqual(IPv4.parse("224.0.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(4)).toEqual(IPv4.parse("240.0.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(5)).toEqual(IPv4.parse("248.0.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(6)).toEqual(IPv4.parse("252.0.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(7)).toEqual(IPv4.parse("254.0.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(8)).toEqual(IPv4.parse("255.0.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(9)).toEqual(IPv4.parse("255.128.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(10)).toEqual(IPv4.parse("255.192.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(11)).toEqual(IPv4.parse("255.224.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(12)).toEqual(IPv4.parse("255.240.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(13)).toEqual(IPv4.parse("255.248.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(14)).toEqual(IPv4.parse("255.252.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(15)).toEqual(IPv4.parse("255.254.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(16)).toEqual(IPv4.parse("255.255.0.0"))
	expect(IPv4.subnetMaskFromPrefixLength(17)).toEqual(IPv4.parse("255.255.128.0"))
	expect(IPv4.subnetMaskFromPrefixLength(18)).toEqual(IPv4.parse("255.255.192.0"))
	expect(IPv4.subnetMaskFromPrefixLength(19)).toEqual(IPv4.parse("255.255.224.0"))
	expect(IPv4.subnetMaskFromPrefixLength(20)).toEqual(IPv4.parse("255.255.240.0"))
	expect(IPv4.subnetMaskFromPrefixLength(21)).toEqual(IPv4.parse("255.255.248.0"))
	expect(IPv4.subnetMaskFromPrefixLength(22)).toEqual(IPv4.parse("255.255.252.0"))
	expect(IPv4.subnetMaskFromPrefixLength(23)).toEqual(IPv4.parse("255.255.254.0"))
	expect(IPv4.subnetMaskFromPrefixLength(24)).toEqual(IPv4.parse("255.255.255.0"))
	expect(IPv4.subnetMaskFromPrefixLength(25)).toEqual(IPv4.parse("255.255.255.128"))
	expect(IPv4.subnetMaskFromPrefixLength(26)).toEqual(IPv4.parse("255.255.255.192"))
	expect(IPv4.subnetMaskFromPrefixLength(27)).toEqual(IPv4.parse("255.255.255.224"))
	expect(IPv4.subnetMaskFromPrefixLength(28)).toEqual(IPv4.parse("255.255.255.240"))
	expect(IPv4.subnetMaskFromPrefixLength(29)).toEqual(IPv4.parse("255.255.255.248"))
	expect(IPv4.subnetMaskFromPrefixLength(30)).toEqual(IPv4.parse("255.255.255.252"))
	expect(IPv4.subnetMaskFromPrefixLength(31)).toEqual(IPv4.parse("255.255.255.254"))
	expect(IPv4.subnetMaskFromPrefixLength(32)).toEqual(IPv4.parse("255.255.255.255"))
})

test("IPv6.subnetMaskFromPrefixLength()", () => {
	expect(IPv6.subnetMaskFromPrefixLength(128)).toEqual(IPv6.parse("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff"))
	expect(IPv6.subnetMaskFromPrefixLength(112)).toEqual(IPv6.parse("ffff:ffff:ffff:ffff:ffff:ffff:ffff:0"))
	expect(IPv6.subnetMaskFromPrefixLength(96)).toEqual(IPv6.parse("ffff:ffff:ffff:ffff:ffff:ffff::"))
	expect(IPv6.subnetMaskFromPrefixLength(72)).toEqual(IPv6.parse("ffff:ffff:ffff:ffff:ff00::"))
	expect(IPv6.subnetMaskFromPrefixLength(64)).toEqual(IPv6.parse("ffff:ffff:ffff:ffff::"))
	expect(IPv6.subnetMaskFromPrefixLength(48)).toEqual(IPv6.parse("ffff:ffff:ffff::"))
	expect(IPv6.subnetMaskFromPrefixLength(32)).toEqual(IPv6.parse("ffff:ffff::"))
	expect(IPv6.subnetMaskFromPrefixLength(16)).toEqual(IPv6.parse("ffff::"))
	expect(IPv6.subnetMaskFromPrefixLength(8)).toEqual(IPv6.parse("ff00::"))
	expect(IPv6.subnetMaskFromPrefixLength(4)).toEqual(IPv6.parse("f000::"))
	expect(IPv6.subnetMaskFromPrefixLength(2)).toEqual(IPv6.parse("c000::"))
	expect(IPv6.subnetMaskFromPrefixLength(1)).toEqual(IPv6.parse("8000::"))
	expect(IPv6.subnetMaskFromPrefixLength(0)).toEqual(IPv6.parse("::"))
})

test("IPv4.broadcastAddressFromCIDR()", () => {
	expect(IPv4.broadcastAddressFromCIDR("172.0.0.1/24")).toEqual(IPv4.parse("172.0.0.255"))
	expect(IPv4.broadcastAddressFromCIDR("172.0.0.1/26")).toEqual(IPv4.parse("172.0.0.63"))
	expect(IPv4.networkAddressFromCIDR("172.0.0.1/24")).toEqual(IPv4.parse("172.0.0.0"))
	expect(IPv4.networkAddressFromCIDR("172.0.0.1/5")).toEqual(IPv4.parse("168.0.0.0"))
})

test("IPv6.networkAddressFromCIDR()", () => {
	expect(IPv6.networkAddressFromCIDR("::/0")).toEqual(IPv6.parse("::"))
	expect(IPv6.networkAddressFromCIDR("2001:db8:f53a::1:1/64")).toEqual(IPv6.parse("2001:db8:f53a::"))
	expect(IPv6.networkAddressFromCIDR("2001:db8:f53b::1:1/48")).toEqual(IPv6.parse("2001:db8:f53b::"))
	expect(IPv6.networkAddressFromCIDR("2001:db8:f531::1:1/44")).toEqual(IPv6.parse("2001:db8:f530::"))
	expect(IPv6.networkAddressFromCIDR("2001:db8:f500::1/40")).toEqual(IPv6.parse("2001:db8:f500::"))
	expect(IPv6.networkAddressFromCIDR("2001:db8:f500::1%z/40")).toEqual(IPv6.parse("2001:db8:f500::"))
	expect(IPv6.networkAddressFromCIDR("2001:db9:f500::1/40")).toEqual(IPv6.parse("2001:db9:f500::"))
	expect(IPv6.networkAddressFromCIDR("2001:db9:f500::1%z/40")).toEqual(IPv6.parse("2001:db9:f500::"))
	expect(IPv6.networkAddressFromCIDR("2001:db8:f53a::1/128")).toEqual(IPv6.parse("2001:db8:f53a::1"))
})

test("IPv6.broadcastAddressFromCIDR()", () => {
	expect(IPv6.broadcastAddressFromCIDR("::/0")).toEqual(IPv6.parse("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff"))
	expect(IPv6.broadcastAddressFromCIDR("2001:db8:f53a::1:1/64")).toEqual(IPv6.parse("2001:db8:f53a:0:ffff:ffff:ffff:ffff"))
	expect(IPv6.broadcastAddressFromCIDR("2001:db8:f53b::1:1/48")).toEqual(IPv6.parse("2001:db8:f53b:ffff:ffff:ffff:ffff:ffff"))
	expect(IPv6.broadcastAddressFromCIDR("2001:db8:f531::1:1/44")).toEqual(IPv6.parse("2001:db8:f53f:ffff:ffff:ffff:ffff:ffff"))
	expect(IPv6.broadcastAddressFromCIDR("2001:db8:f500::1/40")).toEqual(IPv6.parse("2001:db8:f5ff:ffff:ffff:ffff:ffff:ffff"))
	expect(IPv6.broadcastAddressFromCIDR("2001:db8:f500::1%z/40")).toEqual(IPv6.parse("2001:db8:f5ff:ffff:ffff:ffff:ffff:ffff"))
	expect(IPv6.broadcastAddressFromCIDR("2001:db9:f500::1/40")).toEqual(IPv6.parse("2001:db9:f5ff:ffff:ffff:ffff:ffff:ffff"))
	expect(IPv6.broadcastAddressFromCIDR("2001:db9:f500::1%z/40")).toEqual(IPv6.parse("2001:db9:f5ff:ffff:ffff:ffff:ffff:ffff"))
	expect(IPv6.broadcastAddressFromCIDR("2001:db8:f53a::1/128")).toEqual(IPv6.parse("2001:db8:f53a::1"))
})
