#!/usr/bin/env node
import { mkdirSync as makeDirectorySync, writeFileSync } from "fs"
import packageJson from "../package.json" with { type: "json" }
import { getExports } from "./lib/exports.js"

const { version, license } = packageJson

makeDirectorySync("dist", { recursive: true })

writeFileSync(
	"dist/jsr.json",
	JSON.stringify({ name: `@sn/ip-address`, version, license, exports: await getExports(`.d.ts`, `.js`) }, undefined, "\t")
)

process.exit()
