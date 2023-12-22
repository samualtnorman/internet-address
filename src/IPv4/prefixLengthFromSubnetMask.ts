import type { IPv4 } from "./common"

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
