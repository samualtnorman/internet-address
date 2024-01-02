import type { IPv4 } from "../IPv4"

export const is = (ip: any): ip is IPv4 => ip instanceof Uint8Array && ip.length == 4
