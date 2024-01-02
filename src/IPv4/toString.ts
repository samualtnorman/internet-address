import type { IPv4 } from "../IPv4"

/** @returns The address in convenient, decimal-dotted format. */
export const toString = (address: IPv4): string => address.join(`.`)
