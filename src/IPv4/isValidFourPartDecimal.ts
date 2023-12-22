import { parse } from "./parse"

/** Checks if a given string is a full four-part IPv4 Address. */
export const isValidFourPartDecimal = (address: string): boolean =>
	Boolean(/^(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*)){3}$/.test(address) && parse(address))
