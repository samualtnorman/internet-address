import * as CIDR from "../CIDR"
import type { IPv6 } from "../IPv6"
import { parse } from "./parse"

/** @returns parsed `CIDR` or `undefined` if invalid */
export function parseCIDR(addr: string): CIDR.CIDR<IPv6> | undefined {
	const match = /^(.+)\/(\d+)$/.exec(addr)

	if (match) {
		const maskLength = parseInt(match[2]!)

		if (maskLength >= 0 && maskLength <= 128) {
			const ip = parse(match[1]!)

			if (ip)
				return { ip, maskLength }
		}
	}
}
