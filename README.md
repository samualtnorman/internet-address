# `internet-address`
This is a tiny IPv4 and IPv6 utility library forked from [`ipaddr.js`](https://www.npmjs.com/package/ipaddr.js).

Requires Node.js 18.20+, 20.10+, 22.0+, or above.

## Highlights
- [Tree-Shaking](#tree-shaking)
- [Small Bundle Size](#small-bundle-size)
- [Browser Support](#browser-support)
- [No Unnecessary Abstractions](#no-unnecessary-abstractions)

### Tree-Shaking
`internet-address` supports tree shaking meaning you can pull in only the functionality you need versus `ipaddr.js`'s
all-or-nothing approach.

### Small Bundle Size
Pulling in every module costs under 3KiB minified and gzipped. This package supports tree shaking however meaning if you
only need IPv4 parsing for example, it'll only cost you 1.1KiB instead of the full 3KiB.

### Browser Support
This package is written in standard ESM using only JavaScript builtins meaning it can be imported into browsers via a
CDN without Node.js polyfills:
```js
import { IPv4, IPv6, CIDR, process, subnetMatch } from "https://esm.sh/internet-address"
```

### No Unnecessary Abstractions
An IPv4 address is an array of 4 bytes so `IPv4.parse()` returns you a `Uint8Array` of 4 bytes. No need for
serialization, the data type is already in its basic form.

## Usage
Install with `npm install internet-address`. Make sure you have `"type": "module"` in your `package.json`.

Import the utilities with:
```js
import { IPv4, IPv6, CIDR, process, subnetMatch } from "internet-address"
```
---
- [View full documentation.](https://samualtnorman.github.io/internet-address/)
- [View demo using this package.](https://samualtnorman.github.io/ipv4-formatter/)
