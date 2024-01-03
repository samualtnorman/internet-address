import type { RangeList } from "./CIDR"
import * as IPv4 from "./IPv4"
import * as IPv6 from "./IPv6"
import type { StringSuggest } from "./internal"

/** A utility function to ease named range matching. See examples below.
  * rangeList can contain both IPv4 and IPv6 subnet entries and will not throw errors
  * on matching IPv4 addresses to IPv6 ranges or vice versa. */
export function subnetMatch<T extends IPv4.IPv4 | IPv6.IPv6>(
	address: T,
	rangeList: RangeList<T>,
	defaultName: StringSuggest<T extends IPv4.IPv4 ? IPv4.Range : IPv6.Range> = `unicast`
): StringSuggest<T extends IPv4.IPv4 ? IPv4.Range : IPv6.Range> {
	if (address instanceof Uint8Array) {
		for (const [ rangeName, rangeSubnets ] of rangeList) {
			for (const subnet of rangeSubnets) {
				if (subnet.address instanceof Uint8Array && IPv4.match(address, subnet.address, subnet.maskLength))
					return rangeName
			}
		}
	} else {
		for (const [ rangeName, rangeSubnets ] of rangeList) {
			for (const subnet of rangeSubnets) {
				if (!(subnet.address instanceof Uint8Array) && IPv6.match(address, subnet.address, subnet.maskLength))
					return rangeName
			}
		}
	}

	return defaultName
}
