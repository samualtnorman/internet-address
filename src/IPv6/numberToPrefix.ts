import type { Prefix } from "../IPv6"
import { numberIsPrefix } from "./numberIsPrefix"

export function numberToPrefix(number: number): Prefix {
	if (numberIsPrefix(number))
		return number

	throw Error(`Mask length should be between 0 and 128 (inclusive)`)
}
