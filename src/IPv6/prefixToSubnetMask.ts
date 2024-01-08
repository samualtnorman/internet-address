import type { IPv6, Prefix } from "../IPv6"
import { fromHextets } from "./fromHextets"

/** A utility function to return subnet mask in IPv6 format given the prefix length */
export function prefixToSubnetMask(prefix: Prefix): IPv6 {
	const subnetMask = fromHextets(0, 0, 0, 0, 0, 0, 0, 0)
	const filledHextetCount = Math.floor(prefix / 16)

	for (let index = 0; index < filledHextetCount; index++)
		subnetMask.hextets[index] = 0xFFFF

	if (filledHextetCount < 32)
		subnetMask.hextets[filledHextetCount] = ((2 ** (prefix % 16)) - 1) << (16 - (prefix % 16))

	return subnetMask
}
