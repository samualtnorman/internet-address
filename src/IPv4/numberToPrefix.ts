import type { Prefix } from "../IPv4"
import { numberIsPrefix } from "./numberIsPrefix"

export function numberToPrefix(number: number): Prefix {
	if (numberIsPrefix(number))
		return number

	throw Error(`Mask length should be between 0 and 32 (inclusive)`)
}
