import type { Prefix } from "../IPv6"

export const numberIsPrefix = (number: number): number is Prefix => number >= 0 && number < 129
