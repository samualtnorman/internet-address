import type { IPvXRangeDefaults } from "../internal"

declare const IPv4Tag: unique symbol

export type IPv4 = Uint8Array & { [IPv4Tag]: typeof IPv4Tag }
export type Range = IPvXRangeDefaults | "broadcast" | "carrierGradeNat" | "private"
