export function parseIntAuto(string: string): number {
	// Hexadedimal base 16 (0x#)
	if (/^0x[a-f\d]+$/i.test(string))
		return parseInt(string, 16)

	// While octal representation is discouraged by ECMAScript 3
	// and forbidden by ECMAScript 5, we silently allow it to
	// work only if the rest of the string has numbers less than 8.
	if (string[0] === `0` && !isNaN(parseInt(string[1]!, 10))) {
		if (/^0[0-7]+$/.test(string))
			return parseInt(string, 8)

		return NaN
	}

	// Always include the base 10 radix!
	return parseInt(string, 10)
}
