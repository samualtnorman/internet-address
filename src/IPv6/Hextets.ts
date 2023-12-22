export { fromUint16Array } from "./Hextets/fromUint16Array"

/** Does not exist at runtime, just for faking nominal typing in typescript. */
declare const HextetsTag: unique symbol

/** Eight big-endian 16-bit unsigned integers. */
export type Hextets = Uint16Array & { [HextetsTag]: typeof HextetsTag }
