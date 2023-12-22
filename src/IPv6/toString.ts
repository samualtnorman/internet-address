import type { IPv6 } from "../IPv6"
import { toNormalizedString } from "./toNormalizedString"

/** @returns The address in compact, human-readable format like `2001:db8:8:66::1` in line with RFC 5952.
  * @see https://tools.ietf.org/html/rfc5952#section-4 */
  export function toString(ipv6: IPv6): string {
	const regex = /(?:^|:)(?:0(?::|$)){2,}/g
	const string = toNormalizedString(ipv6)
	let bestMatchIndex = 0
	let bestMatchLength = -1
	let match

	while ((match = regex.exec(string))) {
		if (match[0].length > bestMatchLength) {
			bestMatchIndex = match.index
			bestMatchLength = match[0].length
		}
	}

	if (bestMatchLength < 0)
		return string

	return `${string.slice(0, Math.max(0, bestMatchIndex))}::${
		string.slice(Math.max(0, bestMatchIndex + bestMatchLength))}`
}
