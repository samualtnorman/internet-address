import * as CIDR from "../CIDR"
import type { IPv4 } from "../IPv4"
import { parse } from "./parse"

/** Parses the string as an IPv4 Address with CIDR Notation. */
export function parseCIDR(address: string): CIDR.CIDR<IPv4> | undefined {
	const match = /^(.+)\/(\d+)$/.exec(address)

	if (match) {
		const maskLength = Number(match[2])

		if (match[1] && maskLength >= 0 && maskLength <= 32) {
			const ip = parse(match[1])

			if (ip)
				return { ip, maskLength }
		}
	}
}
