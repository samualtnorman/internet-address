import type { IPv6 } from "../IPv6"

/** @returns parsed `CIDR` or `undefined` if invalid */
export function parseCIDR(addr: string): CIDR<IPv6> | undefined {
	const match = /^(.+)\/(\d+)$/.exec(addr)

	if (match) {
		const maskLength = parseInt(match[2]!)

		if (maskLength >= 0 && maskLength <= 128) {
			const parsed = parse(match[1]!)

			if (parsed)
				return new CIDR(parsed, maskLength)
		}
	}
}
