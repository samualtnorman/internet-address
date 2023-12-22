import type { IPv4 } from "./common"

/** @returns The address in convenient, decimal-dotted format. */
export const toString = (address: IPv4): string => address.join(`.`)
