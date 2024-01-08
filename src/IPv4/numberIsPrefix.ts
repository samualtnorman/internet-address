import type { Prefix } from "../IPv4"

export const numberIsPrefix = (number: number): number is Prefix => number >= 0 && number < 33
