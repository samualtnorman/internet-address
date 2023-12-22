import type { IPv6 } from "../IPv6"

/** @returns Number of leading ones, making sure that the rest is a solid sequence of zeros (valid netmask)
  * @returns Either the CIDR length or undefined if mask is not valid */
export function prefixLengthFromSubnetMask(ipv6: IPv6): number | undefined {
	let /** non-zero encountered stop scanning for zeros */ stop = false
	let cidr = 0

	for (let index = 8; index--;) {
		const zeros = {
			0: 16,
			32_768: 15,
			49_152: 14,
			57_344: 13,
			61_440: 12,
			63_488: 11,
			64_512: 10,
			65_024: 9,
			65_280: 8,
			65_408: 7,
			65_472: 6,
			65_504: 5,
			65_520: 4,
			65_528: 3,
			65_532: 2,
			65_534: 1,
			65_535: 0
		}[ipv6.hextets[index]!]

		if (zeros == undefined || (stop && zeros != 0))
			return

		if (zeros != 16)
			stop = true

		cidr += zeros
	}

	return 128 - cidr
}
